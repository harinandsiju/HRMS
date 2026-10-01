const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        reviewPeriod: {
            type: String,
            required: true,
            trim: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        strengths: {
            type: String,
            trim: true,
            default: ""
        },

        areasOfImprovement: {
            type: String,
            trim: true,
            default: ""
        },

        feedback: {
            type: String,
            trim: true,
            default: ""
        },

        goals: {
            type: String,
            trim: true,
            default: ""
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
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

const Performance = mongoose.model("Performance", performanceSchema);

module.exports = Performance;