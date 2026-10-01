const Leave = require("../../models/Leave");

const Employee = require("../../models/Employee");

const User = require("../../models/User");

const logActivity = require("../../helpers/activityLogger");

// Apply Leave

const applyLeave = async (req, res) => {
    try {
        const {
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;

        // Find logged-in user

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Employee account must be linked to an Employee

        if (!user.employeeId) {
            return res.status(404).json({
                message: "Employee account is not linked to an employee."
            });
        }

        // Get employee from logged-in user's employeeId

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Validate required fields

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                message:
                    "Leave type, start date, end date and reason are required."
            });
        }

        // Validate date range

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Check whether dates are valid

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid start date or end date."
            });
        }

        // Check date order

        if (start > end) {
            return res.status(400).json({
                message: "Start date cannot be after end date."
            });
        }

        // Create leave request

        const leave = await Leave.create({
            employeeId: user.employeeId,
            leaveType,
            startDate: start,
            endDate: end,
            reason
        });

        return res.status(201).json({
            message: "Leave application submitted successfully.",
            leave
        });
    } catch (error) {
        console.error(
            "Apply Leave Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get All Leave Requests

// ADMIN ONLY

const getAllLeaves = async (req, res) => {
    try {
        const {
            status,
            leaveType,
            startDate,
            endDate
        } = req.query;

        const filter = {
            isActive: true
        };

        // Filter by leave status

        if (status) {
            filter.status = status;
        }

        // Filter by leave type

        if (leaveType) {
            filter.leaveType = leaveType;
        }

        // Filter by date range

        if (startDate && endDate) {
            const rangeStartDate = new Date(startDate);
            const rangeEndDate = new Date(endDate);

            rangeEndDate.setUTCDate(
                rangeEndDate.getUTCDate() + 1
            );

            filter.startDate = {
                $lt: rangeEndDate
            };

            filter.endDate = {
                $gte: rangeStartDate
            };
        }

        // Get leave records

        const leaveRecords = await Leave.find(filter)
            .populate({
                path: "employeeId",
                select:
                    "employeeCode firstName lastName email departmentId",
                populate: {
                    path: "departmentId",
                    select: "name"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Leave requests fetched successfully.",
            count: leaveRecords.length,
            leaves: leaveRecords
        });
    } catch (error) {
        console.error(
            "Get All Leaves Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get My Leave Requests

// EMPLOYEE ONLY

const getMyLeaves = async (req, res) => {
    try {
        // Find logged-in user

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Employee account must be linked to an Employee

        if (!user.employeeId) {
            return res.status(404).json({
                message: "Employee account is not linked to an employee."
            });
        }

        // Verify employee exists and is active

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Get only this employee's leave requests

        const leaveRecords = await Leave.find({
            employeeId: user.employeeId,
            isActive: true
        })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Your leave requests fetched successfully.",
            count: leaveRecords.length,
            leaves: leaveRecords
        });
    } catch (error) {
        console.error(
            "Get My Leaves Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get Leave Requests by Employee

// ADMIN USE

const getLeavesByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Check whether employee exists

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Get leave requests

        const leaveRecords = await Leave.find({
            employeeId,
            isActive: true
        })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Employee leave requests fetched successfully.",
            employee: {
                _id: employee._id,
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName
            },
            count: leaveRecords.length,
            leaves: leaveRecords
        });
    } catch (error) {
        console.error(
            "Get Employee Leaves Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Approve Leave Request

// ADMIN ONLY

const approveLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { adminComment } = req.body;

        // Find leave request

        const leave = await Leave.findOne({
            _id: leaveId,
            isActive: true
        });

        if (!leave) {
            return res.status(404).json({
                message: "Leave request not found."
            });
        }

        // Check current status

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave requests can be approved."
            });
        }

        // Approve leave

        leave.status = "Approved";

        // Add optional admin comment

        if (adminComment !== undefined) {
            leave.adminComment = adminComment;
        }

        await leave.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: leave.employeeId,
            action: "Leave Approved",
            module: "Leave",
            description: `Leave request approved for period ${leave.startDate.toDateString()} - ${leave.endDate.toDateString()}`,
            req
        });

        return res.status(200).json({
            message: "Leave request approved successfully.",
            leave
        });
    } catch (error) {
        console.error(
            "Approve Leave Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Reject Leave Request

// ADMIN ONLY

const rejectLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { adminComment } = req.body;

        // Find leave request

        const leave = await Leave.findOne({
            _id: leaveId,
            isActive: true
        });

        if (!leave) {
            return res.status(404).json({
                message: "Leave request not found."
            });
        }

        // Check current status

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave requests can be rejected."
            });
        }

        // Reject leave

        leave.status = "Rejected";

        // Add optional admin comment

        if (adminComment !== undefined) {
            leave.adminComment = adminComment;
        }

        await leave.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: leave.employeeId,
            action: "Leave Rejected",
            module: "Leave",
            description: `Leave request rejected for period ${leave.startDate.toDateString()} - ${leave.endDate.toDateString()}`,
            req
        });

        return res.status(200).json({
            message: "Leave request rejected successfully.",
            leave
        });
    } catch (error) {
        console.error(
            "Reject Leave Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Edit My Leave Request

// EMPLOYEE ONLY

const updateMyLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;

        const {
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;

        // Find logged-in user

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Employee account must be linked

        if (!user.employeeId) {
            return res.status(404).json({
                message:
                    "Employee account is not linked to an employee."
            });
        }

        // Verify employee exists and is active

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Find only this employee's active leave

        const leave = await Leave.findOne({
            _id: leaveId,
            employeeId: user.employeeId,
            isActive: true
        });

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found or does not belong to you."
            });
        }

        // Only pending leave can be edited

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave requests can be edited."
            });
        }

        // Validate required fields

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                message:
                    "Leave type, start date, end date and reason are required."
            });
        }

        // Validate dates

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message:
                    "Invalid start date or end date."
            });
        }

        // Validate date order

        if (start > end) {
            return res.status(400).json({
                message:
                    "Start date cannot be after end date."
            });
        }

        // Update leave

        leave.leaveType = leaveType;
        leave.startDate = start;
        leave.endDate = end;
        leave.reason = reason.trim();

        await leave.save();

        // Activity log

        await logActivity({
            userId: req.user.userId,
            employeeId: user.employeeId,
            action: "Leave Updated",
            module: "Leave",
            description:
                `Employee updated leave request for period ${start.toDateString()} - ${end.toDateString()}`,
            req
        });

        return res.status(200).json({
            message:
                "Leave request updated successfully.",
            leave
        });
    } catch (error) {
        console.error(
            "Update My Leave Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Delete My Leave Request

// EMPLOYEE ONLY

const deleteMyLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;

        // Find logged-in user

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Employee account must be linked

        if (!user.employeeId) {
            return res.status(404).json({
                message:
                    "Employee account is not linked to an employee."
            });
        }

        // Verify employee exists and is active

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Find only this employee's active leave

        const leave = await Leave.findOne({
            _id: leaveId,
            employeeId: user.employeeId,
            isActive: true
        });

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found or does not belong to you."
            });
        }

        // Only pending leave can be deleted

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave requests can be deleted."
            });
        }

        // Soft delete

        leave.isActive = false;

        await leave.save();

        // Activity log

        await logActivity({
            userId: req.user.userId,
            employeeId: user.employeeId,
            action: "Leave Deleted",
            module: "Leave",
            description:
                `Employee deleted leave request for period ${leave.startDate.toDateString()} - ${leave.endDate.toDateString()}`,
            req
        });

        return res.status(200).json({
            message:
                "Leave request deleted successfully."
        });
    } catch (error) {
        console.error(
            "Delete My Leave Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


module.exports = {
    applyLeave,
    getAllLeaves,
    getMyLeaves,
    getLeavesByEmployee,
    updateMyLeave,
    deleteMyLeave,
    approveLeave,
    rejectLeave
};