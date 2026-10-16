const mongoose = require("mongoose");

const Leave = require("../../models/Leave");
const LeaveBalance = require("../../models/LeaveBalance");
const Employee = require("../../models/Employee");
const User = require("../../models/User");
const logActivity = require("../../helpers/activityLogger");


// ==================================================
// HELPER: COUNT WORKING DAYS
// Excludes Saturdays and Sundays.
// Public holidays are not excluded.
// ==================================================

const calculateWorkingDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize dates to UTC calendar dates.
    const current = new Date(
        Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            start.getUTCDate()
        )
    );

    const last = new Date(
        Date.UTC(
            end.getUTCFullYear(),
            end.getUTCMonth(),
            end.getUTCDate()
        )
    );

    let workingDays = 0;

    while (current <= last) {
        const day = current.getUTCDay();

        // Sunday = 0, Saturday = 6.
        if (day !== 0 && day !== 6) {
            workingDays++;
        }

        current.setUTCDate(current.getUTCDate() + 1);
    }

    return workingDays;
};


// ==================================================
// HELPER: VALIDATE LEAVE DATES
// ==================================================

const validateLeaveDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return null;
    }

    if (start > end) {
        return null;
    }

    return {
        start,
        end
    };
};


// ==================================================
// APPLY LEAVE
// EMPLOYEE ONLY
// ==================================================

