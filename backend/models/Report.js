const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reportName: {
            type: String,
            required: true,
            trim: true
        },

        reportType: {
            type: String,
            enum: [
                "Employee Report",
                "Attendance Report",
                "Leave Report",
                "Payroll Report",
                "Department Analysis Report"
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

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null
        },

        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        summary: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
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

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;