const Attendance = require("../../models/attendanceModel");
const Employee = require("../../models/Employee");
const User = require("../../models/User");
const logActivity = require("../../helpers/activityLogger");


// Mark Attendance
const markAttendance = async (req, res) => {
    try {
        const {
            employeeId,
            date,
            status,
            checkIn,
            checkOut,
            workingHours,
            notes
        } = req.body;

        // Check required fields
        if (!employeeId || !date || !status) {
            return res.status(400).json({
                message: "Employee ID, date and status are required."
            });
        }

        // Check whether employee exists
        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Create attendance record
        const attendance = await Attendance.create({
            employeeId,
            date,
            status,
            checkIn,
            checkOut,
            workingHours,
            notes
        });


        await logActivity({
          userId: req.user.userId,
          employeeId: attendance.employeeId,
          action: "Attendance Marked",
          module: "Attendance",
          description: `Attendance marked as ${attendance.status} for ${new Date(attendance.date).toDateString()}`,
          req,
        });

        return res.status(201).json({
            message: "Attendance marked successfully.",
            attendance
        });

} catch (error) {

    console.error("Mark Attendance Error:", error);

    // Duplicate attendance record
    if (error.code === 11000) {
        return res.status(409).json({
            message: "Attendance has already been marked for this employee on this date."
        });
    }

    return res.status(500).json({
        message: "Internal Server Error"
    });
}
};


