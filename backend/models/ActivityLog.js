const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            default: null
        },

        action: {
            type: String,
            required: true,
            trim: true
        },

        module: {
            type: String,
            enum: [
                "Auth",
                "Employee",
                "Department",
                "Attendance",
                "Leave",
                "Payroll",
                "Task",
                "Document",
                "Notification",
                "Performance",
                "Other"
            ],
            default: "Other"
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        ipAddress: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);


activityLogSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60 }
);



const ActivityLog = mongoose.model(
    "ActivityLog",
    activityLogSchema
);

module.exports = ActivityLog;