const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Present",
                "Absent",
                "Half Day",
                "Leave"
            ],
            required: true
        },

        checkIn: {
            type: Date,
            default: null
        },

        checkOut: {
            type: Date,
            default: null
        },

        workingHours: {
            type: Number,
            default: 0
        },

        notes: {
            type: String,
            trim: true,
            default: ""
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

// Prevent duplicate attendance records for the same employee on the same date
attendanceSchema.index(
    { employeeId: 1, date: 1 },
    { unique: true }
);

const Attendance = mongoose.model(
    "Attendance",
    attendanceSchema
);

module.exports = Attendance;