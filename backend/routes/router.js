const express = require("express");
const { register, login, forgotPassword, verifyOTP, resetPassword } = require("../controllers/controller");
const upload = require("../middleware/upload");
const profileUpload = require("../middleware/profileUpload");
const companyLogoUpload = require("../middleware/companyLogoUpload");
const multer = require("multer");
const {
    authenticateUser,
    authorizeAdmin
} = require("../middleware/middleware");

const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    getMyProfile,
    updateMyProfile,
    updateEmployee,
    deleteEmployee
} = require("../controllers/employeeController");



const {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
} = require("../controllers/departmentController");


const {
    markAttendance,
    getAllAttendance,
    getAttendanceByEmployee,
    getMonthlyAttendance,
    getAttendanceSummary,
    employeeCheckIn,
    employeeCheckOut,
    getMyAttendance
} = require("../controllers/attendence/attendanceController");

const {
    getDashboardSummary
} = require("../controllers/attendence/dashboardController");


const {
    applyLeave,
    getAllLeaves,
    getMyLeaves,
    getLeavesByEmployee,
    updateMyLeave,
    deleteMyLeave,
    approveLeave,
    rejectLeave
} = require("../controllers/leave/leaveController");


const {
    createPayroll,
    getAllPayroll,
    getPayrollByEmployee,
    updatePayroll,
    markPayrollAsPaid,
    deletePayroll
} = require("../controllers/payrollController");


const {
    createTask,
    getAllTasks,
    getTasksByEmployee,
    updateTask,
    deleteTask,
    getMyTasks,
    updateMyTaskStatus
} = require("../controllers/taskController");


const {
    uploadDocument,
    getDocumentsByEmployee,
    getMyDocuments,
    deleteDocument
} = require("../controllers/documentController");



const {
    createNotification,
    getAllNotifications,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");


const {
    createPerformanceReview,
    getAllPerformanceReviews,
    getPerformanceByEmployee,
    getMyPerformance,
    updatePerformanceReview,
    deletePerformanceReview
} = require("../controllers/performanceController");


const {
    getAllActivityLogs,
    getActivityLogsByEmployee,
    deleteActivityLog
} = require("../controllers/activityLogController");


const {
    getDashboardSummary: getReportsDashboardSummary,
    getAttendanceOverview,
    getDepartmentDistribution,
    generateReport,
    getAllReports,
    getReportById,
    downloadReport,
    deleteReport
} = require("../controllers/reportController");


const {
    createHoliday,
    getAllHolidays,
    getUpcomingHolidays,
    updateHoliday,
    deleteHoliday
} = require("../controllers/holidayController");


const {
    getSettings,
    getCompanyBranding,
    updateSettings,
    uploadCompanyLogo
} = require("../controllers/settingsController");



const Employee = require("../models/Employee");

const User = require("../models/User");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.get("/test", authenticateUser, (req, res) => {
    res.status(200).json({
        message: "Middleware Working!"
    });
});
router.post(
    "/employees",
    authenticateUser,
    authorizeAdmin,
    profileUpload.single("profileImage"),
    createEmployee
);

router.get(
    "/employees",
    authenticateUser,
    getAllEmployees
);

router.get(
    "/employees/:id",
    authenticateUser,
    getEmployeeById
);


router.get(
    "/profile",
    authenticateUser,
    getMyProfile
);

router.put(
    "/profile",
    authenticateUser,
    (req, res, next) => {
        profileUpload.single("profileImage")(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error("Profile Upload Multer Error:", err);

                return res.status(400).json({
                    message: err.message
                });
            }

            if (err) {
                console.error("Profile Upload Error:", err);

                return res.status(500).json({
                    message: err.message || "Profile image upload failed."
                });
            }

            next();
        });
    },
    updateMyProfile
);


router.put(
    "/employees/:id",
    authenticateUser,
    authorizeAdmin,
    profileUpload.single("profileImage"),
    updateEmployee
);

router.delete(
    "/employees/:id",
    authenticateUser,
    authorizeAdmin,
    deleteEmployee
);


//department


router.post(
    "/departments",
    authenticateUser,
    authorizeAdmin,
    createDepartment
);

