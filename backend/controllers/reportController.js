const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Report = require("../models/Report");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Attendance = require("../models/attendanceModel");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const User = require("../models/User");

const generateReportPDF = require("../helpers/pdfGenerator");

// ---------- DASHBOARD CARDS ----------

const getDashboardSummary = async (req, res) => {
    try {
        const now = new Date();

        const startOfMonth = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
        );

        const startOfNextMonth = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
        );

        // Total active employees
        const totalEmployees = await Employee.countDocuments({
            isActive: true,
            isDeleted: false
        });

        // Attendance rate this month
        const attendanceThisMonth = await Attendance.find({
            isActive: true,
            date: {
                $gte: startOfMonth,
                $lt: startOfNextMonth
            }
        });

        const presentCount = attendanceThisMonth.filter(
            (a) => a.status === "Present"
        ).length;

        const attendanceRate =
            attendanceThisMonth.length > 0
                ? ((presentCount / attendanceThisMonth.length) * 100).toFixed(1)
                : "0.0";

        // Pending leave requests
        const pendingLeaveCount = await Leave.countDocuments({
            isActive: true,
            status: "Pending"
        });

        // Payroll processed this month
        const paidPayrollThisMonth = await Payroll.aggregate([
            {
                $match: {
                    isActive: true,
                    paymentStatus: "Paid",
                    month: now.getUTCMonth() + 1,
                    year: now.getUTCFullYear()
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$netSalary" }
                }
            }
        ]);

        const payrollProcessed =
            paidPayrollThisMonth.length > 0
                ? paidPayrollThisMonth[0].total
                : 0;

        return res.status(200).json({
            message: "Dashboard summary fetched successfully",
            totalEmployees,
            attendanceRate: Number(attendanceRate),
            pendingLeaveRequests: pendingLeaveCount,
            payrollProcessedThisMonth: payrollProcessed
        });
    } catch (error) {
        console.error("Get Dashboard Summary Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// ---------- ATTENDANCE OVERVIEW CHART ----------

const getAttendanceOverview = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "startDate and endDate are required"
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: "Invalid startDate or endDate"
            });
        }

        if (start > end) {
            return res.status(400).json({
                message: "startDate cannot be after endDate"
            });
        }

        // Include the complete end date
        end.setUTCDate(end.getUTCDate() + 1);

        // Get total active employees.
        // This is the denominator for the attendance percentage.
        const activeEmployees = await Employee.find({
            isActive: true,
            isDeleted: false
        }).select("_id");

        const activeEmployeeIds = activeEmployees.map(
            (employee) => employee._id
        );

        const totalActiveEmployees = activeEmployeeIds.length;

        console.log("TOTAL ACTIVE EMPLOYEES:", totalActiveEmployees);
