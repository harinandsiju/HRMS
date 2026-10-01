const mongoose = require("mongoose");

const ActivityLog = require("../models/ActivityLog");
const Employee = require("../models/Employee");


// ======================================================
// GET ALL ACTIVITY LOGS
// ======================================================

const getAllActivityLogs = async (req, res) => {
    try {
        const {
            employeeId,
            module,
            userId,
            date,
            page = 1,
            limit = 20
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1
        ) {
            return res.status(400).json({
                message: "Page must be a positive integer"
            });
        }

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                message: "Limit must be between 1 and 100"
            });
        }

        const filter = {};

        // Employee filter
        if (employeeId) {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    message: "Invalid employee ID"
                });
            }

            filter.employeeId = employeeId;
        }

        // User filter
        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    message: "Invalid user ID"
                });
            }

            filter.userId = userId;
        }

        // Module filter
        if (module) {
            filter.module = module;
        }

        // Date filter
        if (date) {
            const dateParts = date.split("-");

            if (dateParts.length !== 3) {
                return res.status(400).json({
                    message: "Invalid date"
                });
            }

            const year = Number(dateParts[0]);
            const month = Number(dateParts[1]);
            const day = Number(dateParts[2]);

            if (
                !year ||
                !month ||
                !day
            ) {
                return res.status(400).json({
                    message: "Invalid date"
                });
            }

            /*
             * Build the selected calendar day using UTC.
             * This prevents the browser/India timezone from
             * shifting the requested date.
             */
            const startOfDay = new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day
                )
            );

            const startOfNextDay = new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day + 1
                )
            );

            filter.createdAt = {
                $gte: startOfDay,
                $lt: startOfNextDay
            };
        }

        const totalLogs =
            await ActivityLog.countDocuments(filter);

        const logs =
            await ActivityLog.find(filter)
                .populate(
                    "userId",
                    "email role employeeId"
                )
                .populate(
                    "employeeId",
                    "employeeCode firstName lastName"
                )
                .sort({
                    createdAt: -1
                })
                .skip(
                    (pageNumber - 1) *
                    limitNumber
                )
                .limit(limitNumber);

        return res.status(200).json({
            message:
                "Activity logs fetched successfully",
            count: logs.length,
            totalLogs,
            currentPage: pageNumber,
            totalPages:
                Math.ceil(
                    totalLogs / limitNumber
                ),
            logs
        });

    } catch (error) {
        console.error(
            "Get All Activity Logs Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// ======================================================
// GET ACTIVITY LOGS BY EMPLOYEE
// ======================================================

const getActivityLogsByEmployee = async (
    req,
    res
) => {
    try {
        const { employeeId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                employeeId
            )
        ) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const employee =
            await Employee.findOne({
                _id: employeeId,
                isActive: true,
                isDeleted: false
            });

        if (!employee) {
            return res.status(404).json({
                message:
                    "Active employee not found"
            });
        }

        const logs =
            await ActivityLog.find({
                employeeId
            })
                .populate(
                    "userId",
                    "email role employeeId"
                )
                .populate(
                    "employeeId",
                    "employeeCode firstName lastName"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            message:
                "Employee activity logs fetched successfully",

            employee: {
                _id: employee._id,
                employeeCode:
                    employee.employeeCode,
                firstName:
                    employee.firstName,
                lastName:
                    employee.lastName
            },

            count: logs.length,
            logs
        });

    } catch (error) {
        console.error(
            "Get Activity Logs By Employee Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// ======================================================
// DELETE ACTIVITY LOG
// ======================================================

const deleteActivityLog = async (
    req,
    res
) => {
    try {
        const { logId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                logId
            )
        ) {
            return res.status(400).json({
                message: "Invalid log ID"
            });
        }

        const log =
            await ActivityLog.findByIdAndDelete(
                logId
            );

        if (!log) {
            return res.status(404).json({
                message:
                    "Activity log not found"
            });
        }

        return res.status(200).json({
            message:
                "Activity log deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete Activity Log Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    getAllActivityLogs,
    getActivityLogsByEmployee,
    deleteActivityLog
};