// Get All Attendance Records
const getAllAttendance = async (req, res) => {
    try {
        const {
            status,
            date,
            startDate,
            endDate
        } = req.query;

        const filter = {
            isActive: true
        };

        // Filter by attendance status
        if (status) {
            filter.status = status;
        }

        // Helper for IST date boundaries
        const getISTStartOfDay = (dateString) => {
            return new Date(
                `${dateString}T00:00:00+05:30`
            );
        };

        const getISTStartOfNextDay = (dateString) => {
            const startOfDay = new Date(
                `${dateString}T00:00:00+05:30`
            );

            startOfDay.setDate(
                startOfDay.getDate() + 1
            );

            return startOfDay;
        };

        // Filter by a specific date
        if (date) {
            const startOfDay =
                getISTStartOfDay(date);

            const startOfNextDay =
                getISTStartOfNextDay(date);

            if (
                isNaN(startOfDay.getTime()) ||
                isNaN(startOfNextDay.getTime())
            ) {
                return res.status(400).json({
                    message: "Invalid date."
                });
            }

            filter.date = {
                $gte: startOfDay,
                $lt: startOfNextDay
            };
        }

        // Filter by date range
        if (startDate && endDate) {
            const rangeStartDate =
                getISTStartOfDay(startDate);

            const rangeEndDate =
                getISTStartOfNextDay(endDate);

            if (
                isNaN(rangeStartDate.getTime()) ||
                isNaN(rangeEndDate.getTime())
            ) {
                return res.status(400).json({
                    message: "Invalid date range."
                });
            }

            filter.date = {
                $gte: rangeStartDate,
                $lt: rangeEndDate
            };
        }

        const attendanceRecords =
            await Attendance.find(filter)
                .populate(
                    "employeeId",
                    "employeeCode firstName lastName email"
                )
                .sort({
                    date: -1
                });

        return res.status(200).json({
            message:
                "Attendance records fetched successfully.",
            count: attendanceRecords.length,
            attendance: attendanceRecords
        });

    } catch (error) {
        console.error(
            "Get Attendance Error:",
            error
        );

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get Attendance by Employee
const getAttendanceByEmployee = async (req, res) => {
    try {

        const { employeeId } = req.params;

        // Check whether employee exists
        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find({
            employeeId,
            isActive: true
        })
            .sort({ date: -1 });

        return res.status(200).json({
            message: "Employee attendance fetched successfully.",
            employee: {
                _id: employee._id,
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName
            },
            count: attendanceRecords.length,
            attendance: attendanceRecords
        });

    } catch (error) {

        console.error("Get Employee Attendance Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

//get monthly attendance
const getMonthlyAttendance = async (req, res) => {
    try {

        const { employeeId } = req.params;
        const { month, year } = req.query;

        // Check required month and year
        if (!month || !year) {
            return res.status(400).json({
                message: "Month and year are required."
            });
        }

        // Check whether employee exists
        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Create date range
        const startDate = new Date(
            Date.UTC(Number(year), Number(month) - 1, 1)
        );

        const endDate = new Date(
            Date.UTC(Number(year), Number(month), 1)
        );

        // Get monthly attendance
        const attendanceRecords = await Attendance.find({
            employeeId,
            isActive: true,
            date: {
                $gte: startDate,
                $lt: endDate
            }
        }).sort({ date: 1 });

        return res.status(200).json({
            message: "Monthly attendance fetched successfully.",
            employee: {
                _id: employee._id,
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName
            },
            month: Number(month),
            year: Number(year),
            count: attendanceRecords.length,
            attendance: attendanceRecords
        });

    } catch (error) {

        console.error("Get Monthly Attendance Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};



const getAttendanceSummary = async (req, res) => {
    try {

        const { employeeId } = req.params;

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        const summary = await Attendance.aggregate([
            {
                $match: {
                    employeeId: employee._id,
                    isActive: true
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

        const attendanceSummary = {
            Present: 0,
            Absent: 0,
            "Half Day": 0,
            Leave: 0
        };

        let totalRecords = 0;

        summary.forEach((item) => {
            attendanceSummary[item._id] = item.count;
            totalRecords += item.count;
        });

        return res.status(200).json({
            message: "Attendance summary fetched successfully.",
            employee: {
                _id: employee._id,
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName
            },
            totalRecords,
            summary: attendanceSummary
        });

    } catch (error) {

        console.error("Get Attendance Summary Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ==================================================
// EMPLOYEE SELF ATTENDANCE
// ==================================================

// Employee Check-In
const employeeCheckIn = async (req, res) => {
    try {
        // Find the logged-in user's employee record
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile not found."
            });
        }

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        const now = new Date();

        // Start and end of today
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // Check whether today's attendance already exists
        const existingAttendance = await Attendance.findOne({
            employeeId: employee._id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            isActive: true
        });

        if (existingAttendance) {
            if (existingAttendance.checkIn) {
                return res.status(409).json({
                    message: "You have already checked in today.",
                    attendance: existingAttendance
                });
            }
        }

        const attendance = await Attendance.create({
            employeeId: employee._id,
            date: now,
            status: "Present",
            checkIn: now,
            checkOut: null,
            workingHours: 0,
            notes: ""
        });

        await logActivity({
            userId: req.user.userId,
            employeeId: employee._id,
            action: "Attendance Checked In",
            module: "Attendance",
            description: `Employee checked in at ${now.toLocaleString()}`,
            req
        });

        return res.status(201).json({
            message: "Checked in successfully.",
            attendance
        });
    } catch (error) {
        console.error("Employee Check-In Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Employee Check-Out
const employeeCheckOut = async (req, res) => {
    try {
        // Find the logged-in user's employee record
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile not found."
            });
        }

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        const now = new Date();

        // Start and end of today
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // Find today's attendance
        const attendance = await Attendance.findOne({
            employeeId: employee._id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            isActive: true
        });

        if (!attendance) {
            return res.status(404).json({
                message: "You have not checked in today."
            });
        }

        if (!attendance.checkIn) {
            return res.status(400).json({
                message: "Check-in record not found."
            });
        }

        if (attendance.checkOut) {
            return res.status(409).json({
                message: "You have already checked out today.",
                attendance
            });
        }

        // Calculate working hours
        const workingMilliseconds =
            now.getTime() - attendance.checkIn.getTime();

        const workingHours =
            workingMilliseconds / (1000 * 60 * 60);

        const calculatedWorkingHours =
    Number(workingHours.toFixed(2));

// Attendance status based on working hours
if (calculatedWorkingHours < 5) {
    attendance.status = "Half Day";
} else {
    attendance.status = "Present";
}

attendance.checkOut = now;
attendance.workingHours =
    calculatedWorkingHours;

await attendance.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: employee._id,
            action: "Attendance Checked Out",
            module: "Attendance",
            description: `Employee checked out at ${now.toLocaleString()}`,
            req
        });

        return res.status(200).json({
            message: "Checked out successfully.",
            attendance
        });
    } catch (error) {
        console.error("Employee Check-Out Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get Employee's Own Attendance
const getMyAttendance = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile not found."
            });
        }

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        const {
            startDate,
            endDate
        } = req.query;

        const filter = {
            employeeId: employee._id,
            isActive: true
        };

        // Optional date-range filter
        if (startDate || endDate) {

            const dateFilter = {};

            if (startDate) {
                const rangeStartDate = new Date(startDate);

                if (isNaN(rangeStartDate.getTime())) {
                    return res.status(400).json({
                        message: "Invalid start date."
                    });
                }

                rangeStartDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                dateFilter.$gte =
                    rangeStartDate;
            }

            if (endDate) {
                const rangeEndDate = new Date(endDate);

                if (isNaN(rangeEndDate.getTime())) {
                    return res.status(400).json({
                        message: "Invalid end date."
                    });
                }

                rangeEndDate.setHours(
                    23,
                    59,
                    59,
                    999
                );

                dateFilter.$lte =
                    rangeEndDate;
            }

            filter.date = dateFilter;
        }

        const attendanceRecords =
            await Attendance.find(filter)
                .sort({
                    date: -1
                });

        return res.status(200).json({
            message:
                "My attendance fetched successfully.",

            employee: {
                _id: employee._id,
                employeeCode:
                    employee.employeeCode,
                firstName:
                    employee.firstName,
                lastName:
                    employee.lastName
            },

            count:
                attendanceRecords.length,

            attendance:
                attendanceRecords
        });

    } catch (error) {

        console.error(
            "Get My Attendance Error:",
            error
        );

        return res.status(500).json({
            message:
                "Internal Server Error"
        });
    }
};

module.exports = {
    markAttendance,
    getAllAttendance,
    getAttendanceByEmployee,
    getAttendanceSummary,
    getMonthlyAttendance,
    employeeCheckIn,
    employeeCheckOut,
    getMyAttendance
};