console.log("ACTIVE EMPLOYEE IDS:", activeEmployeeIds);

        // If there are no active employees, return zero attendance.
        if (totalActiveEmployees === 0) {
            return res.status(200).json({
                message: "Attendance overview fetched successfully",
                overview: []
            });
        }

        /*
         * Attendance calculation:
         *
         * Present active employees
         * ------------------------- × 100
         * Total active employees
         *
         * Example:
         * 3 Present / 10 Active Employees × 100 = 30%
         *
         * We first group by date + employeeId so that one employee
         * cannot accidentally be counted more than once on the same day.
         */

        const records = await Attendance.aggregate([
            {
                $match: {
                    isActive: true,
                    date: {
                        $gte: start,
                        $lt: end
                    },
                    employeeId: {
                        $in: activeEmployeeIds
                    },
                    status: "Present"
                }
            },

            // Count each employee only once per day
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$date"
                            }
                        },
                        employeeId: "$employeeId"
                    }
                }
            },

            // Count unique present employees for each date
            {
                $group: {
                    _id: "$_id.date",
                    presentEmployees: {
                        $sum: 1
                    }
                }
            },

            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        console.log("ATTENDANCE RECORDS:", records);

        const overview = records.map((record) => ({
            date: record._id,

            attendanceRate:
                totalActiveEmployees > 0
                    ? Number(
                          (
                              (record.presentEmployees /
                                  totalActiveEmployees) *
                              100
                          ).toFixed(1)
                      )
                    : 0
        }));

        return res.status(200).json({
            message: "Attendance overview fetched successfully",
            overview
        });
    } catch (error) {
        console.error("Get Attendance Overview Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// ---------- DEPARTMENT DISTRIBUTION ----------

const getDepartmentDistribution = async (req, res) => {
    try {
        const distribution = await Employee.aggregate([
            {
                $match: {
                    isActive: true,
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: "$departmentId",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "_id",
                    foreignField: "_id",
                    as: "department"
                }
            },
            {
                $project: {
                    _id: 0,
                    departmentId: "$_id",
                    departmentName: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$department.name",
                                    0
                                ]
                            },
                            "Unassigned"
                        ]
                    },
                    count: 1
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);

        const totalEmployees = distribution.reduce(
            (sum, d) => sum + d.count,
            0
        );

        const distributionWithPercent = distribution.map((d) => ({
            ...d,
            percentage:
                totalEmployees > 0
                    ? Number(
                          ((d.count / totalEmployees) * 100).toFixed(1)
                      )
                    : 0
        }));

        return res.status(200).json({
            message: "Department distribution fetched successfully",
            totalEmployees,
            distribution: distributionWithPercent
        });
    } catch (error) {
        console.error(
            "Get Department Distribution Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// ---------- GENERATE REPORT ----------

const generateReport = async (req, res) => {
    try {
        const {
            reportType,
            startDate,
            endDate,
            departmentId
        } = req.body;

        const validTypes = [
            "Employee Report",
            "Attendance Report",
            "Leave Report",
            "Payroll Report",
            "Department Analysis Report"
        ];

        if (!reportType || !validTypes.includes(reportType)) {
            return res.status(400).json({
                message: "Valid reportType is required"
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "startDate and endDate are required"
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid startDate or endDate"
            });
        }

        if (start > end) {
            return res.status(400).json({
                message: "startDate cannot be after endDate"
            });
        }

        let department = null;

        if (departmentId) {
            if (!mongoose.Types.ObjectId.isValid(departmentId)) {
                return res.status(400).json({
                    message: "Invalid department ID"
                });
            }

            department = await Department.findOne({
                _id: departmentId,
                isActive: true,
                isDeleted: false
            });

            if (!department) {
                return res.status(404).json({
                    message: "Department not found"
                });
            }
        }

        const endInclusive = new Date(end);

        endInclusive.setUTCDate(
            endInclusive.getUTCDate() + 1
        );

        // Build employee filter
        const employeeFilter = {
            isActive: true,
            isDeleted: false
        };

        if (departmentId) {
            employeeFilter.departmentId = departmentId;
        }

        const employeeIds = departmentId
            ? (
                  await Employee.find(employeeFilter).select(
                      "_id"
                  )
              ).map((e) => e._id)
            : null;

        let summary = {};

        // ----- Build summary based on report type -----

        if (reportType === "Employee Report") {
            const totalEmployees =
                await Employee.countDocuments(
                    employeeFilter
                );

            const activeEmployees =
                await Employee.countDocuments({
                    ...employeeFilter,
                    status: "Active"
                });

            summary = {
                totalEmployees,
                activeEmployees
            };
        } else if (reportType === "Attendance Report") {
            const attendanceFilter = {
                isActive: true,
                date: {
                    $gte: start,
                    $lt: endInclusive
                }
            };

            if (employeeIds) {
                attendanceFilter.employeeId = {
                    $in: employeeIds
                };
            }

            const records =
                await Attendance.find(attendanceFilter);

            const totalWorkingDays = new Set(
                records.map(
                    (r) =>
                        r.date
                            .toISOString()
                            .split("T")[0]
                )
            ).size;

            const presentDays = records.filter(
                (r) => r.status === "Present"
            ).length;

            const absentDays = records.filter(
                (r) => r.status === "Absent"
            ).length;

            const halfDays = records.filter(
                (r) => r.status === "Half Day"
            ).length;

            const leaveDays = records.filter(
                (r) => r.status === "Leave"
            ).length;

            const attendanceRate =
                records.length > 0
                    ? Number(
                          (
                              (presentDays /
                                  records.length) *
                              100
                          ).toFixed(1)
                      )
                    : 0;

            summary = {
                totalWorkingDays,
                presentDays,
                absentDays,
                halfDays,
                leaveDays,
                attendanceRate
            };
        } else if (reportType === "Leave Report") {
            const leaveFilter = {
                isActive: true,
                startDate: {
                    $lt: endInclusive
                },
                endDate: {
                    $gte: start
                }
            };

            if (employeeIds) {
                leaveFilter.employeeId = {
                    $in: employeeIds
                };
            }

            const leaves =
                await Leave.find(leaveFilter);

            summary = {
                totalLeaveRequests: leaves.length,
                approved: leaves.filter(
                    (l) => l.status === "Approved"
                ).length,
                rejected: leaves.filter(
                    (l) => l.status === "Rejected"
                ).length,
                pending: leaves.filter(
                    (l) => l.status === "Pending"
                ).length
            };
        } else if (reportType === "Payroll Report") {
            const payrollFilter = {
                isActive: true
            };

            if (employeeIds) {
                payrollFilter.employeeId = {
                    $in: employeeIds
                };
            }

            const payrollAgg =
                await Payroll.aggregate([
                    {
                        $match: payrollFilter
                    },
                    {
                        $group: {
                            _id: null,

                            totalPayrollRecords: {
                                $sum: 1
                            },

                            totalPaid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$paymentStatus",
                                                "Paid"
                                            ]
                                        },
                                        "$netSalary",
                                        0
                                    ]
                                }
                            },

                            totalPending: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$paymentStatus",
                                                "Pending"
                                            ]
                                        },
                                        "$netSalary",
                                        0
                                    ]
                                }
                            },

                            paidCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$paymentStatus",
                                                "Paid"
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            },

                            pendingCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$paymentStatus",
                                                "Pending"
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ]);

            summary =
                payrollAgg.length > 0
                    ? {
                          totalPayrollRecords:
                              payrollAgg[0]
                                  .totalPayrollRecords,

                          totalPaidAmount:
                              payrollAgg[0].totalPaid,

                          totalPendingAmount:
                              payrollAgg[0]
                                  .totalPending,

                          paidCount:
                              payrollAgg[0].paidCount,

                          pendingCount:
                              payrollAgg[0]
                                  .pendingCount
                      }
                    : {
                          totalPayrollRecords: 0,
                          totalPaidAmount: 0,
                          totalPendingAmount: 0,
                          paidCount: 0,
                          pendingCount: 0
                      };
        } else if (
            reportType ===
            "Department Analysis Report"
        ) {
            const distribution =
                await Employee.aggregate([
                    {
                        $match: {
                            isActive: true,
                            isDeleted: false
                        }
                    },
                    {
                        $group: {
                            _id: "$departmentId",
                            count: {
                                $sum: 1
                            }
                        }
                    }
                ]);

            summary = {
                totalDepartments:
                    distribution.length,

                totalEmployeesAcrossDepartments:
                    distribution.reduce(
                        (sum, d) =>
                            sum + d.count,
                        0
                    )
            };
        }

        // Build a readable report name
        const reportName = `${reportType} - ${start.toLocaleString(
            "default",
            {
                month: "long",
                year: "numeric"
            }
        )}`;

        // Get the Admin's email for the PDF
        const generatedByUser =
            await User.findById(req.user.userId);

        // Generate the actual PDF file
        const filePath = await generateReportPDF({
            reportName,
            reportType,
            startDate: start,
            endDate: end,
            departmentName: department
                ? department.name
                : null,
            generatedByEmail:
                generatedByUser.email,
            summary
        });

        // Save the report record
        const report = await Report.create({
            reportName,
            reportType,
            startDate: start,
            endDate: end,
            departmentId:
                departmentId || null,
            generatedBy: req.user.userId,
            filePath,
            summary
        });

        return res.status(201).json({
            message: "Report generated successfully",
            report
        });
    } catch (error) {
        console.error(
            "Generate Report Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// ---------- GET ALL REPORTS ----------

const getAllReports = async (req, res) => {
    try {
        const {
            reportType,
            page = 1,
            limit = 10
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1
        ) {
            return res.status(400).json({
                message:
                    "Page must be a positive integer"
            });
        }

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                message:
                    "Limit must be between 1 and 100"
            });
        }

        const filter = {
            isActive: true
        };

        if (reportType) {
            filter.reportType = reportType;
        }

        const totalReports =
            await Report.countDocuments(filter);

        const reports = await Report.find(filter)
            .populate(
                "generatedBy",
                "email role"
            )
            .populate(
                "departmentId",
                "name"
            )
            .sort({
                createdAt: -1
            })
            .skip(
                (pageNumber - 1) *
                    limitNumber
            )
            .limit(limitNumber);

        return res.status(200).json({
            message:
                "Reports fetched successfully",
            count: reports.length,
            totalReports,
            currentPage: pageNumber,
            totalPages: Math.ceil(
                totalReports /
                    limitNumber
            ),
            reports
        });
    } catch (error) {
        console.error(
            "Get All Reports Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// ---------- GET REPORT BY ID ----------

const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                reportId
            )
        ) {
            return res.status(400).json({
                message: "Invalid report ID"
            });
        }

        const report =
            await Report.findOne({
                _id: reportId,
                isActive: true
            })
                .populate(
                    "generatedBy",
                    "email role"
                )
                .populate(
                    "departmentId",
                    "name"
                );

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        return res.status(200).json({
            message:
                "Report fetched successfully",
            report
        });
    } catch (error) {
        console.error(
            "Get Report By Id Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// ---------- DOWNLOAD REPORT PDF ----------

const downloadReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                reportId
            )
        ) {
            return res.status(400).json({
                message: "Invalid report ID"
            });
        }

        const report =
            await Report.findOne({
                _id: reportId,
                isActive: true
            });

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        const absolutePath = path.join(
            __dirname,
            "..",
            report.filePath
        );

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                message:
                    "Report file not found on server"
            });
        }

        return res.download(
            absolutePath,
            `${report.reportName}.pdf`
        );
    } catch (error) {
        console.error(
            "Download Report Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// ---------- DELETE REPORT ----------

const deleteReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                reportId
            )
        ) {
            return res.status(400).json({
                message: "Invalid report ID"
            });
        }

        const report =
            await Report.findOne({
                _id: reportId,
                isActive: true
            });

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        report.isActive = false;

        await report.save();

        return res.status(200).json({
            message:
                "Report deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete Report Error:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    getDashboardSummary,
    getAttendanceOverview,
    getDepartmentDistribution,
    generateReport,
    getAllReports,
    getReportById,
    downloadReport,
    deleteReport
};