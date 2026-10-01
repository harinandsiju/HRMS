import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const NOTIFICATION_TYPES = [
    "Info",
    "Warning",
    "Success",
    "Task",
    "Leave",
    "Payroll",
    "Other"
];

const EMPTY_FORM = {
    employeeId: "",
    title: "",
    message: "",
    type: "Info",
    broadcast: false
};

function NotificationManagement() {
    const [notifications, setNotifications] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [employeesLoading, setEmployeesLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [readFilter, setReadFilter] = useState("");

    const [page, setPage] = useState(1);
    const itemsPerPage = 8;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: ""
    });

    useEffect(() => {
        fetchEmployees();
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!toast.visible) return;

        const timer = setTimeout(() => {
            setToast((current) => ({
                ...current,
                visible: false
            }));
        }, 3500);

        return () => clearTimeout(timer);
    }, [toast.visible]);

    useEffect(() => {
        document.body.style.overflow =
            showCreateModal || showDeleteModal || showDetails
                ? "hidden"
                : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [showCreateModal, showDeleteModal, showDetails]);

    const showToast = (type, message) => {
        setToast({
            visible: true,
            type,
            message
        });
    };

    const fetchEmployees = async () => {
        try {
            setEmployeesLoading(true);

            const response = await api.get(
                "/employees?page=1&limit=100"
            );

            setEmployees(response.data.employees || []);
        } catch (error) {
            console.error(error);

            showToast(
                "error",
                error.response?.data?.message ||
                    "Failed to load employees."
            );
        } finally {
            setEmployeesLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);

            const response = await api.get("/notifications");

            setNotifications(
                response.data.notifications || []
            );
        } catch (error) {
            console.error(error);

            showToast(
                "error",
                error.response?.data?.message ||
                    "Failed to load notifications."
            );
        } finally {
            setLoading(false);
        }
    };

    const getEmployee = (notification) => {
        if (
            notification?.employeeId &&
            typeof notification.employeeId === "object"
        ) {
            return notification.employeeId;
        }

        return employees.find(
            (employee) =>
                employee._id === notification?.employeeId
        );
    };

    const getEmployeeName = (notification) => {
        const employee = getEmployee(notification);

        if (!employee) {
            return "Unknown Employee";
        }

        return `${employee.firstName || ""} ${
            employee.lastName || ""
        }`.trim();
    };

    const getEmployeeCode = (notification) => {
        const employee = getEmployee(notification);

        return employee?.employeeCode || "N/A";
    };

    const getInitials = (notification) => {
        const employee = getEmployee(notification);

        if (!employee) {
            return "NA";
        }

        const first =
            employee.firstName?.charAt(0) || "";

        const last =
            employee.lastName?.charAt(0) || "";

        return `${first}${last}`.toUpperCase() || "NA";
    };

    const getTypeClasses = (type) => {
        switch (type) {
            case "Success":
                return "bg-green-50 text-green-700 border-green-200";

            case "Warning":
                return "bg-amber-50 text-amber-700 border-amber-200";

            case "Task":
                return "bg-blue-50 text-blue-700 border-blue-200";

            case "Leave":
                return "bg-purple-50 text-purple-700 border-purple-200";

            case "Payroll":
                return "bg-orange-50 text-orange-700 border-orange-200";

            case "Info":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";

            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "Success":
                return "fa-solid fa-circle-check";

            case "Warning":
                return "fa-solid fa-triangle-exclamation";

            case "Task":
                return "fa-solid fa-list-check";

            case "Leave":
                return "fa-solid fa-calendar-check";

            case "Payroll":
                return "fa-solid fa-money-bill-wave";

            case "Info":
                return "fa-solid fa-circle-info";

            default:
                return "fa-solid fa-bell";
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const filteredNotifications = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return notifications.filter((notification) => {
            const employeeName =
                getEmployeeName(notification).toLowerCase();

            const employeeCode =
                getEmployeeCode(notification).toLowerCase();

            const title =
                notification.title?.toLowerCase() || "";

            const message =
                notification.message?.toLowerCase() || "";

            const matchesSearch =
                !searchValue ||
                employeeName.includes(searchValue) ||
                employeeCode.includes(searchValue) ||
                title.includes(searchValue) ||
                message.includes(searchValue);

            const notificationEmployeeId =
                typeof notification.employeeId === "object"
                    ? notification.employeeId?._id
                    : notification.employeeId;

            const matchesEmployee =
                !employeeFilter ||
                notificationEmployeeId === employeeFilter;

            const matchesType =
                !typeFilter ||
                notification.type === typeFilter;

            const matchesRead =
                !readFilter ||
                (readFilter === "Read"
                    ? notification.isRead === true
                    : notification.isRead === false);

            return (
                matchesSearch &&
                matchesEmployee &&
                matchesType &&
                matchesRead
            );
        });
    }, [
        notifications,
        employees,
        search,
        employeeFilter,
        typeFilter,
        readFilter
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredNotifications.length / itemsPerPage
        )
    );

    const paginatedNotifications =
        filteredNotifications.slice(
            (page - 1) * itemsPerPage,
            page * itemsPerPage
        );

    const totalNotifications = notifications.length;

    const unreadNotifications = notifications.filter(
        (notification) => notification.isRead === false
    ).length;

    const readNotifications = notifications.filter(
        (notification) => notification.isRead === true
    ).length;

    const employeesCovered = new Set(
        notifications.map((notification) => {
            if (
                notification.employeeId &&
                typeof notification.employeeId === "object"
            ) {
                return notification.employeeId._id;
            }

            return notification.employeeId;
        })
    ).size;

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);
    };

    const handleEmployeeFilterChange = (event) => {
        setEmployeeFilter(event.target.value);
        setPage(1);
    };

    const handleTypeFilterChange = (event) => {
        setTypeFilter(event.target.value);
        setPage(1);
    };

    const handleReadFilterChange = (event) => {
        setReadFilter(event.target.value);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch("");
        setEmployeeFilter("");
        setTypeFilter("");
        setReadFilter("");
        setPage(1);
    };

    const openCreateModal = () => {
        setForm(EMPTY_FORM);
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        if (submitting) return;

        setShowCreateModal(false);
        setForm(EMPTY_FORM);
    };

    const handleFormChange = (event) => {
        const { name, value, type, checked } =
            event.target;

        setForm((current) => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));
    };

    const handleCreateNotification = async (event) => {
        event.preventDefault();

        if (!form.title.trim()) {
            showToast(
                "error",
                "Notification title is required."
            );
            return;
        }

        if (!form.message.trim()) {
            showToast(
                "error",
                "Notification message is required."
            );
            return;
        }

        if (!form.broadcast && !form.employeeId) {
            showToast(
                "error",
                "Select an employee or choose broadcast."
            );
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                title: form.title.trim(),
                message: form.message.trim(),
                type: form.type,
                broadcast: form.broadcast
            };

            if (!form.broadcast) {
                payload.employeeId = form.employeeId;
            }

            const response = await api.post(
                "/notifications",
                payload
            );

            setShowCreateModal(false);
            setForm(EMPTY_FORM);

            await fetchNotifications();

            showToast(
                "success",
                response.data?.message ||
                    "Notification created successfully."
            );
        } catch (error) {
            console.error(error);

            showToast(
                "error",
                error.response?.data?.message ||
                    "Failed to create notification."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const openDetails = (notification) => {
        setSelectedNotification(notification);
        setShowDetails(true);
    };

    const closeDetails = () => {
        setShowDetails(false);

        setTimeout(() => {
            setSelectedNotification(null);
        }, 250);
    };

    const openDeleteModal = (notification) => {
        setSelectedNotification(notification);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setShowDeleteModal(false);

        setTimeout(() => {
            setSelectedNotification(null);
        }, 200);
    };

    const handleDelete = async () => {
        if (!selectedNotification?._id) {
            return;
        }

        try {
            setDeleting(true);

            const response = await api.delete(
                `/notifications/${selectedNotification._id}`
            );

            setNotifications((current) =>
                current.filter(
                    (notification) =>
                        notification._id !==
                        selectedNotification._id
                )
            );

            setShowDeleteModal(false);
            setShowDetails(false);
            setSelectedNotification(null);

            showToast(
                "success",
                response.data?.message ||
                    "Notification deleted successfully."
            );

            if (
                page > 1 &&
                paginatedNotifications.length === 1
            ) {
                setPage((current) =>
                    Math.max(1, current - 1)
                );
            }
        } catch (error) {
            console.error(error);

            showToast(
                "error",
                error.response?.data?.message ||
                    "Failed to delete notification."
            );
        } finally {
            setDeleting(false);
        }
    };

    const hasFilters =
        search ||
        employeeFilter ||
        typeFilter ||
        readFilter;

    return (
        <div className="space-y-6 relative">

            {/* =========================
                PAGE HEADER
            ========================== */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Notifications
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Create and manage notifications sent to employees.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm"
                >
                    <i className="fa-solid fa-plus" />
                    Create Notification
                </button>

            </div>

            {/* =========================
                SUMMARY CARDS
            ========================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Total Notifications
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {totalNotifications}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <i className="fa-solid fa-bell text-lg" />
                        </div>

                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Unread
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {unreadNotifications}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <i className="fa-solid fa-envelope text-lg" />
                        </div>

                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Read
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {readNotifications}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <i className="fa-solid fa-envelope-open text-lg" />
                        </div>

                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Employees Covered
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {employeesCovered}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i className="fa-solid fa-users text-lg" />
                        </div>

                    </div>
                </div>

            </div>

            {/* =========================
                FILTERS
            ========================== */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

                    <div className="relative">

                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />

                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={search}
                            onChange={handleSearchChange}
                            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />

                    </div>

                    <select
                        value={employeeFilter}
                        onChange={handleEmployeeFilterChange}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">
                            All Employees
                        </option>

                        {employees.map((employee) => (
                            <option
                                key={employee._id}
                                value={employee._id}
                            >
                                {employee.firstName}{" "}
                                {employee.lastName}{" "}
                                ({employee.employeeCode})
                            </option>
                        ))}
                    </select>

                    <select
                        value={typeFilter}
                        onChange={handleTypeFilterChange}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">
                            All Types
                        </option>

                        {NOTIFICATION_TYPES.map((type) => (
                            <option
                                key={type}
                                value={type}
                            >
                                {type}
                            </option>
                        ))}
                    </select>

                    <select
                        value={readFilter}
                        onChange={handleReadFilterChange}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">
                            All Read Status
                        </option>

                        <option value="Unread">
                            Unread
                        </option>

                        <option value="Read">
                            Read
                        </option>
                    </select>

                </div>

                {hasFilters && (
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

            </div>

            {/* =========================
                TABLE
            ========================== */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-200">

                    <h3 className="text-lg font-semibold text-gray-900">
                        Notification Records
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        {filteredNotifications.length} notification
                        {filteredNotifications.length !== 1
                            ? "s"
                            : ""}{" "}
                        found
                    </p>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm min-w-[950px]">

                        <thead className="bg-gray-50 border-b border-gray-200">

                            <tr>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Notification
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Employee
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Type
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Read Status
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Created
                                </th>

                                <th className="text-right px-5 py-3 font-medium text-gray-500 w-[130px]">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-center py-12 text-gray-400"
                                    >
                                        <div className="flex flex-col items-center gap-3">

                                            <i className="fa-solid fa-spinner fa-spin text-xl text-indigo-500" />

                                            <span>
                                                Loading notifications...
                                            </span>

                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                paginatedNotifications.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-12"
                                        >
                                            <div className="flex flex-col items-center">

                                                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                                    <i className="fa-solid fa-bell-slash text-xl" />
                                                </div>

                                                <p className="text-gray-700 font-medium mt-4">
                                                    No notifications found
                                                </p>

                                                <p className="text-sm text-gray-400 mt-1">
                                                    Try changing your filters or create a new notification.
                                                </p>

                                            </div>
                                        </td>
                                    </tr>
                                )}

                            {!loading &&
                                paginatedNotifications.map(
                                    (notification) => (
                                        <tr
                                            key={notification._id}
                                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                                !notification.isRead
                                                    ? "bg-indigo-50/30"
                                                    : ""
                                            }`}
                                        >

                                            <td className="px-5 py-4">

                                                <div className="flex items-start gap-3">

                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                            !notification.isRead
                                                                ? "bg-indigo-100 text-indigo-600"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}
                                                    >
                                                        <i
                                                            className={getTypeIcon(
                                                                notification.type
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="min-w-0">

                                                        <p className="font-semibold text-gray-800 truncate max-w-[300px]">
                                                            {notification.title}
                                                        </p>

                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-[340px]">
                                                            {notification.message}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">
                                                        {getInitials(
                                                            notification
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {getEmployeeName(
                                                                notification
                                                            )}
                                                        </p>

                                                        <p className="text-xs text-gray-500">
                                                            {getEmployeeCode(
                                                                notification
                                                            )}
                                                        </p>
                                                    </div>

                                                </div>

                                            </td>

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getTypeClasses(
                                                        notification.type
                                                    )}`}
                                                >
                                                    {notification.type ||
                                                        "Other"}
                                                </span>

                                            </td>

                                            <td className="px-5 py-4">

                                                {notification.isRead ? (
                                                    <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-medium">
                                                        <i className="fa-solid fa-circle-check" />
                                                        Read
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-semibold">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                                        Unread
                                                    </span>
                                                )}

                                            </td>

                                            <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                                                {formatDate(
                                                    notification.createdAt
                                                )}
                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="flex items-center justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetails(
                                                                notification
                                                            )
                                                        }
                                                        title="View notification"
                                                        className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                                                    >
                                                        <i className="fa-solid fa-eye text-xs" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                notification
                                                            )
                                                        }
                                                        title="Delete notification"
                                                        className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                                                    >
                                                        <i className="fa-solid fa-trash text-xs" />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )}

                        </tbody>

                    </table>

                </div>

                {/* Pagination */}
                {!loading &&
                    filteredNotifications.length > 0 && (
                        <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <p className="text-sm text-gray-500">
                                Showing{" "}
                                {Math.min(
                                    (page - 1) *
                                        itemsPerPage +
                                        1,
                                    filteredNotifications.length
                                )}{" "}
                                to{" "}
                                {Math.min(
                                    page * itemsPerPage,
                                    filteredNotifications.length
                                )}{" "}
                                of{" "}
                                {filteredNotifications.length}
                            </p>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                current - 1
                                        )
                                    }
                                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <i className="fa-solid fa-chevron-left text-xs" />
                                </button>

                                <span className="text-sm text-gray-600 px-2">
                                    Page {page} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        page >= totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                current + 1
                                        )
                                    }
                                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <i className="fa-solid fa-chevron-right text-xs" />
                                </button>

                            </div>

                        </div>
                    )}

            </div>

            {/* =========================
                CREATE NOTIFICATION MODAL
            ========================== */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeCreateModal}
                    />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-[notificationModalIn_0.2s_ease-out]">

                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Create Notification
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Send a notification to an employee or all active employees.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>

                        </div>

                        <form
                            onSubmit={handleCreateNotification}
                            className="p-6 space-y-5"
                        >

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notification Type
                                </label>

                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {NOTIFICATION_TYPES.map(
                                        (type) => (
                                            <option
                                                key={type}
                                                value={type}
                                            >
                                                {type}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleFormChange}
                                    placeholder="Enter notification title"
                                    maxLength={120}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                <p className="text-xs text-gray-400 mt-1">
                                    {form.title.length}/120
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>

                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleFormChange}
                                    placeholder="Write the notification message..."
                                    rows={5}
                                    maxLength={500}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                <p className="text-xs text-gray-400 mt-1">
                                    {form.message.length}/500
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4">

                                <label className="flex items-start gap-3 cursor-pointer">

                                    <input
                                        type="checkbox"
                                        name="broadcast"
                                        checked={form.broadcast}
                                        onChange={handleFormChange}
                                        className="mt-1 w-4 h-4 accent-indigo-600"
                                    />

                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Broadcast to all active employees
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            This will create a separate notification for every active employee.
                                        </p>
                                    </div>

                                </label>

                            </div>

                            {!form.broadcast && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee
                                    </label>

                                    <select
                                        name="employeeId"
                                        value={form.employeeId}
                                        onChange={handleFormChange}
                                        disabled={
                                            employeesLoading
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                    >
                                        <option value="">
                                            Select employee
                                        </option>

                                        {employees.map(
                                            (employee) => (
                                                <option
                                                    key={
                                                        employee._id
                                                    }
                                                    value={
                                                        employee._id
                                                    }
                                                >
                                                    {
                                                        employee.firstName
                                                    }{" "}
                                                    {
                                                        employee.lastName
                                                    }{" "}
                                                    (
                                                    {
                                                        employee.employeeCode
                                                    }
                                                    )
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">

                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={submitting}
                                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-paper-plane" />
                                            Send Notification
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =========================
                DETAILS SIDE PANEL
            ========================== */}
            {showDetails && selectedNotification && (
                <div className="fixed inset-0 z-50">

                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={closeDetails}
                    />

                    <div
                        className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${
                            showDetails
                                ? "translate-x-0"
                                : "translate-x-full"
                        }`}
                    >

                        <div className="h-full flex flex-col">

                            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Notification Details
                                    </h2>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Notification information
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeDetails}
                                    className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                >
                                    <i className="fa-solid fa-xmark" />
                                </button>

                            </div>

                            <div className="flex-1 overflow-y-auto p-6">

                                <div className="flex items-start gap-4">

                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                        <i
                                            className={`${getTypeIcon(
                                                selectedNotification.type
                                            )} text-lg`}
                                        />
                                    </div>

                                    <div className="min-w-0">

                                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                                            {
                                                selectedNotification.title
                                            }
                                        </h3>

                                        <span
                                            className={`inline-flex mt-2 px-2.5 py-1 rounded-full border text-xs font-medium ${getTypeClasses(
                                                selectedNotification.type
                                            )}`}
                                        >
                                            {
                                                selectedNotification.type ||
                                                "Other"
                                            }
                                        </span>

                                    </div>

                                </div>

                                <div className="border-t border-gray-200 my-6" />

                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Message
                                    </p>

                                    <p className="text-sm text-gray-700 leading-7 mt-2 whitespace-pre-wrap break-words">
                                        {
                                            selectedNotification.message
                                        }
                                    </p>
                                </div>

                                <div className="border-t border-gray-200 my-6" />

                                <div className="space-y-5">

                                    <div className="flex items-start gap-3">

                                        <i className="fa-solid fa-user text-gray-400 w-4 mt-1" />

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Employee
                                            </p>

                                            <p className="text-sm font-medium text-gray-800 mt-1">
                                                {getEmployeeName(
                                                    selectedNotification
                                                )}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {getEmployeeCode(
                                                    selectedNotification
                                                )}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="flex items-start gap-3">

                                        <i className="fa-solid fa-envelope text-gray-400 w-4 mt-1" />

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Read Status
                                            </p>

                                            <p className="text-sm font-medium text-gray-800 mt-1">
                                                {selectedNotification.isRead
                                                    ? "Read"
                                                    : "Unread"}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="flex items-start gap-3">

                                        <i className="fa-solid fa-calendar text-gray-400 w-4 mt-1" />

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Created
                                            </p>

                                            <p className="text-sm font-medium text-gray-800 mt-1">
                                                {formatDate(
                                                    selectedNotification.createdAt
                                                )}
                                            </p>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            <div className="p-5 border-t border-gray-200">

                                <button
                                    type="button"
                                    onClick={() =>
                                        openDeleteModal(
                                            selectedNotification
                                        )
                                    }
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition"
                                >
                                    <i className="fa-solid fa-trash" />
                                    Delete Notification
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* =========================
                DELETE MODAL
            ========================== */}
            {showDeleteModal &&
                selectedNotification && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={closeDeleteModal}
                        />

                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[notificationModalIn_0.2s_ease-out]">

                            <div className="flex items-start gap-4">

                                <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <i className="fa-solid fa-trash" />
                                </div>

                                <div className="min-w-0">

                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Delete Notification
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-2 leading-6 break-words">
                                        Are you sure you want to delete{" "}
                                        <span className="font-medium text-gray-700 break-all">
                                            {
                                                selectedNotification.title
                                            }
                                        </span>{" "}
                                        sent to{" "}
                                        <span className="font-medium text-gray-700">
                                            {getEmployeeName(
                                                selectedNotification
                                            )}
                                        </span>
                                        ?
                                    </p>

                                    <p className="text-xs text-gray-400 mt-2">
                                        This notification will be removed from active records.
                                    </p>

                                </div>

                            </div>

                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={deleting}
                                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-trash" />
                                            Delete
                                        </>
                                    )}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            {/* =========================
                TOAST
            ========================== */}
            {toast.visible && (
                <div
                    className={`fixed right-5 bottom-5 z-[80] min-w-[300px] max-w-[420px] bg-white border rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 animate-[notificationToastIn_0.25s_ease-out] ${
                        toast.type === "success"
                            ? "border-green-200"
                            : "border-red-200"
                    }`}
                >

                    <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            toast.type === "success"
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                        }`}
                    >
                        <i
                            className={
                                toast.type === "success"
                                    ? "fa-solid fa-check"
                                    : "fa-solid fa-xmark"
                            }
                        />
                    </div>

                    <p className="text-sm font-medium text-gray-700 flex-1">
                        {toast.message}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setToast((current) => ({
                                ...current,
                                visible: false
                            }))
                        }
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <i className="fa-solid fa-xmark text-xs" />
                    </button>

                </div>
            )}

            <style>
                {`
                    @keyframes notificationModalIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px) scale(0.98);
                        }

                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    @keyframes notificationToastIn {
                        from {
                            opacity: 0;
                            transform: translateY(12px);
                        }

                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>

        </div>
    );
}

export default NotificationManagement;