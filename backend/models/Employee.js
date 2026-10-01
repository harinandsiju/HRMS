const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        employeeCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        firstName: {
            type: String,
            required: true,
            trim: true
        },

        lastName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        personalEmail: {
            type: String,
            trim: true,
            lowercase: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        alternatePhone: {
            type: String,
            trim: true
        },

        dateOfBirth: {
            type: Date,
            required: true
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true
        },

        qualification: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        country: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        zip: {
            type: String,
            required: true,
            trim: true
        },

        designation: {
            type: String,
            trim: true
        },

        employmentType: {
            type: String,
            enum: ["Full-time", "Part-time", "Contract", "Intern"],
            default: "Full-time"
        },

        joiningDate: {
            type: Date
        },

        reportingManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            default: null
        },

        workLocation: {
            type: String,
            trim: true
        },

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null
        },

        basicSalary: {
            type: Number,
            min: 0
        },

        salaryType: {
            type: String,
            enum: ["Monthly", "Yearly"],
            default: "Monthly"
        },

        bankName: {
            type: String,
            trim: true
        },

        accountNumber: {
            type: String,
            trim: true
        },

        ifscCode: {
            type: String,
            trim: true,
            uppercase: true
        },

        emergencyContactName: {
            type: String,
            trim: true
        },

        emergencyContactPhone: {
            type: String,
            trim: true
        },

        relationship: {
            type: String,
            trim: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        profileImage: {
            type: String,
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

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;