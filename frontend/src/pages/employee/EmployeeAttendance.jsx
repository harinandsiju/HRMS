import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

function EmployeeAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    const [filter, setFilter] = useState("month");

    const [customStartDate, setCustomStartDate] =
        useState("");

    const [customEndDate, setCustomEndDate] =
        useState("");

    // =========================
    // FETCH ATTENDANCE
    // =========================

    const fetchAttendance = async (
        selectedFilter = filter
    ) => {
        try {
            setLoading(true);
            setError("");

            let url = "/attendance/my-attendance";

            const today = new Date();

            if (selectedFilter === "week") {
                const start = new Date(today);
                const day = start.getDay();

                const mondayOffset =
                    day === 0 ? 6 : day - 1;

                start.setDate(
                    start.getDate() - mondayOffset
                );

                const end = new Date(start);
                end.setDate(
                    start.getDate() + 6
                );

                url +=
                    `?startDate=${formatDateForApi(start)}` +
                    `&endDate=${formatDateForApi(end)}`;
            }

            if (selectedFilter === "month") {
                const start = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );

                const end = new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0
                );

                url +=
                    `?startDate=${formatDateForApi(start)}` +
                    `&endDate=${formatDateForApi(end)}`;
            }

            if (selectedFilter === "custom") {
                if (
                    !customStartDate ||
                    !customEndDate
                ) {
                    setAttendance([]);
                    setLoading(false);
                    return;
                }

                url +=
                    `?startDate=${customStartDate}` +
                    `&endDate=${customEndDate}`;
            }

            const response =
                await api.get(url);

            setAttendance(
                response.data.attendance || []
            );

        } catch (err) {
            console.error(
                "Fetch employee attendance error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load attendance."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================
    // DATE HELPERS
    // =========================

    const formatDateForApi = (date) => {
        const year =
            date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date) => {
        if (!date) {
            return "-";
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
            return "-";
        }

        return new Date(date).toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    const formatWorkingHours = (hours) => {
        const value = Number(hours || 0);

        if (!value) {
            return "0h 0m";
        }

        const wholeHours =
            Math.floor(value);

        const minutes =
            Math.round(
                (value - wholeHours) * 60
            );

        if (minutes === 60) {
            return `${wholeHours + 1}h 0m`;
        }

        return `${wholeHours}h ${minutes}m`;
    };

    // =========================
    // TODAY'S ATTENDANCE
    // =========================

    const todayAttendance =
        useMemo(() => {
            const today =
                new Date();

            return attendance.find(
                (record) => {
                    const recordDate =
                        new Date(record.date);

                    return (
                        recordDate.getFullYear() ===
                            today.getFullYear() &&
                        recordDate.getMonth() ===
                            today.getMonth() &&
                        recordDate.getDate() ===
                            today.getDate()
                    );
                }
            );
        }, [attendance]);

    // =========================
    // SUMMARY
    // =========================

    const summary =
        useMemo(() => {
            return {
                present:
                    attendance.filter(
                        (item) =>
                            item.status ===
                            "Present"
                    ).length,

                absent:
                    attendance.filter(
                        (item) =>
                            item.status ===
                            "Absent"
                    ).length,

                halfDay:
                    attendance.filter(
                        (item) =>
                            item.status ===
                            "Half Day"
                    ).length,

                leave:
                    attendance.filter(
                        (item) =>
                            item.status ===
                            "Leave"
                    ).length
            };
        }, [attendance]);

    // =========================
    // CHECK IN
    // =========================

    const handleCheckIn = async () => {
        try {
            setActionLoading(true);
            setError("");

            const response =
                await api.post(
                    "/attendance/my-attendance/check-in"
                );

            setToast({
                type: "success",
                message:
                    response.data.message ||
                    "Checked in successfully."
            });

            await fetchAttendance(filter);

        } catch (err) {
            console.error(
                "Check-in error:",
                err
            );

            setToast({
                type: "error",
                message:
                    err.response?.data?.message ||
                    "Failed to check in."
            });

        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // CHECK OUT
    // =========================

    const handleCheckOut = async () => {
        try {
            setActionLoading(true);
            setError("");

            const response =
                await api.patch(
                    "/attendance/my-attendance/check-out"
                );

            setToast({
                type: "success",
                message:
                    response.data.message ||
                    "Checked out successfully."
            });

            await fetchAttendance(filter);

        } catch (err) {
            console.error(
                "Check-out error:",
                err
            );

            setToast({
                type: "error",
                message:
                    err.response?.data?.message ||
                    "Failed to check out."
            });

        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // FILTER CHANGE
    // =========================

    const handleFilterChange = (
        selectedFilter
    ) => {
        setFilter(selectedFilter);

        if (
            selectedFilter !==
            "custom"
        ) {
            fetchAttendance(
                selectedFilter
            );
        }
    };

    const handleCustomFilter = () => {
        if (
            !customStartDate ||
            !customEndDate
        ) {
            setToast({
                type: "error",
                message:
                    "Please select both dates."
            });

            return;
        }

        if (
            customStartDate >
            customEndDate
        ) {
            setToast({
                type: "error",
                message:
                    "Start date cannot be after end date."
            });

            return;
        }

        fetchAttendance("custom");
    };

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        fetchAttendance("month");
    }, []);

    // =========================
    // TOAST AUTO HIDE
    // =========================

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer =
            setTimeout(() => {
                setToast(null);
            }, 3000);

        return () =>
            clearTimeout(timer);
    }, [toast]);

    // =========================
    // STATUS STYLE
    // =========================

    const getStatusClass = (
        status
    ) => {
        switch (status) {
            case "Present":
                return "bg-green-50 text-green-700";

            case "Absent":
                return "bg-red-50 text-red-700";

            case "Half Day":
                return "bg-orange-50 text-orange-700";

            case "Leave":
                return "bg-blue-50 text-blue-700";

            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // =========================
    // UI
    // =========================

    return (
        <div className="space-y-6">

            {/* TOAST */}

            {toast && (
                <div
                    className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium ${
                        toast.type === "success"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <i
                            className={
                                toast.type ===
                                "success"
                                    ? "fas fa-check-circle"
                                    : "fas fa-exclamation-circle"
                            }
                        />

                        {toast.message}
                    </div>
                </div>
            )}

            {/* HEADER */}

            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    My Attendance
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    Track your daily attendance
                    and working hours.
                </p>
            </div>

            {/* TODAY'S ATTENDANCE */}

            <div className="bg-white rounded-xl border border-gray-200 p-6">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                    <div>
                        <p className="text-sm text-gray-500">
                            Today's Attendance
                        </p>

                        <div className="flex items-center gap-3 mt-2">

                            <div
                                className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                                    todayAttendance
                                        ? "bg-green-50 text-green-600"
                                        : "bg-indigo-50 text-indigo-600"
                                }`}
                            >
                                <i className="fas fa-calendar-check" />
                            </div>

                            <div>
                                <p className="text-lg font-semibold text-gray-900">
                                    {todayAttendance
                                        ? todayAttendance.checkOut
                                            ? "Completed"
                                            : "Checked In"
                                        : "Not Checked In"}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {formatDisplayDate(
                                        new Date()
                                    )}
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                        <div>
                            <p className="text-xs text-gray-500">
                                Check In
                            </p>

                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {formatTime(
                                    todayAttendance?.checkIn
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-500">
                                Check Out
                            </p>

                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {formatTime(
                                    todayAttendance?.checkOut
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-500">
                                Working Hours
                            </p>

                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {formatWorkingHours(
                                    todayAttendance?.workingHours
                                )}
                            </p>
                        </div>

                    </div>

                    <div className="flex gap-3">

                        <button
                            type="button"
                            onClick={handleCheckIn}
                            disabled={
                                actionLoading ||
                                !!todayAttendance?.checkIn
                            }
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                                actionLoading ||
                                todayAttendance?.checkIn
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                        >
                            <i className="fas fa-sign-in-alt mr-2" />

                            {actionLoading
                                ? "Processing..."
                                : "Check In"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCheckOut}
                            disabled={
                                actionLoading ||
                                !todayAttendance?.checkIn ||
                                !!todayAttendance?.checkOut
                            }
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                                actionLoading ||
                                !todayAttendance?.checkIn ||
                                todayAttendance?.checkOut
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-900 text-white hover:bg-gray-800"
                            }`}
                        >
                            <i className="fas fa-sign-out-alt mr-2" />

                            {actionLoading
                                ? "Processing..."
                                : "Check Out"}
                        </button>

                    </div>

                </div>

            </div>

            {/* SUMMARY */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                <SummaryCard
                    label="Present"
                    value={summary.present}
                    icon="fas fa-check-circle"
                    color="green"
                />

                <SummaryCard
                    label="Absent"
                    value={summary.absent}
                    icon="fas fa-times-circle"
                    color="red"
                />

                <SummaryCard
                    label="Half Day"
                    value={summary.halfDay}
                    icon="fas fa-clock"
                    color="orange"
                />

                <SummaryCard
                    label="Leave"
                    value={summary.leave}
                    icon="fas fa-calendar-minus"
                    color="blue"
                />

            </div>

            {/* HISTORY */}

            <div className="bg-white rounded-xl border border-gray-200">

                <div className="p-5 border-b border-gray-200">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Attendance History
                            </h2>

                            <p className="text-xs text-gray-500 mt-1">
                                View your attendance records.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    handleFilterChange(
                                        "week"
                                    )
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                                    filter === "week"
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                This Week
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleFilterChange(
                                        "month"
                                    )
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                                    filter === "month"
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                This Month
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleFilterChange(
                                        "custom"
                                    )
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                                    filter === "custom"
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                Custom Range
                            </button>

                        </div>

                    </div>

                    {filter === "custom" && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-3">

                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Start Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        customStartDate
                                    }
                                    onChange={(e) =>
                                        setCustomStartDate(
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    End Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        customEndDate
                                    }
                                    onChange={(e) =>
                                        setCustomEndDate(
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

<div className="flex items-end gap-2">

    <button
        type="button"
        onClick={handleCustomFilter}
        className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
    >
        Apply
    </button>

    <button
        type="button"
        onClick={() => {
            setCustomStartDate("");
            setCustomEndDate("");
            setFilter("month");
            fetchAttendance("month");
        }}
        className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
    >
        Clear
    </button>

</div>

                        </div>
                    )}

                </div>

                {/* ERROR */}

                {error && (
                    <div className="mx-5 mt-5 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* TABLE */}

                <div className="overflow-x-auto">

                    {loading ? (
                        <div className="p-10 text-center text-sm text-gray-500">
                            Loading attendance...
                        </div>
                    ) : attendance.length === 0 ? (
                        <div className="p-10 text-center">

                            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <i className="fas fa-calendar-times" />
                            </div>

                            <p className="text-sm font-medium text-gray-700 mt-3">
                                No attendance records
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                There are no attendance
                                records for the selected period.
                            </p>

                        </div>
                    ) : (
                        <table className="w-full text-sm">

                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">

                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                                        Date
                                    </th>

                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                                        Status
                                    </th>

                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                                        Check In
                                    </th>

                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                                        Check Out
                                    </th>

                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                                        Working Hours
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {attendance.map(
                                    (record) => (
                                        <tr
                                            key={
                                                record._id
                                            }
                                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                        >

                                            <td className="px-5 py-4 text-gray-700">
                                                {formatDisplayDate(
                                                    record.date
                                                )}
                                            </td>

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                                        record.status
                                                    )}`}
                                                >
                                                    {
                                                        record.status
                                                    }
                                                </span>

                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {formatTime(
                                                    record.checkIn
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {formatTime(
                                                    record.checkOut
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-gray-700 font-medium">
                                                {formatWorkingHours(
                                                    record.workingHours
                                                )}
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>
                    )}

                </div>

                {/* RECORD COUNT */}

                {!loading &&
                    attendance.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-500">
                            Showing{" "}
                            <span className="font-medium text-gray-700">
                                {attendance.length}
                            </span>{" "}
                            attendance record
                            {attendance.length !== 1
                                ? "s"
                                : ""}
                        </div>
                    )}

            </div>

        </div>
    );
}


// =========================
// SUMMARY CARD
// =========================

function SummaryCard({
    label,
    value,
    icon,
    color
}) {
    const colorMap = {
        green:
            "bg-green-50 text-green-600",
        red:
            "bg-red-50 text-red-600",
        orange:
            "bg-orange-50 text-orange-600",
        blue:
            "bg-blue-50 text-blue-600"
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">

            <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}
            >
                <i className={icon} />
            </div>

            <p className="text-xl font-bold text-gray-900">
                {value}
            </p>

            <p className="text-xs text-gray-500">
                {label}
            </p>

        </div>
    );
}

export default EmployeeAttendance;