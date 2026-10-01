const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            default: "TechNova Solutions Pvt. Ltd.",
            trim: true
        },

        companyEmail: {
            type: String,
            default: "info@technova.com",
            trim: true,
            lowercase: true
        },

        companyPhone: {
            type: String,
            default: "",
            trim: true
        },

        companyAddress: {
            type: String,
            default: "",
            trim: true
        },

        companyLogo: {
            type: String,
            default: ""
        },

        notificationSettings: {
            emailNotifications: {
                type: Boolean,
                default: true
            },

            inAppNotifications: {
                type: Boolean,
                default: true
            },

            leaveNotifications: {
                type: Boolean,
                default: true
            },

            taskNotifications: {
                type: Boolean,
                default: true
            },

            payrollNotifications: {
                type: Boolean,
                default: true
            }
        },

        userPreferences: {
            language: {
                type: String,
                default: "English"
            },

            timeZone: {
                type: String,
                default: "Asia/Kolkata"
            },

            dateFormat: {
                type: String,
                default: "DD MMM YYYY"
            }
        },

        security: {
            sessionTimeout: {
                type: Number,
                default: 30
            },

            minimumPasswordLength: {
                type: Number,
                default: 8,
                min: 6
            },

            requireStrongPassword: {
                type: Boolean,
                default: true
            }
        }
    },
    {
        timestamps: true
    }
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;