router.get(
    "/departments",
    authenticateUser,
    authorizeAdmin,
    getAllDepartments
);

router.get(
    "/departments/:id",
    authenticateUser,
    authorizeAdmin,
    getDepartmentById
);

router.put(
    "/departments/:id",
    authenticateUser,
    authorizeAdmin,
    updateDepartment
);

router.delete(
    "/departments/:id",
    authenticateUser,
    authorizeAdmin,
    deleteDepartment
);


//attendence

router.post(
    "/attendance",
    authenticateUser,
    authorizeAdmin,
    markAttendance
);

router.get(
    "/attendance",
    authenticateUser,
    authorizeAdmin,
    getAllAttendance
);

router.get(
    "/attendance/employee/:employeeId/monthly",
    authenticateUser,
    authorizeAdmin,
    getMonthlyAttendance
);

router.get(
    "/attendance/employee/:employeeId",
    authenticateUser,
    authorizeAdmin,
    getAttendanceByEmployee
);

router.get(
    "/attendance/employee/:employeeId/summary",
    authenticateUser,
    authorizeAdmin,
    getAttendanceSummary
);

router.get(
    "/dashboard/summary",
    authenticateUser,
    authorizeAdmin,
    getDashboardSummary
);

// Employee self attendance

router.post(
    "/attendance/my-attendance/check-in",
    authenticateUser,
    employeeCheckIn
);

router.patch(
    "/attendance/my-attendance/check-out",
    authenticateUser,
    employeeCheckOut
);

router.get(
    "/attendance/my-attendance",
    authenticateUser,
    getMyAttendance
);


//leave 


router.post(
    "/leave",
    authenticateUser,
    applyLeave
);

router.get(
    "/leave",
    authenticateUser,
    authorizeAdmin,
    getAllLeaves
);

router.get(
    "/leave/my-leaves",
    authenticateUser,
    getMyLeaves
);

router.get(
    "/leave/employee/:employeeId",
    authenticateUser,
    authorizeAdmin,
    getLeavesByEmployee
);

router.put(
    "/leave/:leaveId/approve",
    authenticateUser,
    authorizeAdmin,
    approveLeave
);

router.put(
    "/leave/:leaveId/reject",
    authenticateUser,
    authorizeAdmin,
    rejectLeave
);


router.put(
    "/leave/:leaveId",
    authenticateUser,
    updateMyLeave
);

router.delete(
    "/leave/:leaveId",
    authenticateUser,
    deleteMyLeave
);


//leave module

router.post(
    "/payroll",
    authenticateUser,
    authorizeAdmin,
    createPayroll
);

router.get(
    "/payroll",
    authenticateUser,
    authorizeAdmin,
    getAllPayroll
);

router.get(
    "/payroll/employee/:employeeId",
    authenticateUser,
    authorizeAdmin,
    getPayrollByEmployee
);

router.put(
    "/payroll/:payrollId",
    authenticateUser,
    authorizeAdmin,
    updatePayroll
);

router.patch(
    "/payroll/:payrollId/paid",
    authenticateUser,
    authorizeAdmin,
    markPayrollAsPaid
);

router.delete(
    "/payroll/:payrollId",
    authenticateUser,
    authorizeAdmin,
    deletePayroll
);



//task module

router.post(
    "/task",
    authenticateUser,
    authorizeAdmin,
    createTask
);

router.get(
    "/task",
    authenticateUser,
    authorizeAdmin,
    getAllTasks
);

router.get(
    "/task/my-tasks",
    authenticateUser,
    getMyTasks
);

router.get(
    "/task/employee/:employeeId",
    authenticateUser,
    authorizeAdmin,
    getTasksByEmployee
);

router.put(
    "/task/:taskId",
    authenticateUser,
    authorizeAdmin,
    updateTask
);

router.patch(
    "/task/:taskId/status",
    authenticateUser,
    updateMyTaskStatus
);

router.delete(
    "/task/:taskId",
    authenticateUser,
    authorizeAdmin,
    deleteTask
);




//document module

