const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
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

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        reason: {
            type: String,
            trim: true,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected"
            ],
            default: "Pending"
        },

        adminComment: {
            type: String,
            trim: true,
            default: ""
        },

        // Number of working days deducted upon approval.
        deductedDays: {
            type: Number,
            min: 0,
            default: 0
        },

        // Identifies the year against which leave was deducted.
        balanceYear: {
            type: Number,
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

const Leave = mongoose.model(
    "Leave",
    leaveSchema
);

module.exports = Leave;