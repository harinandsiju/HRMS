const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({
    userId,
    employeeId = null,
    action,
    module = "Other",
    description = "",
    req
}) => {
    try {
        if (!userId || !action) {
            return;
        }

        let ipAddress = "";

        if (req) {
            const forwarded =
                req.headers?.["x-forwarded-for"];

            if (forwarded) {
                ipAddress =
                    forwarded
                        .split(",")[0]
                        .trim();
            } else {
                ipAddress =
                    req.socket?.remoteAddress ||
                    req.ip ||
                    "";
            }
        }

        await ActivityLog.create({
            userId,
            employeeId,
            action,
            module,
            description,
            ipAddress
        });

    } catch (error) {
        /*
         * Activity logging must never break
         * the main HRMS operation.
         */
        console.error(
            "Activity Logger Error:",
            error
        );
    }
};

module.exports = logActivity;