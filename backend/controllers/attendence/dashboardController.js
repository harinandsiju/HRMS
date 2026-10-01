const Employee = require("../../models/Employee");
const Attendance = require("../../models/attendanceModel");

const getDashboardSummary = async (req, res) => {
    try {
        const today = new Date();

        // Get today's date in IST
        const istDate = new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(today);

        // Create IST day boundaries
        const startOfToday = new Date(
            `${istDate}T00:00:00+05:30`
        );

        const startOfTomorrow = new Date(
            `${istDate}T00:00:00+05:30`
        );

        startOfTomorrow.setDate(
            startOfTomorrow.getDate() + 1
        );

        // Total active employees
        const totalEmployees =
            await Employee.countDocuments({
                isActive: true,
                isDeleted: false
            });

        // Today's attendance summary
        const attendanceSummary =
            await Attendance.aggregate([
                {
                    $match: {
                        isActive: true,
                        date: {
                            $gte: startOfToday,
                            $lt: startOfTomorrow
                        }
                    }
                },
                {
                    $group: {
                        _id: "$status",
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);

        // Default values
        const summary = {
            Present: 0,
            Absent: 0,
            "Half Day": 0,
            Leave: 0
        };

        attendanceSummary.forEach(
            (item) => {
                summary[item._id] =
                    item.count;
            }
        );

        return res.status(200).json({
            message:
                "Dashboard summary fetched successfully.",

            totalEmployees,

            presentToday:
                summary.Present,

            absentToday:
                summary.Absent,

            halfDayToday:
                summary["Half Day"],

            leaveToday:
                summary.Leave
        });

    } catch (error) {
        console.error(
            "Get Dashboard Summary Error:",
            error
        );
0
        return res.status(500).json({
            message:
                "Internal Server Error"
        });
    }
};

module.exports = {
    getDashboardSummary
};