const applyLeave = async (req, res) => {
    try {
        const {
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (!user.employeeId) {
            return res.status(404).json({
                message:
                    "Employee account is not linked to an employee."
            });
        }

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

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                message:
                    "Leave type, start date, end date and reason are required."
            });
        }

        const validDates = validateLeaveDates(
            startDate,
            endDate
        );

        if (!validDates) {
            return res.status(400).json({
                message:
                    "Invalid dates or start date is after end date."
            });
        }

        const allowedLeaveTypes = [
            "Casual Leave",
            "Sick Leave",
            "Annual Leave",
            "Emergency Leave",
            "Other"
        ];

        if (!allowedLeaveTypes.includes(leaveType)) {
            return res.status(400).json({
                message: "Invalid leave type."
            });
        }

        if (
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                message: "Reason is required."
            });
        }

        const leave = await Leave.create({
            employeeId: user.employeeId,
            leaveType,
            startDate: validDates.start,
            endDate: validDates.end,
            reason: reason.trim()
        });

        return res.status(201).json({
            message:
                "Leave application submitted successfully.",
            leave
        });
    } catch (error) {
        console.error("Apply Leave Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// GET ALL LEAVE REQUESTS
// ADMIN ONLY
// ==================================================

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

        if (status) {
            filter.status = status;
        }

        if (leaveType) {
            filter.leaveType = leaveType;
        }

        if (startDate && endDate) {
            const rangeStartDate = new Date(startDate);
            const rangeEndDate = new Date(endDate);

            if (
                Number.isNaN(rangeStartDate.getTime()) ||
                Number.isNaN(rangeEndDate.getTime()) ||
                rangeStartDate > rangeEndDate
            ) {
                return res.status(400).json({
                    message: "Invalid date range."
                });
            }

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
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            message:
                "Leave requests fetched successfully.",
            count: leaveRecords.length,
            leaves: leaveRecords
        });
    } catch (error) {
        console.error("Get All Leaves Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// GET MY LEAVE REQUESTS
// EMPLOYEE ONLY
// ==================================================

const getMyLeaves = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (!user.employeeId) {
            return res.status(404).json({
                message:
                    "Employee account is not linked to an employee."
            });
        }

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

        const leaveRecords = await Leave.find({
            employeeId: user.employeeId,
            isActive: true
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            message:
                "Your leave requests fetched successfully.",
            count: leaveRecords.length,
            leaves: leaveRecords
        });
    } catch (error) {
        console.error("Get My Leaves Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// GET LEAVE REQUESTS BY EMPLOYEE
// ADMIN ONLY
// ==================================================

const getLeavesByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!mongoose.isValidObjectId(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID."
            });
        }

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

        const leaveRecords = await Leave.find({
            employeeId,
            isActive: true
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            message:
                "Employee leave requests fetched successfully.",
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
        console.error("Get Employee Leaves Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// APPROVE LEAVE REQUEST
// ADMIN ONLY
//
// Deducts working days from the relevant leave balance.
// Leave status and balance update occur in one transaction.
// ==================================================

const approveLeave = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { leaveId } = req.params;
        const { adminComment } = req.body;

        if (!mongoose.isValidObjectId(leaveId)) {
            return res.status(400).json({
                message: "Invalid leave request ID."
            });
        }

        let approvedLeave;

        await session.withTransaction(async () => {
            const leave = await Leave.findOne({
                _id: leaveId,
                isActive: true
            }).session(session);

            if (!leave) {
                const error = new Error(
                    "Leave request not found."
                );
                error.statusCode = 404;
                throw error;
            }

            if (leave.status !== "Pending") {
                const error = new Error(
                    "Only pending leave requests can be approved."
                );
                error.statusCode = 400;
                throw error;
            }

            const employee = await Employee.findOne({
                _id: leave.employeeId,
                isActive: true,
                isDeleted: false
            }).session(session);

            if (!employee) {
                const error = new Error(
                    "Employee not found or inactive."
                );
                error.statusCode = 404;
                throw error;
            }

            const workingDays = calculateWorkingDays(
                leave.startDate,
                leave.endDate
            );

            if (workingDays <= 0) {
                const error = new Error(
                    "This leave request contains no working days."
                );
                error.statusCode = 400;
                throw error;
            }

            // This implementation uses the year in which the
            // leave starts. Cross-year requests are rejected
            // because they must be split across annual balances.
            const startYear =
                leave.startDate.getUTCFullYear();

            const endYear =
                leave.endDate.getUTCFullYear();

            if (startYear !== endYear) {
                const error = new Error(
                    "Leave spanning two calendar years must be split into separate requests."
                );
                error.statusCode = 400;
                throw error;
            }

            const balance = await LeaveBalance.findOne({
                employeeId: leave.employeeId,
                year: startYear,
                leaveType: leave.leaveType
            }).session(session);

            if (!balance) {
                const error = new Error(
                    `No ${leave.leaveType} balance exists for ${startYear}. Initialize the employee's leave balances first.`
                );
                error.statusCode = 400;
                throw error;
            }

            const remainingDays =
                balance.totalDays - balance.usedDays;

            if (remainingDays < workingDays) {
                const error = new Error(
                    `Insufficient ${leave.leaveType} balance. Available: ${remainingDays} working days; requested: ${workingDays} working days.`
                );
                error.statusCode = 400;
                throw error;
            }

            // Atomic conditional update: prevents the balance
            // from being reduced below zero by concurrent requests.
            const updatedBalance =
                await LeaveBalance.findOneAndUpdate(
                    {
                        _id: balance._id,
                        usedDays: balance.usedDays,
                        $expr: {
                            $lte: [
                                {
                                    $add: [
                                        "$usedDays",
                                        workingDays
                                    ]
                                },
                                "$totalDays"
                            ]
                        }
                    },
                    {
                        $inc: {
                            usedDays: workingDays
                        }
                    },
                    {
                        new: true,
                        session,
                        runValidators: true
                    }
                );

            if (!updatedBalance) {
                const error = new Error(
                    "Leave balance changed during approval. Please try again."
                );
                error.statusCode = 409;
                throw error;
            }

            leave.status = "Approved";
            leave.deductedDays = workingDays;
            leave.balanceYear = startYear;

            if (adminComment !== undefined) {
                leave.adminComment = adminComment;
            }

            await leave.save({
                session
            });

            approvedLeave = leave;
        });

        // Activity logging is performed after the transaction
        // commits, so a logging failure cannot affect the deduction.
        await logActivity({
            userId: req.user.userId,
            employeeId: approvedLeave.employeeId,
            action: "Leave Approved",
            module: "Leave",
            description:
                `Approved ${approvedLeave.deductedDays} working days of ${approvedLeave.leaveType} for ${approvedLeave.startDate.toDateString()} - ${approvedLeave.endDate.toDateString()}`,
            req
        });

        return res.status(200).json({
            message:
                "Leave request approved and balance updated successfully.",
            leave: approvedLeave
        });
    } catch (error) {
        console.error("Approve Leave Error:", error);

        return res.status(
            error.statusCode || 500
        ).json({
            message:
                error.message || "Internal Server Error"
        });
    } finally {
        await session.endSession();
    }
};


// ==================================================
// REJECT LEAVE REQUEST
// ADMIN ONLY
// ==================================================

const rejectLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { adminComment } = req.body;

        if (!mongoose.isValidObjectId(leaveId)) {
            return res.status(400).json({
                message: "Invalid leave request ID."
            });
        }

        const leave = await Leave.findOne({
            _id: leaveId,
            isActive: true
        });

        if (!leave) {
            return res.status(404).json({
                message: "Leave request not found."
            });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave requests can be rejected."
            });
        }

        leave.status = "Rejected";

        if (adminComment !== undefined) {
            leave.adminComment = adminComment;
        }

        await leave.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: leave.employeeId,
            action: "Leave Rejected",
            module: "Leave",
            description:
                `Leave request rejected for period ${leave.startDate.toDateString()} - ${leave.endDate.toDateString()}`,
            req
        });

        return res.status(200).json({
            message:
                "Leave request rejected successfully.",
            leave
        });
    } catch (error) {
        console.error("Reject Leave Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// EDIT MY LEAVE REQUEST
// EMPLOYEE ONLY
// ==================================================

const updateMyLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;

        const {
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (!user.employeeId) {
            return res.status(404).json({
                message:
                    "Employee account is not linked to an employee."
            });
        }

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

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave requests can be edited."
            });
        }

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                message:
                    "Leave type, start date, end date and reason are required."
            });
        }

        const validDates = validateLeaveDates(
            startDate,
            endDate
        );

        if (!validDates) {
            return res.status(400).json({
                message:
                    "Invalid dates or start date is after end date."
            });
        }

        const allowedLeaveTypes = [
            "Casual Leave",
            "Sick Leave",
            "Annual Leave",
            "Emergency Leave",
            "Other"
        ];

        if (!allowedLeaveTypes.includes(leaveType)) {
            return res.status(400).json({
                message: "Invalid leave type."
            });
        }

        if (
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                message: "Reason is required."
            });
        }

        leave.leaveType = leaveType;
        leave.startDate = validDates.start;
        leave.endDate = validDates.end;
        leave.reason = reason.trim();

        await leave.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: user.employeeId,
            action: "Leave Updated",
            module: "Leave",
            description:
                `Employee updated leave request for period ${validDates.start.toDateString()} - ${validDates.end.toDateString()}`,
            req
        });

        return res.status(200).json({
            message:
                "Leave request updated successfully.",
            leave
        });
    } catch (error) {
        console.error("Update My Leave Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// DELETE MY LEAVE REQUEST
// EMPLOYEE ONLY
// ==================================================

const deleteMyLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (!user.employeeId) {
            return res.status(404).json({
                message:
                    "Employee account is not linked to an employee."
            });
        }

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

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    "Only pending leave requests can be deleted."
            });
        }

        leave.isActive = false;

        await leave.save();

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
        console.error("Delete My Leave Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// EXPORT CONTROLLERS
// ==================================================

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