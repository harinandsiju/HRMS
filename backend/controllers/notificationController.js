const mongoose = require("mongoose");

const logActivity = require("../helpers/activityLogger");
const Notification = require("../models/Notification");
const Employee = require("../models/Employee");
const User = require("../models/User");


// Create Notification (Admin - single employee or broadcast to all)
const createNotification = async (req, res) => {
    try {
        const { employeeId, title, message, type, broadcast } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                message: "Title and message are required"
            });
        }

        const validTypes = [
            "Info",
            "Warning",
            "Success",
            "Task",
            "Leave",
            "Payroll",
            "Other"
        ];

        if (type && !validTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid notification type"
            });
        }

        // Broadcast to all active employees
        if (broadcast === true) {
            const employees = await Employee.find({
                isActive: true,
                isDeleted: false
            }).select("_id");

            if (employees.length === 0) {
                return res.status(404).json({
                    message: "No active employees found to notify"
                });
            }

            const notifications = employees.map((emp) => ({
                employeeId: emp._id,
                title: title.trim(),
                message: message.trim(),
                type: type || "Info",
                createdBy: req.user.userId
            }));

            const created = await Notification.insertMany(notifications);

            return res.status(201).json({
                message: `Notification sent to ${created.length} employees`,
                count: created.length
            });
        }

        // Single employee notification
        if (!employeeId) {
            return res.status(400).json({
                message: "Employee ID is required (or set broadcast: true)"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }

        const notification = await Notification.create({
            employeeId,
            title: title.trim(),
            message: message.trim(),
            type: type || "Info",
            createdBy: req.user.userId
        });

        await logActivity({
            userId: req.user.userId,
            employeeId: employeeId,
            action: "Notification Created",
            module: "Notification",
            description: `Notification created for ${employee.firstName} ${employee.lastName}`,
            req
        });

        return res.status(201).json({
            message: "Notification created successfully",
            notification
        });

    } catch (error) {
        console.error("Create Notification Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



// Get All Notifications (Admin only)
const getAllNotifications = async (req, res) => {
    try {
        const { type, isRead, employeeId } = req.query;

        const filter = {
            isActive: true
        };

        if (type) {
            filter.type = type;
        }

        if (isRead !== undefined) {
            filter.isRead = isRead === "true";
        }

        if (employeeId) {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    message: "Invalid employee ID"
                });
            }

            filter.employeeId = employeeId;
        }

        const notifications = await Notification.find(filter)
            .populate(
                "employeeId",
                "firstName lastName employeeCode designation departmentId"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Notifications fetched successfully",
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error("Get All Notifications Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};




// Get My Notifications (Employee - own only)
const getMyNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user"
            });
        }

        const { isRead } = req.query;

        const filter = {
            employeeId: user.employeeId,
            isActive: true
        };

        if (isRead !== undefined) {
            filter.isRead = isRead === "true";
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            employeeId: user.employeeId,
            isActive: true,
            isRead: false
        });

        return res.status(200).json({
            message: "Notifications fetched successfully",
            count: notifications.length,
            unreadCount,
            notifications
        });

    } catch (error) {
        console.error("Get My Notifications Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Mark Single Notification as Read (Employee - own only)
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user"
            });
        }

        const notification = await Notification.findOne({
            _id: notificationId,
            isActive: true
        });

        if (!notification) {
            return res.status(404).json({
                message: "Active notification not found"
            });
        }

        // Ownership check
        if (notification.employeeId.toString() !== user.employeeId.toString()) {
            return res.status(403).json({
                message: "Access Denied. This notification does not belong to you."
            });
        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error("Mark As Read Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Mark All Notifications as Read (Employee - own only)
const markAllAsRead = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user"
            });
        }

        const result = await Notification.updateMany(
            {
                employeeId: user.employeeId,
                isActive: true,
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Mark All As Read Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Soft Delete Notification (Admin only)
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOne({
            _id: notificationId,
            isActive: true
        });

        if (!notification) {
            return res.status(404).json({
                message: "Active notification not found"
            });
        }

        // Employee can delete only their own notification
        if (req.user.role !== "Admin") {
            const user = await User.findById(req.user.userId);

            if (
                !user ||
                !user.employeeId ||
                !notification.employeeId ||
                user.employeeId.toString() !==
                    notification.employeeId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "Access Denied. You can only delete your own notifications."
                });
            }
        }

        // Soft delete
        notification.isActive = false;

        await notification.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: notification.employeeId,
            action: "Notification Deleted",
            module: "Notification",
            description: "Notification deleted",
            req
        });

        return res.status(200).json({
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete Notification Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    createNotification,
    getAllNotifications,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};