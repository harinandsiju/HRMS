const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            default: null
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;