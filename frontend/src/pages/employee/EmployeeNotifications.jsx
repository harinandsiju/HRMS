import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

function EmployeeNotifications() {
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeFilter, setActiveFilter] = useState("All");

    const [markingAll, setMarkingAll] = useState(false);
    const [markingId, setMarkingId] = useState(null);

    const [deletingId, setDeletingId] = useState(null);
    const [notificationToDelete, setNotificationToDelete] =
        useState(null);

    // =========================
    // FETCH NOTIFICATIONS
    // =========================

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/notifications/my-notifications"
            );

            setNotifications(
                response.data.notifications || []
            );
        } catch (err) {
            console.error(
                "Fetch employee notifications error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load notifications."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // =========================
    // HELPERS
    // =========================

    const getUnread = (notification) => {
        return notification?.isRead !== true;
    };

    const unreadCount = useMemo(() => {
        return notifications.filter(
            (notification) =>
                getUnread(notification)
        ).length;
    }, [notifications]);

    const filteredNotifications = useMemo(() => {
        if (activeFilter === "Unread") {
            return notifications.filter(
                (notification) =>
                    getUnread(notification)
            );
        }

        if (activeFilter === "Read") {
            return notifications.filter(
                (notification) =>
                    !getUnread(notification)
            );
        }

        return notifications;
    }, [notifications, activeFilter]);

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

    const formatTime = (date) => {
        if (!date) {
            return "";
        }

        return new Date(date).toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    const getNotificationType = (notification) => {
        return (
            notification?.notificationType ||
            notification?.type ||
            "Notification"
        );
    };

    const getTypeStyle = (notification) => {
        const type = getNotificationType(
            notification
        ).toLowerCase();

        if (
            type.includes("leave") ||
            type.includes("absence")
        ) {
            return {
                icon: "fas fa-calendar-alt",
                className:
                    "bg-orange-50 text-orange-600"
            };
        }

        if (
            type.includes("payroll") ||
            type.includes("salary")
        ) {
            return {
                icon: "fas fa-wallet",
                className:
                    "bg-green-50 text-green-600"
            };
        }

        if (
            type.includes("task") ||
            type.includes("assignment")
        ) {
            return {
                icon: "fas fa-tasks",
                className:
                    "bg-blue-50 text-blue-600"
            };
        }

        if (
            type.includes("performance") ||
            type.includes("review")
        ) {
            return {
                icon: "fas fa-chart-line",
                className:
                    "bg-violet-50 text-violet-600"
            };
        }

        if (
            type.includes("document")
        ) {
            return {
                icon: "fas fa-file-alt",
                className:
                    "bg-indigo-50 text-indigo-600"
            };
        }

        return {
            icon: "fas fa-bell",
            className:
                "bg-gray-100 text-gray-600"
        };
    };

    // =========================
    // MARK ONE AS READ
    // =========================

    const handleMarkAsRead = async (
        notification
    ) => {
        if (!notification?._id) {
            return;
        }

        if (!getUnread(notification)) {
            return;
        }

        try {
            setMarkingId(notification._id);

            await api.patch(
                `/notifications/${notification._id}/read`
            );

            setNotifications((current) =>
                current.map((item) =>
                    item._id === notification._id
                        ? {
                              ...item,
                              isRead: true
                          }
                        : item
                )
            );
        } catch (err) {
            console.error(
                "Mark notification as read error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Failed to mark notification as read."
            );
        } finally {
            setMarkingId(null);
        }
    };

    // =========================
    // MARK ALL AS READ
    // =========================

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) {
            return;
        }

        try {
            setMarkingAll(true);

            await api.patch(
                "/notifications/read-all"
            );

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true
                }))
            );
        } catch (err) {
            console.error(
                "Mark all notifications as read error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Failed to mark all notifications as read."
            );
        } finally {
            setMarkingAll(false);
        }
    };

    // =========================
    // DELETE NOTIFICATION
    // =========================

    const handleDeleteNotification = async () => {
        if (!notificationToDelete?._id) {
            return;
        }

        try {
            setDeletingId(
                notificationToDelete._id
            );

            await api.delete(
                `/notifications/${notificationToDelete._id}`
            );

            const deletedId =
                notificationToDelete._id;

            setNotifications((current) =>
                current.filter(
                    (notification) =>
                        notification._id !== deletedId
                )
            );

            setNotificationToDelete(null);
        } catch (err) {
            console.error(
                "Delete notification error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Failed to delete notification."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="space-y-6">

                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-80 bg-gray-100 rounded mt-2 animate-pulse" />
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                    <div className="px-5 py-4 border-b border-gray-100">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>

                    <div className="p-5 space-y-4">

                        {[1, 2, 3, 4].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="flex gap-4 animate-pulse"
                                >
                                    <div className="w-11 h-11 rounded-full bg-gray-200" />

                                    <div className="flex-1">
                                        <div className="h-4 w-48 bg-gray-200 rounded" />
                                        <div className="h-3 w-full max-w-xl bg-gray-100 rounded mt-3" />
                                        <div className="h-3 w-24 bg-gray-100 rounded mt-2" />
                                    </div>
                                </div>
                            )
                        )}

                    </div>

                </div>

            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* =========================
                PAGE HEADER
            ========================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Notifications
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Stay updated with important information from the company.
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={markingAll}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                        <i className="fas fa-check-double" />

                        {markingAll
                            ? "Marking..."
                            : "Mark all as read"}
                    </button>
                )}

            </div>

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
                        onClick={fetchNotifications}
                        className="text-sm font-medium text-red-700 hover:text-red-800"
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* =========================
                SUMMARY
            ========================== */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Total Notifications
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {notifications.length}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <i className="fas fa-bell" />
                        </div>

                    </div>

                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Unread
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {unreadCount}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i className="fas fa-envelope" />
                        </div>

                    </div>

                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Read
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {notifications.length -
                                    unreadCount}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <i className="fas fa-envelope-open" />
                        </div>

                    </div>

                </div>

            </div>

            {/* =========================
                NOTIFICATION CARD
            ========================== */}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                {/* HEADER */}

                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Your Notifications
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            {filteredNotifications.length} notification
                            {filteredNotifications.length !== 1
                                ? "s"
                                : ""}{" "}
                            shown
                        </p>

                    </div>

                    {/* FILTER */}

                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">

                        {["All", "Unread", "Read"].map(
                            (filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() =>
                                        setActiveFilter(
                                            filter
                                        )
                                    }
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                                        activeFilter ===
                                        filter
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {filter}
                                </button>
                            )
                        )}

                    </div>

                </div>

                {/* NOTIFICATIONS */}

                {filteredNotifications.length === 0 ? (

                    <div className="px-6 py-16 text-center">

                        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                            <i className="fas fa-bell-slash text-2xl" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                            {activeFilter === "Unread"
                                ? "No unread notifications"
                                : activeFilter === "Read"
                                ? "No read notifications"
                                : "No notifications"}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            {activeFilter === "Unread"
                                ? "You are all caught up."
                                : "There are no notifications to display."}
                        </p>

                    </div>

                ) : (

                    <div className="divide-y divide-gray-100">

                        {filteredNotifications.map(
                            (notification) => {

                                const unread =
                                    getUnread(
                                        notification
                                    );

                                const typeStyle =
                                    getTypeStyle(
                                        notification
                                    );

                                return (
                                    <div
                                        key={
                                            notification._id
                                        }
                                        className={`px-5 py-5 transition ${
                                            unread
                                                ? "bg-indigo-50/30"
                                                : "bg-white"
                                        } hover:bg-gray-50`}
                                    >

                                        <div className="flex gap-4">

                                            {/* ICON */}

                                            <div
                                                className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${typeStyle.className}`}
                                            >
                                                <i
                                                    className={
                                                        typeStyle.icon
                                                    }
                                                />
                                            </div>

                                            {/* CONTENT */}

                                            <div className="flex-1 min-w-0">

                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                                                    <div className="min-w-0">

                                                        <div className="flex items-center gap-2 flex-wrap">

                                                            <h3
                                                                className={`text-sm ${
                                                                    unread
                                                                        ? "font-semibold text-gray-900"
                                                                        : "font-medium text-gray-800"
                                                                }`}
                                                            >
                                                                {
                                                                    notification.title
                                                                }
                                                            </h3>

                                                            {unread && (
                                                                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                                            )}

                                                        </div>

                                                        <p className="text-sm text-gray-600 mt-2 leading-6 whitespace-pre-wrap">
                                                            {
                                                                notification.message
                                                            }
                                                        </p>

                                                    </div>

                                                    {/* ACTIONS */}

                                                    <div className="flex items-center gap-3 flex-shrink-0">

                                                        {unread && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleMarkAsRead(
                                                                        notification
                                                                    )
                                                                }
                                                                disabled={
                                                                    markingId ===
                                                                        notification._id ||
                                                                    deletingId ===
                                                                        notification._id
                                                                }
                                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                                                            >
                                                                {markingId ===
                                                                notification._id
                                                                    ? "Marking..."
                                                                    : "Mark as read"}
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setNotificationToDelete(
                                                                    notification
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                notification._id
                                                            }
                                                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </div>

                                                {/* META */}

                                                <div className="flex items-center gap-3 flex-wrap mt-3">

                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                                        {
                                                            getNotificationType(
                                                                notification
                                                            )
                                                        }
                                                    </span>

                                                    <span className="text-xs text-gray-400">
                                                        {formatDate(
                                                            notification.createdAt
                                                        )}
                                                        {" · "}
                                                        {formatTime(
                                                            notification.createdAt
                                                        )}
                                                    </span>

                                                    {!unread && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                                            <i className="fas fa-check" />
                                                            Read
                                                        </span>
                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </div>

            {/* =========================
                DELETE CONFIRMATION MODAL
            ========================== */}

            {notificationToDelete && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    onClick={() =>
                        deletingId
                            ? null
                            : setNotificationToDelete(null)
                    }
                >

                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="p-6">

                            <div className="flex items-start gap-4">

                                <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                                    <i className="fas fa-trash" />
                                </div>

                                <div>

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Delete Notification
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-2 leading-6">
                                        Are you sure you want to delete this notification?
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setNotificationToDelete(
                                        null
                                    )
                                }
                                disabled={!!deletingId}
                                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleDeleteNotification
                                }
                                disabled={!!deletingId}
                                className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {deletingId
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default EmployeeNotifications;