const Settings = require("../models/Settings");
const fs = require("fs");
const path = require("path");

// Get Admin Settings
const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({});
        }

        return res.status(200).json({
            message: "Settings fetched successfully",
            settings
        });
    } catch (error) {
        console.error("Get Settings Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get Company Branding
const getCompanyBranding = async (req, res) => {
    try {
        const settings = await Settings.findOne()
            .select("companyLogo");

        return res.status(200).json({
            message: "Company branding fetched successfully",
            companyLogo: settings?.companyLogo || ""
        });
    } catch (error) {
        console.error("Get Company Branding Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Update Admin Settings
const updateSettings = async (req, res) => {
    try {
        const {
            companyName,
            companyEmail,
            companyPhone,
            companyAddress,
            companyLogo,
            notificationSettings,
            userPreferences,
            security
        } = req.body;

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        if (companyName !== undefined) {
            settings.companyName = companyName.trim();
        }

        if (companyEmail !== undefined) {
            settings.companyEmail = companyEmail.trim().toLowerCase();
        }

        if (companyPhone !== undefined) {
            settings.companyPhone = companyPhone.trim();
        }

        if (companyAddress !== undefined) {
            settings.companyAddress = companyAddress.trim();
        }

        if (companyLogo !== undefined) {
            settings.companyLogo = companyLogo;
        }

        if (notificationSettings) {
            if (
                notificationSettings.emailNotifications !== undefined
            ) {
                settings.notificationSettings.emailNotifications =
                    Boolean(notificationSettings.emailNotifications);
            }

            if (
                notificationSettings.inAppNotifications !== undefined
            ) {
                settings.notificationSettings.inAppNotifications =
                    Boolean(notificationSettings.inAppNotifications);
            }

            if (
                notificationSettings.leaveNotifications !== undefined
            ) {
                settings.notificationSettings.leaveNotifications =
                    Boolean(notificationSettings.leaveNotifications);
            }

            if (
                notificationSettings.taskNotifications !== undefined
            ) {
                settings.notificationSettings.taskNotifications =
                    Boolean(notificationSettings.taskNotifications);
            }

            if (
                notificationSettings.payrollNotifications !== undefined
            ) {
                settings.notificationSettings.payrollNotifications =
                    Boolean(notificationSettings.payrollNotifications);
            }
        }

        if (userPreferences) {
            if (userPreferences.language !== undefined) {
                settings.userPreferences.language =
                    userPreferences.language;
            }

            if (userPreferences.timeZone !== undefined) {
                settings.userPreferences.timeZone =
                    userPreferences.timeZone;
            }

            if (userPreferences.dateFormat !== undefined) {
                settings.userPreferences.dateFormat =
                    userPreferences.dateFormat;
            }
        }

        if (security) {
            if (security.sessionTimeout !== undefined) {
                const sessionTimeout = Number(
                    security.sessionTimeout
                );

                if (
                    !Number.isInteger(sessionTimeout) ||
                    sessionTimeout < 5 ||
                    sessionTimeout > 480
                ) {
                    return res.status(400).json({
                        message:
                            "Session timeout must be between 5 and 480 minutes"
                    });
                }

                settings.security.sessionTimeout = sessionTimeout;
            }

            if (security.minimumPasswordLength !== undefined) {
                const minimumPasswordLength = Number(
                    security.minimumPasswordLength
                );

                if (
                    !Number.isInteger(minimumPasswordLength) ||
                    minimumPasswordLength < 6 ||
                    minimumPasswordLength > 32
                ) {
                    return res.status(400).json({
                        message:
                            "Minimum password length must be between 6 and 32 characters"
                    });
                }

                settings.security.minimumPasswordLength =
                    minimumPasswordLength;
            }

            if (security.requireStrongPassword !== undefined) {
                settings.security.requireStrongPassword =
                    Boolean(security.requireStrongPassword);
            }
        }

        await settings.save();

        return res.status(200).json({
            message: "Settings updated successfully",
            settings
        });
    } catch (error) {
        console.error("Update Settings Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Upload Company Logo
const uploadCompanyLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Company logo file is required"
            });
        }

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        // Delete previous company logo if one exists
        if (settings.companyLogo) {
            const oldLogoPath = path.join(
                __dirname,
                "..",
                settings.companyLogo
            );

            if (fs.existsSync(oldLogoPath)) {
                fs.unlinkSync(oldLogoPath);
            }
        }

        // Store only the file path in MongoDB
        settings.companyLogo =
            `uploads/company/${req.file.filename}`;

        await settings.save();

        return res.status(200).json({
            message: "Company logo uploaded successfully",
            settings
        });
    } catch (error) {
        console.error(
            "Upload Company Logo Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    getSettings,
    getCompanyBranding,
    updateSettings,
    uploadCompanyLogo   
};