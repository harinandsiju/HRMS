const mongoose = require("mongoose");

const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const logActivity = require("../helpers/activityLogger");


// Create Payroll
const createPayroll = async (req, res) => {
    try {
        const {
            employeeId,
            month,
            year,
            basicSalary,
            allowances = 0,
            deductions = 0
        } = req.body;


        // 1. Validate required fields
        if (
            !employeeId ||
            month === undefined ||
            year === undefined ||
            basicSalary === undefined
        ) {
            return res.status(400).json({
                message: "Employee, month, year and basic salary are required"
            });
        }


        // 2. Validate employee ID
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }


        // 3. Validate salary values
        if (
            basicSalary < 0 ||
            allowances < 0 ||
            deductions < 0
        ) {
            return res.status(400).json({
                message: "Salary values cannot be negative"
            });
        }


        // 4. Validate month
        if (month < 1 || month > 12) {
            return res.status(400).json({
                message: "Month must be between 1 and 12"
            });
        }


        // 5. Validate year
        if (year < 2000) {
            return res.status(400).json({
                message: "Invalid year"
            });
        }


        // 6. Check employee
        const employee = await Employee.findOne({
            _id: employeeId,
            isDeleted: false,
            isActive: true
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }


        // 7. Check duplicate payroll
        const existingPayroll = await Payroll.findOne({
            employeeId,
            month,
            year
        });

        if (existingPayroll) {
            return res.status(409).json({
                message: "Payroll already exists for this employee for the selected month and year"
            });
        }


        // 8. Calculate net salary
        const netSalary =
            Number(basicSalary) +
            Number(allowances) -
            Number(deductions);


        // 9. Prevent negative net salary
        if (netSalary < 0) {
            return res.status(400).json({
                message: "Deductions cannot be greater than the total salary"
            });
        }


        // 10. Create payroll
        const payroll = await Payroll.create({
            employeeId,
            month,
            year,
            basicSalary,
            allowances,
            deductions,
            netSalary
        });


        await logActivity({
          userId: req.user.userId,
          employeeId: payroll.employeeId,
          action: "Payroll Created",
          module: "Payroll",
          description: `Payroll created for employee "${payroll.employeeId}" for period ${payroll.month}/${payroll.year}`,
          req,
        });

        // 11. Send response
        return res.status(201).json({
            message: "Payroll created successfully",
            payroll
        });

    } catch (error) {
        console.error("Create Payroll Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



/// Get All Payroll Records
const getAllPayroll = async (req, res) => {
    try {
        const {
            month,
            year,
            paymentStatus,
            employeeId,
            page = 1,
            limit = 10
        } = req.query;


        const filter = {
            isActive: true
        };


        // Filter by employee
        if (employeeId) {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    message: "Invalid employee ID"
                });
            }

            filter.employeeId = employeeId;
        }


        // Validate and filter by month
        if (month !== undefined) {
            const monthNumber = Number(month);

            if (
                !Number.isInteger(monthNumber) ||
                monthNumber < 1 ||
                monthNumber > 12
            ) {
                return res.status(400).json({
                    message: "Month must be between 1 and 12"
                });
            }

            filter.month = monthNumber;
        }


        // Validate and filter by year
        if (year !== undefined) {
            const yearNumber = Number(year);

            if (
                !Number.isInteger(yearNumber) ||
                yearNumber < 2000
            ) {
                return res.status(400).json({
                    message: "Invalid year"
                });
            }

            filter.year = yearNumber;
        }


        // Validate and filter by payment status
        if (paymentStatus !== undefined) {
            const validStatuses = [
                "Pending",
                "Paid"
            ];

            if (!validStatuses.includes(paymentStatus)) {
                return res.status(400).json({
                    message: "Invalid payment status"
                });
            }

            filter.paymentStatus = paymentStatus;
        }


        // Validate pagination
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


        const skip =
            (pageNumber - 1) * limitNumber;


        // Get total count
        const totalPayrolls =
            await Payroll.countDocuments(filter);


        // Get paginated payroll records
const payrolls = await Payroll.find(filter)
    .populate({
        path: "employeeId",
        select:
            "employeeCode firstName lastName email designation departmentId",
        populate: {
            path: "departmentId",
            select: "name"
        }
    })
    .sort({
        year: -1,
        month: -1
    })
            .skip(skip)
            .limit(limitNumber);


        return res.status(200).json({
            message: "Payroll records fetched successfully",
            count: payrolls.length,
            totalPayrolls,
            currentPage: pageNumber,
            totalPages: Math.ceil(
                totalPayrolls / limitNumber
            ),
            payrolls
        });

    } catch (error) {
        console.error("Get All Payroll Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



// Get Payroll Records by Employee
const getPayrollByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;


        // Validate employee ID
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }


        // Check employee
        const employee = await Employee.findOne({
            _id: employeeId,
            isDeleted: false,
            isActive: true
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }


        // Get payroll records
        const payrolls = await Payroll.find({
            employeeId,
            isActive: true
        })
            .populate(
                "employeeId",
                "employeeCode firstName lastName email"
            )
            .sort({
                year: -1,
                month: -1
            });


        return res.status(200).json({
            message: "Employee payroll records fetched successfully",
            count: payrolls.length,
            payrolls
        });

    } catch (error) {
        console.error("Get Payroll By Employee Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



// Update Payroll
const updatePayroll = async (req, res) => {
    try {
        const { payrollId } = req.params;

        const {
            basicSalary,
            allowances,
            deductions
        } = req.body;


        // Validate payroll ID
        if (!mongoose.Types.ObjectId.isValid(payrollId)) {
            return res.status(400).json({
                message: "Invalid payroll ID"
            });
        }


        // Find payroll record
        const payroll = await Payroll.findOne({
            _id: payrollId,
            isActive: true
        });

        if (!payroll) {
            return res.status(404).json({
                message: "Active payroll record not found"
            });
        }


        // Use existing values if a field is not provided
        const updatedBasicSalary =
            basicSalary !== undefined
                ? Number(basicSalary)
                : payroll.basicSalary;

        const updatedAllowances =
            allowances !== undefined
                ? Number(allowances)
                : payroll.allowances;

        const updatedDeductions =
            deductions !== undefined
                ? Number(deductions)
                : payroll.deductions;


        // Validate salary values
        if (
            updatedBasicSalary < 0 ||
            updatedAllowances < 0 ||
            updatedDeductions < 0
        ) {
            return res.status(400).json({
                message: "Salary values cannot be negative"
            });
        }


        // Calculate updated net salary
        const updatedNetSalary =
            updatedBasicSalary +
            updatedAllowances -
            updatedDeductions;


        // Prevent negative net salary
        if (updatedNetSalary < 0) {
            return res.status(400).json({
                message: "Deductions cannot be greater than the total salary"
            });
        }


        // Update payroll
        payroll.basicSalary = updatedBasicSalary;
        payroll.allowances = updatedAllowances;
        payroll.deductions = updatedDeductions;
        payroll.netSalary = updatedNetSalary;

        await payroll.save();


        return res.status(200).json({
            message: "Payroll updated successfully",
            payroll
        });

    } catch (error) {
        console.error("Update Payroll Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



// Mark Payroll as Paid
const markPayrollAsPaid = async (req, res) => {
    try {
        const { payrollId } = req.params;


        // Validate payroll ID
        if (!mongoose.Types.ObjectId.isValid(payrollId)) {
            return res.status(400).json({
                message: "Invalid payroll ID"
            });
        }


        // Find payroll record
        const payroll = await Payroll.findOne({
            _id: payrollId,
            isActive: true
        });

        if (!payroll) {
            return res.status(404).json({
                message: "Active payroll record not found"
            });
        }


        // Prevent duplicate payment
        if (payroll.paymentStatus === "Paid") {
            return res.status(409).json({
                message: "Payroll has already been marked as paid"
            });
        }


        // Update payment details
        payroll.paymentStatus = "Paid";
        payroll.paidDate = new Date();

        await payroll.save();


        await logActivity({
          userId: req.user.userId,
          employeeId: payroll.employeeId,
          action: "Payroll Processed",
          module: "Payroll",
          description: `Payroll marked as paid`,
          req,
        });


        return res.status(200).json({
            message: "Payroll marked as paid successfully",
            payroll
        });

    } catch (error) {
        console.error("Mark Payroll As Paid Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



// Soft Delete Payroll
const deletePayroll = async (req, res) => {
    try {
        const { payrollId } = req.params;


        // Validate payroll ID
        if (!mongoose.Types.ObjectId.isValid(payrollId)) {
            return res.status(400).json({
                message: "Invalid payroll ID"
            });
        }


        // Find active payroll record
        const payroll = await Payroll.findOne({
            _id: payrollId,
            isActive: true
        });

        if (!payroll) {
            return res.status(404).json({
                message: "Active payroll record not found"
            });
        }


        // Soft delete
        payroll.isActive = false;

        await payroll.save();


        return res.status(200).json({
            message: "Payroll deleted successfully"
        });

    } catch (error) {
        console.error("Delete Payroll Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    createPayroll,
    getAllPayroll,
    getPayrollByEmployee,
    updatePayroll,
    markPayrollAsPaid,
    deletePayroll
};