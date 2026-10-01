import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function EmployeeDashboard() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [performance, setPerformance] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================
    // FETCH DASHBOARD DATA
    // =========================

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                profileResponse,
                taskResponse,
                leaveResponse,
                documentResponse,
                performanceResponse,
                notificationResponse
            ] = await Promise.all([
                api.get("/profile"),
                api.get("/task/my-tasks"),
                api.get("/leave/my-leaves"),
                api.get("/documents/my-documents"),
                api.get("/performance/my-performance"),
                api.get("/notifications/my-notifications")
            ]);

            setProfile(
                profileResponse.data.profile || null
            );

            setTasks(
                taskResponse.data.tasks || []
            );

            setLeaves(
                leaveResponse.data.leaves || []
            );

            setDocuments(
                documentResponse.data.documents || []
            );

            setPerformance(
                performanceResponse.data || null
            );

            setNotifications(
                notificationResponse.data.notifications || []
            );

        } catch (err) {
            console.error(
                "Employee dashboard fetch error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // =========================
    // CALCULATIONS
    // =========================

    const taskSummary = useMemo(() => {
        return {
            total: tasks.length,

            pending: tasks.filter(
                (task) =>
                    task.status === "Pending"
            ).length,

            inProgress: tasks.filter(
                (task) =>
                    task.status === "In Progress"
            ).length,

            completed: tasks.filter(
                (task) =>
                    task.status === "Completed"
            ).length
        };
    }, [tasks]);

    const leaveSummary = useMemo(() => {
        return {
            total: leaves.length,

            pending: leaves.filter(
                (leave) =>
                    leave.status === "Pending"
            ).length,

            approved: leaves.filter(
                (leave) =>
                    leave.status === "Approved"
            ).length,

            rejected: leaves.filter(
                (leave) =>
                    leave.status === "Rejected"
            ).length
        };
    }, [leaves]);

    const unreadNotifications = useMemo(() => {
        return notifications.filter(
            (notification) =>
                notification.isRead !== true
        );
    }, [notifications]);

    const recentTasks = useMemo(() => {
        return [...tasks]
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            )
            .slice(0, 4);
    }, [tasks]);

    const recentNotifications = useMemo(() => {
        return [...notifications]
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            )
            .slice(0, 4);
    }, [notifications]);

    // =========================
    // HELPERS
    // =========================

    const getEmployeeName = () => {
        if (!profile) {
            return "Employee";
        }

        return (
            `${profile.firstName || ""} ${
                profile.lastName || ""
            }`.trim() ||
            "Employee"
        );
    };

    const getInitials = () => {
        if (!profile) {
            return "E";
        }

        const first =
            profile.firstName?.charAt(0) || "";

        const last =
            profile.lastName?.charAt(0) || "";

        return (
            `${first}${last}`.toUpperCase() ||
            "E"
        );
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not available";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const getDepartmentName = () => {
        if (!profile?.departmentId) {
            return "Not available";
        }

        if (
            typeof profile.departmentId === "object" &&
            profile.departmentId?.name
        ) {
            return profile.departmentId.name;
        }

        return "Not available";
    };

    const getTaskStatusStyle = (status) => {
        if (status === "Completed") {
            return "bg-green-50 text-green-700";
        }

        if (status === "In Progress") {
            return "bg-blue-50 text-blue-700";
        }

        return "bg-orange-50 text-orange-700";
    };

    const getLeaveStatusStyle = (status) => {
        if (status === "Approved") {
            return "bg-green-50 text-green-700";
        }

        if (status === "Rejected") {
            return "bg-red-50 text-red-700";
        }

        return "bg-orange-50 text-orange-700";
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="space-y-6">

                <div className="animate-pulse">
                    <div className="h-8 w-64 bg-gray-200 rounded" />
                    <div className="h-4 w-80 bg-gray-100 rounded mt-2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                    {[1, 2, 3, 4].map(
                        (item) => (
                            <div
                                key={item}
                                className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse"
                            >
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-8 w-16 bg-gray-200 rounded mt-4" />
                            </div>
                        )
                    )}

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {[1, 2].map(
                        (item) => (
                            <div
                                key={item}
                                className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse"
                            >
                                <div className="h-5 w-40 bg-gray-200 rounded" />

                                <div className="space-y-4 mt-6">
                                    <div className="h-12 bg-gray-100 rounded" />
                                    <div className="h-12 bg-gray-100 rounded" />
                                    <div className="h-12 bg-gray-100 rounded" />
                                </div>
                            </div>
                        )
                    )}

                </div>

            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* =========================
                ERROR
            ========================== */}

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <i className="fas fa-exclamation-triangle" />
                        </div>

                        <p className="text-sm text-red-700">
                            {error}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={fetchDashboardData}
                        className="text-sm font-medium text-red-700 hover:text-red-800"
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* =========================
                WELCOME HEADER
            ========================== */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div>

                    <p className="text-sm text-indigo-600 font-medium">
                        Employee Dashboard
                    </p>

                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">
                        Welcome back, {getEmployeeName()} 👋
                    </h1>

                    <p className="text-sm text-gray-500 mt-2">
                        Here's an overview of your work and recent activity.
                    </p>

                </div>

                {/* PROFILE */}

                <button
                    type="button"
                    onClick={() =>
                        navigate("/employee/profile")
                    }
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 transition text-left"
                >

                    {profile?.profileImage ? (
                        <img
                            src={`${api.defaults.baseURL}/${profile.profileImage}`}
                            alt={getEmployeeName()}
                            className="w-11 h-11 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                            {getInitials()}
                        </div>
                    )}

                    <div>

                        <p className="text-sm font-semibold text-gray-900">
                            {getEmployeeName()}
                        </p>

                        <p className="text-xs text-gray-500">
                            {profile?.employeeCode ||
                                "Employee"}
                        </p>

                    </div>

                </button>

            </div>

            {/* =========================
                SUMMARY CARDS
            ========================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* TASKS */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Total Tasks
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {taskSummary.total}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                {taskSummary.completed} completed
                            </p>

                        </div>

                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i className="fas fa-tasks" />
                        </div>

                    </div>

                </div>

                {/* PENDING LEAVE */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Pending Leave
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {leaveSummary.pending}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                {leaveSummary.approved} approved
                            </p>

                        </div>

                        <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            <i className="fas fa-calendar-alt" />
                        </div>

                    </div>

                </div>

                {/* PERFORMANCE */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Performance
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">

                                {performance?.averageRating ??
                                    "—"}

                                {performance?.averageRating !==
                                    null &&
                                    performance?.averageRating !==
                                        undefined && (
                                        <span className="text-base font-normal text-gray-400 ml-1">
                                            /5
                                        </span>
                                    )}

                            </p>

                            <p className="text-xs text-gray-400 mt-1">

                                {performance?.count || 0} review
                                {performance?.count === 1
                                    ? ""
                                    : "s"}

                            </p>

                        </div>

                        <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <i className="fas fa-star" />
                        </div>

                    </div>

                </div>

                {/* NOTIFICATIONS */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Unread Notifications
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {unreadNotifications.length}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                Stay updated
                            </p>

                        </div>

                        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i className="fas fa-bell" />
                        </div>

                    </div>

                </div>

            </div>

            {/* =========================
                EMPLOYEE INFORMATION /
                QUICK ACTIONS
            ========================== */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* EMPLOYEE INFORMATION */}

                <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">

                    <div className="flex items-center justify-between mb-5">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                Employee Information
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Your current employee details.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/employee/profile")
                            }
                            className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                        >
                            View
                        </button>

                    </div>

                    <div className="space-y-4">

                        {/* EMPLOYEE CODE */}

                        <div>

                            <p className="text-xs text-gray-400">
                                Employee Code
                            </p>

                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {profile?.employeeCode ||
                                    "Not available"}
                            </p>

                        </div>

                        {/* DEPARTMENT */}

                        <div>

                            <p className="text-xs text-gray-400">
                                Department
                            </p>

                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {getDepartmentName()}
                            </p>

                        </div>

                        {/* DESIGNATION */}

                        <div>

                            <p className="text-xs text-gray-400">
                                Designation
                            </p>

                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {profile?.designation ||
                                    "Not available"}
                            </p>

                        </div>

                        {/* EMAIL */}

                        <div>

                            <p className="text-xs text-gray-400">
                                Email
                            </p>

                            <p className="text-sm font-medium text-gray-900 mt-1 break-all">
                                {profile?.email ||
                                    profile?.personalEmail ||
                                    "Not available"}
                            </p>

                        </div>

                    </div>

                </div>

                {/* QUICK ACTIONS */}

                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">

                    <div className="mb-5">

                        <h2 className="text-lg font-semibold text-gray-900">
                            Quick Access
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Quickly access your frequently used sections.
                        </p>

                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        {/* TASKS */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/employee/tasks")
                            }
                            className="group border border-gray-100 rounded-xl p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition"
                        >

                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100">
                                <i className="fas fa-tasks" />
                            </div>

                            <p className="text-sm font-semibold text-gray-900 mt-3">
                                Tasks
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                View tasks
                            </p>

                        </button>

                        {/* LEAVE */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/employee/leave")
                            }
                            className="group border border-gray-100 rounded-xl p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition"
                        >

                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100">
                                <i className="fas fa-calendar-alt" />
                            </div>

                            <p className="text-sm font-semibold text-gray-900 mt-3">
                                Leave
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                Manage leave
                            </p>

                        </button>

                        {/* DOCUMENTS */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/employee/documents")
                            }
                            className="group border border-gray-100 rounded-xl p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition"
                        >

                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100">
                                <i className="fas fa-file-alt" />
                            </div>

                            <p className="text-sm font-semibold text-gray-900 mt-3">
                                Documents
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                View documents
                            </p>

                        </button>

                        {/* NOTIFICATIONS */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/employee/notifications"
                                )
                            }
                            className="group border border-gray-100 rounded-xl p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition"
                        >

                            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100">
                                <i className="fas fa-bell" />
                            </div>

                            <p className="text-sm font-semibold text-gray-900 mt-3">
                                Notifications
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                View updates
                            </p>

                        </button>

                    </div>

                </div>

            </div>

            {/* =========================
                RECENT TASKS
            ========================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* RECENT TASKS */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                Recent Tasks
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Your latest assigned tasks.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/employee/tasks")
                            }
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            View all
                        </button>

                    </div>

                    {recentTasks.length === 0 ? (

                        <div className="px-5 py-10 text-center">

                            <i className="fas fa-tasks text-2xl text-gray-300" />

                            <p className="text-sm text-gray-500 mt-3">
                                No tasks available.
                            </p>

                        </div>

                    ) : (

                        <div className="divide-y divide-gray-100">

                            {recentTasks.map(
                                (task) => (
                                    <div
                                        key={task._id}
                                        className="px-5 py-4"
                                    >

                                        <div className="flex items-start justify-between gap-4">

                                            <div className="min-w-0">

                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {task.title ||
                                                        "Untitled Task"}
                                                </p>

                                                <p className="text-xs text-gray-400 mt-1">
                                                    Due{" "}
                                                    {formatDate(
                                                        task.dueDate
                                                    )}
                                                </p>

                                            </div>

                                            <span
                                                className={`flex-shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTaskStatusStyle(
                                                    task.status
                                                )}`}
                                            >
                                                {task.status ===
                                                "Pending"
                                                    ? "To Do"
                                                    : task.status}
                                            </span>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                    )}

                </div>

                {/* RECENT NOTIFICATIONS */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                Recent Notifications
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Latest updates from the company.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/employee/notifications"
                                )
                            }
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            View all
                        </button>

                    </div>

                    {recentNotifications.length === 0 ? (

                        <div className="px-5 py-10 text-center">

                            <i className="fas fa-bell-slash text-2xl text-gray-300" />

                            <p className="text-sm text-gray-500 mt-3">
                                No notifications yet.
                            </p>

                        </div>

                    ) : (

                        <div className="divide-y divide-gray-100">

                            {recentNotifications.map(
                                (notification) => (

                                    <div
                                        key={notification._id}
                                        className={`px-5 py-4 ${
                                            notification.isRead !==
                                            true
                                                ? "bg-indigo-50/30"
                                                : ""
                                        }`}
                                    >

                                        <div className="flex items-start gap-3">

                                            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <i className="fas fa-bell text-sm" />
                                            </div>

                                            <div className="min-w-0">

                                                <p
                                                    className={`text-sm ${
                                                        notification.isRead !==
                                                        true
                                                            ? "font-semibold text-gray-900"
                                                            : "font-medium text-gray-800"
                                                    }`}
                                                >
                                                    {notification.title}
                                                </p>

                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {
                                                        notification.message
                                                    }
                                                </p>

                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatDate(
                                                        notification.createdAt
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            </div>

            {/* =========================
                LEAVE SUMMARY
            ========================== */}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Leave Overview
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Summary of your leave requests.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/employee/leave")
                        }
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        View leave
                    </button>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

                    {/* TOTAL */}

                    <div className="p-5">

                        <p className="text-xs text-gray-400">
                            Total Requests
                        </p>

                        <p className="text-2xl font-semibold text-gray-900 mt-2">
                            {leaveSummary.total}
                        </p>

                    </div>

                    {/* APPROVED */}

                    <div className="p-5">

                        <p className="text-xs text-gray-400">
                            Approved
                        </p>

                        <p className="text-2xl font-semibold text-green-600 mt-2">
                            {leaveSummary.approved}
                        </p>

                    </div>

                    {/* REJECTED */}

                    <div className="p-5">

                        <p className="text-xs text-gray-400">
                            Rejected
                        </p>

                        <p className="text-2xl font-semibold text-red-600 mt-2">
                            {leaveSummary.rejected}
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default EmployeeDashboard;