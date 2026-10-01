import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

function LeaveManagement() {
    const [leaves, setLeaves] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [selectedLeave, setSelectedLeave] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // =========================
    // FETCH LEAVES
    // =========================
    const fetchLeaves = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/leave");

            setLeaves(response.data.leaves || []);
        } catch (err) {
            console.error("Fetch leaves error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to fetch leave requests."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data.departments || []);
        } catch (err) {
            console.error("Fetch departments error:", err);
        }
    };

    useEffect(() => {
        fetchLeaves();
        fetchDepartments();
    }, []);

    // =========================
    // APPROVE / REJECT LEAVE
    // =========================
    const handleLeaveAction = async (leaveId, action) => {
        const actionText =
            action === "approve" ? "approve" : "reject";

        const confirmed = window.confirm(
            `Are you sure you want to ${actionText} this leave request?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");

            const endpoint =
                action === "approve"
                    ? `/leave/${leaveId}/approve`
                    : `/leave/${leaveId}/reject`;

            await api.put(endpoint, {
                adminComment: ""
            });

            setSelectedLeave(null);

            await fetchLeaves();
        } catch (err) {
            console.error(
                `${actionText} leave error:`,
                err
            );

            setError(
                err.response?.data?.message ||
                `Failed to ${actionText} leave request.`
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // HELPER FUNCTIONS
    // =========================
    const getEmployeeName = (leave) => {
        if (!leave.employeeId) {
            return "Unknown Employee";
        }

        return `${leave.employeeId.firstName || ""} ${
            leave.employeeId.lastName || ""
        }`.trim();
    };

    const getDepartmentName = (leave) => {
        const departmentId = leave.employeeId?.departmentId;

        if (!departmentId) {
            return "Not Assigned";
        }

        if (typeof departmentId === "object") {
            return departmentId.name || "Not Assigned";
        }

        const department = departments.find(
            (item) => item._id === departmentId
        );

        return department?.name || "Not Assigned";
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const calculateDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);

        const difference =
            Math.ceil(
                (end - start) /
                    (1000 * 60 * 60 * 24)
            ) + 1;

        return difference > 0 ? difference : 0;
    };

    // =========================
    // FILTER OPTIONS
    // =========================
    const leaveTypes = [
        "Casual Leave",
        "Sick Leave",
        "Annual Leave",
        "Emergency Leave",
        "Other"
    ];

    // =========================
    // FILTER LEAVES
    // =========================
    const filteredLeaves = useMemo(() => {
        return leaves.filter((leave) => {
            const employeeName =
                getEmployeeName(leave).toLowerCase();

            const employeeCode =
                leave.employeeId?.employeeCode?.toLowerCase() ||
                "";

            const departmentId =
                typeof leave.employeeId?.departmentId === "object"
                    ? leave.employeeId?.departmentId?._id
                    : leave.employeeId?.departmentId;

            const matchesSearch =
                !search ||
                employeeName.includes(
                    search.toLowerCase()
                ) ||
                employeeCode.includes(
                    search.toLowerCase()
                );

            const matchesDepartment =
                !departmentFilter ||
                departmentId === departmentFilter;

            const matchesLeaveType =
                !leaveTypeFilter ||
                leave.leaveType === leaveTypeFilter;

            const matchesStatus =
                !statusFilter ||
                leave.status === statusFilter;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesLeaveType &&
                matchesStatus
            );
        });
    }, [
        leaves,
        departments,
        search,
        departmentFilter,
        leaveTypeFilter,
        statusFilter
    ]);

    // =========================
    // SUMMARY
    // =========================
    const totalRequests = leaves.length;

    const pendingRequests = leaves.filter(
        (leave) =>
            leave.status === "Pending"
    ).length;

    const approvedRequests = leaves.filter(
        (leave) =>
            leave.status === "Approved"
    ).length;

    const rejectedRequests = leaves.filter(
        (leave) =>
            leave.status === "Rejected"
    ).length;

    // =========================
    // CLEAR FILTERS
    // =========================
    const clearFilters = () => {
        setSearch("");
        setDepartmentFilter("");
        setLeaveTypeFilter("");
        setStatusFilter("");
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <div className="text-sm text-gray-500">
                Loading leave requests...
            </div>
        );
    }

    // =========================
    // ERROR
    // =========================
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                {error}

                <button
                    onClick={fetchLeaves}
                    className="ml-4 text-red-700 font-medium underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* =========================
                PAGE HEADER
            ========================== */}
            <div>
                <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-indigo-600">
                        Dashboard
                    </span>

                    <span className="text-gray-400">
                        ›
                    </span>

                    <span className="text-gray-700">
                        Leave Management
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">
                    Leave Management
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    View and monitor employee leave requests.
                </p>
            </div>

            {/* =========================
                SUMMARY CARDS
            ========================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <SummaryCard
                    title="Total Leave Requests"
                    value={totalRequests}
                    description="All leave requests"
                    icon="#"
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <SummaryCard
                    title="Pending Requests"
                    value={pendingRequests}
                    description="Currently pending"
                    icon="…"
                    iconClass="bg-orange-50 text-orange-600"
                />

                <SummaryCard
                    title="Approved Requests"
                    value={approvedRequests}
                    description="Approved leaves"
                    icon="✓"
                    iconClass="bg-green-50 text-green-600"
                />

                <SummaryCard
                    title="Rejected Requests"
                    value={rejectedRequests}
                    description="Rejected leaves"
                    icon="×"
                    iconClass="bg-red-50 text-red-600"
                />

            </div>

            {/* =========================
                FILTERS
            ========================== */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">

                <div className="flex items-center justify-between mb-4">

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Leave Requests
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            Search and filter employee leave records.
                        </p>
                    </div>

                    {(search ||
                        departmentFilter ||
                        leaveTypeFilter ||
                        statusFilter) && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    )}

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Employee
                        </label>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Name or Employee ID"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                        </label>

                        <select
                            value={departmentFilter}
                            onChange={(e) =>
                                setDepartmentFilter(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">
                                All Departments
                            </option>

                            {departments.map(
                                (department) => (
                                    <option
                                        key={department._id}
                                        value={department._id}
                                    >
                                        {department.name}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Leave Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Leave Type
                        </label>

                        <select
                            value={leaveTypeFilter}
                            onChange={(e) =>
                                setLeaveTypeFilter(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">
                                All Leave Types
                            </option>

                            {leaveTypes.map(
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

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">
                                All Status
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Approved">
                                Approved
                            </option>

                            <option value="Rejected">
                                Rejected
                            </option>
                        </select>
                    </div>

                </div>
            </div>

            {/* =========================
                TABLE
            ========================== */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Leave Requests
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            {filteredLeaves.length} request
                            {filteredLeaves.length !== 1
                                ? "s"
                                : ""}{" "}
                            found
                        </p>
                    </div>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-gray-50 border-b border-gray-200">

                            <tr>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Employee
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Department
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Leave Type
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Start Date
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    End Date
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Days
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Status
                                </th>

                                <th className="text-center px-5 py-3 font-medium text-gray-600">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredLeaves.length > 0 ? (

                                filteredLeaves.map(
                                    (leave) => (

                                        <tr
                                            key={leave._id}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition"
                                        >

                                            {/* Employee */}
                                            <td className="px-5 py-4">

                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {getEmployeeName(
                                                            leave
                                                        )}
                                                    </p>

                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {leave
                                                            .employeeId
                                                            ?.employeeCode ||
                                                            "-"}
                                                    </p>
                                                </div>

                                            </td>

                                            {/* Department */}
                                            <td className="px-5 py-4 text-gray-600">
                                                {getDepartmentName(
                                                    leave
                                                )}
                                            </td>

                                            {/* Leave Type */}
                                            <td className="px-5 py-4">

                                                <span className="font-medium text-gray-700">
                                                    {leave.leaveType ||
                                                        "-"}
                                                </span>

                                            </td>

                                            {/* Start */}
                                            <td className="px-5 py-4 text-gray-600">
                                                {formatDate(
                                                    leave.startDate
                                                )}
                                            </td>

                                            {/* End */}
                                            <td className="px-5 py-4 text-gray-600">
                                                {formatDate(
                                                    leave.endDate
                                                )}
                                            </td>

                                            {/* Days */}
                                            <td className="px-5 py-4 text-gray-700 font-medium">
                                                {leave.totalDays ||
                                                    calculateDays(
                                                        leave.startDate,
                                                        leave.endDate
                                                    )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">

                                                <StatusBadge
                                                    status={
                                                        leave.status
                                                    }
                                                />

                                            </td>

                                            {/* Action */}
                                            <td className="px-5 py-4">

                                                <div className="flex items-center justify-center gap-2">

                                                    {/* View */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedLeave(
                                                                leave
                                                            )
                                                        }
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-medium transition"
                                                    >
                                                        View
                                                    </button>

                                                    {/* Approve / Reject */}
                                                    {leave.status ===
                                                        "Pending" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    actionLoading
                                                                }
                                                                onClick={() =>
                                                                    handleLeaveAction(
                                                                        leave._id,
                                                                        "approve"
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {actionLoading
                                                                    ? "..."
                                                                    : "Approve"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    actionLoading
                                                                }
                                                                onClick={() =>
                                                                    handleLeaveAction(
                                                                        leave._id,
                                                                        "reject"
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {actionLoading
                                                                    ? "..."
                                                                    : "Reject"}
                                                            </button>
                                                        </>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="px-5 py-10 text-center text-gray-500"
                                    >
                                        No leave requests found.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>
            </div>

            {/* =========================
                VIEW DETAILS MODAL
            ========================== */}
            {selectedLeave && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Leave Details
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Employee leave request information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedLeave(null)
                                }
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>

                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">

                            {/* Employee */}
                            <div className="bg-gray-50 rounded-lg p-4">

                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Employee Information
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    <DetailRow
                                        label="Employee"
                                        value={getEmployeeName(
                                            selectedLeave
                                        )}
                                    />

                                    <DetailRow
                                        label="Employee ID"
                                        value={
                                            selectedLeave
                                                .employeeId
                                                ?.employeeCode ||
                                            "-"
                                        }
                                    />

                                    <DetailRow
                                        label="Department"
                                        value={getDepartmentName(
                                            selectedLeave
                                        )}
                                    />

                                    <DetailRow
                                        label="Email"
                                        value={
                                            selectedLeave
                                                .employeeId
                                                ?.email || "-"
                                        }
                                    />

                                </div>

                            </div>

                            {/* Leave */}
                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Leave Information
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    <DetailRow
                                        label="Leave Type"
                                        value={
                                            selectedLeave.leaveType ||
                                            "-"
                                        }
                                    />

                                    <DetailRow
                                        label="Status"
                                        value={
                                            selectedLeave.status ||
                                            "-"
                                        }
                                    />

                                    <DetailRow
                                        label="Start Date"
                                        value={formatDate(
                                            selectedLeave.startDate
                                        )}
                                    />

                                    <DetailRow
                                        label="End Date"
                                        value={formatDate(
                                            selectedLeave.endDate
                                        )}
                                    />

                                    <DetailRow
                                        label="Total Days"
                                        value={
                                            selectedLeave.totalDays ||
                                            calculateDays(
                                                selectedLeave.startDate,
                                                selectedLeave.endDate
                                            )
                                        }
                                    />

                                    <DetailRow
                                        label="Applied On"
                                        value={formatDate(
                                            selectedLeave.createdAt
                                        )}
                                    />

                                </div>

                            </div>

                            {/* Reason */}
                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    Reason
                                </h3>

                                <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                                    {selectedLeave.reason ||
                                        "No reason provided."}
                                </div>

                            </div>

                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">

                            <div className="flex gap-2">

                                {selectedLeave.status ===
                                    "Pending" && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={() =>
                                                handleLeaveAction(
                                                    selectedLeave._id,
                                                    "approve"
                                                )
                                            }
                                            className="px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            Approve
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={() =>
                                                handleLeaveAction(
                                                    selectedLeave._id,
                                                    "reject"
                                                )
                                            }
                                            className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedLeave(null)
                                }
                                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

// =========================
// SUMMARY CARD
// =========================
function SummaryCard({
    title,
    value,
    description,
    icon,
    iconClass
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-sm text-gray-500">
                        {title}
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-2">
                        {value}
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                        {description}
                    </p>

                </div>

                <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconClass}`}
                >
                    <span className="text-xl">
                        {icon}
                    </span>
                </div>

            </div>

        </div>
    );
}

// =========================
// STATUS BADGE
// =========================
function StatusBadge({ status }) {
    const styles = {
        Pending: "bg-orange-50 text-orange-700",
        Approved: "bg-green-50 text-green-700",
        Rejected: "bg-red-50 text-red-700"
    };

    return (
        <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                styles[status] ||
                "bg-gray-50 text-gray-600"
            }`}
        >
            {status || "-"}
        </span>
    );
}

// =========================
// DETAIL ROW
// =========================
function DetailRow({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-400">
                {label}
            </p>

            <p className="text-sm font-medium text-gray-800 mt-1">
                {value}
            </p>
        </div>
    );
}

export default LeaveManagement;