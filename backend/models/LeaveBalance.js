const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        year: {
            type: Number,
            required: true,
            min: 2000
        },

        leaveType: {
            type: String,
            enum: [
                "Casual Leave",
                "Sick Leave",
                "Annual Leave",
                "Emergency Leave",
                "Other"
            ],
            required: true
        },

        totalDays: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        usedDays: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// An employee can have only one balance record for each
// leave type in a particular year.
leaveBalanceSchema.index(
    {
        employeeId: 1,
        year: 1,
        leaveType: 1
    },
    {
        unique: true
    }
);

// Calculate remaining leave instead of storing a duplicate value.
leaveBalanceSchema.virtual("remainingDays").get(function () {
    return this.totalDays - this.usedDays;
});

leaveBalanceSchema.set("toJSON", {
    virtuals: true
});

leaveBalanceSchema.set("toObject", {
    virtuals: true
});

const LeaveBalance = mongoose.model(
    "LeaveBalance",
    leaveBalanceSchema
);

module.exports = LeaveBalance;