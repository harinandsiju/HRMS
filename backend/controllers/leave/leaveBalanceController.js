const LeaveBalance = require("../../models/LeaveBalance");
const Employee = require("../../models/Employee");
const logActivity = require("../../helpers/activityLogger");
// Example annual allowances.
// Confirm the actual policy with your mentor before production use.
const DEFAULT_LEAVE_ALLOWANCES = {
    "Casual Leave": 12,
    "Sick Leave": 10,
    "Annual Leave": 12,
    "Emergency Leave": 3,
    "Other": 0
};

// Get the current calendar year.
const getCurrentYear = () => {
    return new Date().getFullYear();
};

// Find the active employee linked to the logged-in user.
const findMyEmployee = async (userId) => {
    return Employee.findOne({
        userId,
        isActive: true,
        isDeleted: false
    });
};

// Create missing balance records without overwriting existing balances.
const initializeLeaveBalances = async (employeeId, year) => {
    const leaveTypes = Object.keys(DEFAULT_LEAVE_ALLOWANCES);

    for (const leaveType of leaveTypes) {
        await LeaveBalance.updateOne(
            {
                employeeId,
                year,
                leaveType
            },
            {
                $setOnInsert: {
                    employeeId,
                    year,
                    leaveType,
                    totalDays: DEFAULT_LEAVE_ALLOWANCES[leaveType],
                    usedDays: 0
                }
            },
            {
                upsert: true,
                runValidators: true
            }
        );
    }
};

// Employee: View own leave balances.
const getMyLeaveBalances = async (req, res) => {
    try {
        const employee = await findMyEmployee(req.user.userId);

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found"
            });
        }

        const year = Number(req.query.year || getCurrentYear());

        if (!Number.isInteger(year) || year < 2000 || year > 9999) {
            return res.status(400).json({
                message: "Please provide a valid year"
            });
        }

        await initializeLeaveBalances(employee._id, year);

        const balances = await LeaveBalance.find({
            employeeId: employee._id,
            year
        }).sort({
            leaveType: 1
        });

        return res.status(200).json({
            message: "Leave balances fetched successfully",
            year,
            balances
        });
    } catch (error) {
        console.error("Get my leave balances error:", error);

        return res.status(500).json({
            message: "Failed to fetch leave balances"
        });
    }
};

// Admin: View an employee's leave balances.
const getEmployeeLeaveBalances = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const year = Number(req.query.year || getCurrentYear());

        if (!Number.isInteger(year) || year < 2000 || year > 9999) {
            return res.status(400).json({
                message: "Please provide a valid year"
            });
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        await initializeLeaveBalances(employee._id, year);

        const balances = await LeaveBalance.find({
            employeeId: employee._id,
            year
        }).sort({
            leaveType: 1
        });

        return res.status(200).json({
            message: "Employee leave balances fetched successfully",
            employee: {
                _id: employee._id,
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName
            },
            year,
            balances
        });
    } catch (error) {
        console.error("Get employee leave balances error:", error);

        return res.status(500).json({
            message: "Failed to fetch employee leave balances"
        });
    }
};

// Admin: Update an employee's allowance.
const updateEmployeeLeaveBalance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { year, leaveType, totalDays } = req.body;

        if (
            !Number.isInteger(Number(year)) ||
            Number(year) < 2000 ||
            Number(year) > 9999
        ) {
            return res.status(400).json({
                message: "Please provide a valid year"
            });
        }

        if (!Object.prototype.hasOwnProperty.call(
            DEFAULT_LEAVE_ALLOWANCES,
            leaveType
        )) {
            return res.status(400).json({
                message: "Invalid leave type"
            });
        }

        if (
            totalDays === undefined ||
            totalDays === null ||
            totalDays === "" ||
            !Number.isFinite(Number(totalDays)) ||
            Number(totalDays) < 0
        ) {
            return res.status(400).json({
                message: "totalDays must be a non-negative number"
            });
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        const selectedYear = Number(year);
        const allowance = Number(totalDays);

        await initializeLeaveBalances(employee._id, selectedYear);

        const balance = await LeaveBalance.findOne({
            employeeId: employee._id,
            year: selectedYear,
            leaveType
        });

        if (!balance) {
            return res.status(404).json({
                message: "Leave balance not found"
            });
        }

        if (allowance < balance.usedDays) {
            return res.status(400).json({
                message: "Allowance cannot be less than leave already used",
                usedDays: balance.usedDays
            });
        }

        balance.totalDays = allowance;

        await balance.save();

        if (typeof logActivity === "function") {
await logActivity({
  userId: req.user.userId,
  employeeId: employee._id,
  action: "UPDATE_LEAVE_BALANCE",
  module: "Leave",
  description: `Updated ${leaveType} allowance for employee ${employee.employeeCode}`,
  req,
});
        }

        return res.status(200).json({
            message: "Leave allowance updated successfully",
            balance
        });
    } catch (error) {
        console.error("Update employee leave balance error:", error);

        return res.status(500).json({
            message: "Failed to update leave allowance"
        });
    }
};

module.exports = {
    getMyLeaveBalances,
    getEmployeeLeaveBalances,
    updateEmployeeLeaveBalance
};