router.post(
    "/documents",
    authenticateUser,
    (req, res, next) => {
        upload.single("file")(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // e.g. file too large
                return res.status(400).json({ message: err.message });
            } else if (err) {
                // fileFilter rejection or other errors
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    },
    uploadDocument
);


router.get(
    "/documents/my-documents",
    authenticateUser,
    getMyDocuments
);

router.get(
    "/documents/employee/:employeeId",
    authenticateUser,
    authorizeAdmin,
    getDocumentsByEmployee
);

router.delete(
    "/documents/:documentId",
    authenticateUser,
    deleteDocument
);



//notification module

router.post(
    "/notifications",
    authenticateUser,
    authorizeAdmin,
    createNotification
);

router.get(
    "/notifications",
    authenticateUser,
    authorizeAdmin,
    getAllNotifications
);


router.get(
    "/notifications/my-notifications",
    authenticateUser,
    getMyNotifications
);

router.patch(
    "/notifications/:notificationId/read",
    authenticateUser,
    markAsRead
);

router.patch(
    "/notifications/read-all",
    authenticateUser,
    markAllAsRead
);

router.delete(
    "/notifications/:notificationId",
    authenticateUser,
    deleteNotification
);


//performance module

router.post(
    "/performance",
    authenticateUser,
    authorizeAdmin,
    createPerformanceReview
);

router.get(
    "/performance",
    authenticateUser,
    authorizeAdmin,
    getAllPerformanceReviews
);

router.get(
    "/performance/my-performance",
    authenticateUser,
    getMyPerformance
);

router.get(
    "/performance/employee/:employeeId",
    authenticateUser,
    authorizeAdmin,
    getPerformanceByEmployee
);

router.put(
    "/performance/:reviewId",
    authenticateUser,
    authorizeAdmin,
    updatePerformanceReview
);

router.delete(
    "/performance/:reviewId",
    authenticateUser,
    authorizeAdmin,
    deletePerformanceReview
);



//activity log module

router.get(
    "/activity-logs",
    authenticateUser,
    authorizeAdmin,
    getAllActivityLogs
);

router.get(
    "/activity-logs/employee/:employeeId",
    authenticateUser,
    authorizeAdmin,
    getActivityLogsByEmployee
);

router.delete(
    "/activity-logs/:logId",
    authenticateUser,
    authorizeAdmin,
    deleteActivityLog
);

//reports module

router.get(
    "/reports/dashboard-summary",
    authenticateUser,
    authorizeAdmin,
    getReportsDashboardSummary
);

router.get(
    "/reports/attendance-overview",
    authenticateUser,
    authorizeAdmin,
    getAttendanceOverview
);

router.get(
    "/reports/department-distribution",
    authenticateUser,
    authorizeAdmin,
    getDepartmentDistribution
);

router.post(
    "/reports/generate",
    authenticateUser,
    authorizeAdmin,
    generateReport
);

router.get(
    "/reports",
    authenticateUser,
    authorizeAdmin,
    getAllReports
);

router.get(
    "/reports/:reportId",
    authenticateUser,
    authorizeAdmin,
    getReportById
);

router.get(
    "/reports/:reportId/download",
    authenticateUser,
    authorizeAdmin,
    downloadReport
);

router.delete(
    "/reports/:reportId",
    authenticateUser,
    authorizeAdmin,
    deleteReport
);


//holiday module

router.post(
    "/holidays",
    authenticateUser,
    authorizeAdmin,
    createHoliday
);

router.get(
    "/holidays",
    authenticateUser,
    getAllHolidays
);

router.get(
    "/holidays/upcoming",
    authenticateUser,
    getUpcomingHolidays
);

router.put(
    "/holidays/:holidayId",
    authenticateUser,
    authorizeAdmin,
    updateHoliday
);

router.delete(
    "/holidays/:holidayId",
    authenticateUser,
    authorizeAdmin,
    deleteHoliday
);

//settings module


router.get(
    "/company-branding",
    authenticateUser,
    getCompanyBranding
);

router.get(
    "/settings",
    authenticateUser,
    authorizeAdmin,
    getSettings
);

router.put(
    "/settings",
    authenticateUser,
    authorizeAdmin,
    updateSettings
);

router.post(
    "/settings/logo",
    authenticateUser,
    authorizeAdmin,
    companyLogoUpload.single("companyLogo"),
    uploadCompanyLogo
);

module.exports = router;