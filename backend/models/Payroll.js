const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },

        year: {
            type: Number,
            required: true
        },

        basicSalary: {
            type: Number,
            required: true,
            min: 0
        },

        allowances: {
            type: Number,
            default: 0,
            min: 0
        },

        deductions: {
            type: Number,
            default: 0,
            min: 0
        },

        netSalary: {
            type: Number,
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid"
            ],
            default: "Pending"
        },

        paidDate: {
            type: Date,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

payrollSchema.index(
    {
        employeeId: 1,
        month: 1,
        year: 1
    },
    {
        unique: true
    }
);

const Payroll = mongoose.model(
    "Payroll",
    payrollSchema
);

module.exports = Payroll;