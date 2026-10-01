import { useEffect, useState } from "react";
import api from "../../api/axios";

function MyLeave() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [selectedLeave, setSelectedLeave] = useState(null);

    const [modalMode, setModalMode] = useState("");

    const [toast, setToast] = useState({
        show: false,
        type: "",
        message: ""
    });

    const [formData, setFormData] = useState({
        leaveType: "Casual Leave",
        startDate: "",
        endDate: "",
        reason: ""
    });

    // ==================================================
    // TOAST
    // ==================================================

    const showToast = (type, message) => {
        setToast({
            show: true,
            type,
            message
        });

        setTimeout(() => {
            setToast({
                show: false,
                type: "",
                message: ""
            });
        }, 3500);
    };

    // ==================================================
    // FETCH MY LEAVES
    // ==================================================

    const fetchMyLeaves = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/leave/my-leaves");

            setLeaves(
                Array.isArray(response.data?.leaves)
                    ? response.data.leaves
                    : []
            );
        } catch (err) {
            console.error("Fetch My Leaves Error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load your leave records."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyLeaves();
    }, []);

    // ==================================================
    // FORM CHANGE
    // ==================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ==================================================
    // RESET FORM
    // ==================================================

    const resetForm = () => {
        setFormData({
            leaveType: "Casual Leave",
            startDate: "",
            endDate: "",
            reason: ""
        });
    };

    // ==================================================
    // VALIDATE FORM
    // ==================================================

    const validateForm = () => {
        if (
            !formData.leaveType ||
            !formData.startDate ||
            !formData.endDate ||
            !formData.reason.trim()
        ) {
            showToast(
                "error",
                "Please fill in all leave details."
            );

            return false;
        }

        if (
            new Date(formData.endDate) <
            new Date(formData.startDate)
        ) {
            showToast(
                "error",
                "End date cannot be before start date."
            );

            return false;
        }

        return true;
    };

    // ==================================================
    // APPLY LEAVE
    // ==================================================

    const handleApplyClick = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setModalMode("apply");
        setShowConfirmModal(true);
    };

    const handleApplyLeave = async () => {
        try {
            setSubmitting(true);

            await api.post("/leave", {
                leaveType: formData.leaveType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason.trim()
            });

            setShowConfirmModal(false);
            setShowApplyModal(false);

            resetForm();

            await fetchMyLeaves();

            showToast(
                "success",
                "Leave application submitted successfully."
            );
        } catch (err) {
            console.error("Apply Leave Error:", err);

            setShowConfirmModal(false);

            showToast(
                "error",
                err.response?.data?.message ||
                    "Failed to submit leave application."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==================================================
    // OPEN EDIT MODAL
    // ==================================================

    const handleEditClick = (leave) => {
        if (leave.status !== "Pending") {
            return;
        }

        setSelectedLeave(leave);

        setFormData({
            leaveType: leave.leaveType || "Casual Leave",
            startDate: formatInputDate(leave.startDate),
            endDate: formatInputDate(leave.endDate),
            reason: leave.reason || ""
        });

        setShowEditModal(true);
    };

    // ==================================================
    // UPDATE LEAVE
    // ==================================================

    const handleUpdateClick = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setModalMode("edit");
        setShowConfirmModal(true);
    };

    const handleUpdateLeave = async () => {
        if (!selectedLeave?._id) {
            return;
        }

        try {
            setSubmitting(true);

            await api.put(
                `/leave/${selectedLeave._id}`,
                {
                    leaveType: formData.leaveType,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    reason: formData.reason.trim()
                }
            );

            setShowConfirmModal(false);
            setShowEditModal(false);

            setSelectedLeave(null);

            resetForm();

            await fetchMyLeaves();

            showToast(
                "success",
                "Leave request updated successfully."
            );
        } catch (err) {
            console.error("Update Leave Error:", err);

            setShowConfirmModal(false);

            showToast(
                "error",
                err.response?.data?.message ||
                    "Failed to update leave request."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==================================================
    // OPEN DELETE MODAL
    // ==================================================

    const handleDeleteClick = (leave) => {
        if (leave.status !== "Pending") {
            return;
        }

        setSelectedLeave(leave);
        setShowDeleteModal(true);
    };

    // ==================================================
    // DELETE LEAVE
    // ==================================================

    const handleDeleteLeave = async () => {
        if (!selectedLeave?._id) {
            return;
        }

        try {
            setDeleting(true);

            await api.delete(
                `/leave/${selectedLeave._id}`
            );

            setShowDeleteModal(false);
            setSelectedLeave(null);

            await fetchMyLeaves();

            showToast(
                "success",
                "Leave request deleted successfully."
            );
        } catch (err) {
            console.error("Delete Leave Error:", err);

            setShowDeleteModal(false);

            showToast(
                "error",
                err.response?.data?.message ||
                    "Failed to delete leave request."
            );
        } finally {
            setDeleting(false);
        }
    };

    // ==================================================
    // CLOSE MODALS
    // ==================================================

    const closeApplyModal = () => {
        if (submitting) {
            return;
        }

        setShowApplyModal(false);
        resetForm();
    };

    const closeEditModal = () => {
        if (submitting) {
            return;
        }

        setShowEditModal(false);
        setSelectedLeave(null);
        resetForm();
    };

    const closeConfirmModal = () => {
        if (submitting) {
            return;
        }

        setShowConfirmModal(false);
    };

    const closeDeleteModal = () => {
        if (deleting) {
            return;
        }

        setShowDeleteModal(false);
        setSelectedLeave(null);
    };

    // ==================================================
    // HELPERS
    // ==================================================

    const formatDate = (date) => {
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

    const formatInputDate = (date) => {
        if (!date) {
            return "";
        }

        const value = new Date(date);

        const year = value.getFullYear();
        const month = String(
            value.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            value.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const calculateDays = (
        startDate,
        endDate
    ) => {
        if (!startDate || !endDate) {
            return 0;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const difference =
            Math.floor(
                (end.getTime() -
                    start.getTime()) /
                    (1000 * 60 * 60 * 24)
            ) + 1;

        return difference > 0
            ? difference
            : 0;
    };

    const getStatusClass = (status) => {
        if (status === "Approved") {
            return "bg-green-50 text-green-700 border-green-100";
        }

        if (status === "Rejected") {
            return "bg-red-50 text-red-700 border-red-100";
        }

        if (status === "Pending") {
            return "bg-orange-50 text-orange-700 border-orange-100";
        }

        return "bg-gray-50 text-gray-600 border-gray-100";
    };

    const getLeaveTypeClass = (type) => {
        if (type === "Sick Leave") {
            return "bg-red-50 text-red-600";
        }

        if (type === "Annual Leave") {
            return "bg-blue-50 text-blue-600";
        }

        if (type === "Emergency Leave") {
            return "bg-purple-50 text-purple-600";
        }

        if (type === "Casual Leave") {
            return "bg-indigo-50 text-indigo-600";
        }

        return "bg-gray-50 text-gray-600";
    };

    // ==================================================
    // SUMMARY
    // ==================================================

    const totalLeaves = leaves.length;

    const pendingLeaves = leaves.filter(
        (leave) =>
            leave.status === "Pending"
    ).length;

    const approvedLeaves = leaves.filter(
        (leave) =>
            leave.status === "Approved"
    ).length;

    const rejectedLeaves = leaves.filter(
        (leave) =>
            leave.status === "Rejected"
    ).length;

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="min-h-full bg-gray-50 p-4 sm:p-6">

                <div className="animate-pulse space-y-6">

                    <div className="h-10 w-48 bg-gray-200 rounded-lg" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                        <div className="h-28 bg-white rounded-2xl" />
                        <div className="h-28 bg-white rounded-2xl" />
                        <div className="h-28 bg-white rounded-2xl" />
                        <div className="h-28 bg-white rounded-2xl" />

                    </div>

                    <div className="h-96 bg-white rounded-2xl" />

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 p-4 sm:p-6">

            {/* ==================================================
                TOAST
            ================================================== */}

            {toast.show && (
                <div className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px]">

                    <div
                        className={`bg-white border rounded-xl shadow-xl px-4 py-4 flex items-start gap-3 ${
                            toast.type === "success"
                                ? "border-green-200"
                                : "border-red-200"
                        }`}
                    >

                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                toast.type === "success"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                            }`}
                        >
                            <i
                                className={`fas ${
                                    toast.type === "success"
                                        ? "fa-check"
                                        : "fa-exclamation"
                                }`}
                            />
                        </div>

                        <div className="flex-1">

                            <p className="text-sm font-semibold text-gray-900">
                                {toast.type === "success"
                                    ? "Success"
                                    : "Something went wrong"}
                            </p>

                            <p className="text-sm text-gray-500 mt-0.5">
                                {toast.message}
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setToast({
                                    show: false,
                                    type: "",
                                    message: ""
                                })
                            }
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-times" />
                        </button>

                    </div>

                </div>
            )}

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        My Leave
                    </h1>

                    <p className="text-sm sm:text-base text-gray-500 mt-1">
                        View your leave history and apply for new leave.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setShowApplyModal(true);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition flex items-center justify-center gap-2"
                >
                    <i className="fas fa-plus" />
                    Apply Leave
                </button>

            </div>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

                <SummaryCard
                    title="Total Requests"
                    value={totalLeaves}
                    description="All leave applications"
                    icon="fa-calendar"
                    iconClass="bg-violet-50 text-violet-600"
                />

                <SummaryCard
                    title="Pending"
                    value={pendingLeaves}
                    description="Waiting for approval"
                    icon="fa-clock"
                    iconClass="bg-orange-50 text-orange-600"
                />

                <SummaryCard
                    title="Approved"
                    value={approvedLeaves}
                    description="Approved requests"
                    icon="fa-check-circle"
                    iconClass="bg-green-50 text-green-600"
                />

                <SummaryCard
                    title="Rejected"
                    value={rejectedLeaves}
                    description="Rejected requests"
                    icon="fa-times-circle"
                    iconClass="bg-red-50 text-red-600"
                />

            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">

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
                        onClick={fetchMyLeaves}
                        className="text-sm font-medium text-red-700 hover:text-red-800"
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* ==================================================
                LEAVE HISTORY
            ================================================== */}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-100">

                    <h2 className="text-lg font-semibold text-gray-900">
                        Leave History
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Your submitted leave applications.
                    </p>

                </div>

                {leaves.length === 0 ? (
                    <div className="px-6 py-16 text-center">

                        <div className="w-16 h-16 mx-auto rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                            <i className="fas fa-calendar-alt text-2xl" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                            No leave applications
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            You haven't submitted any leave requests yet.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setShowApplyModal(true);
                            }}
                            className="mt-5 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
                        >
                            Apply for Leave
                        </button>

                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1050px]">

                            <thead className="bg-gray-50 border-b border-gray-100">

                                <tr>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Leave Type
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Start Date
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        End Date
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Days
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Reason
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {leaves.map((leave) => (
                                    <tr
                                        key={leave._id}
                                        className="hover:bg-gray-50 transition"
                                    >

                                        <td className="px-5 py-4">

                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getLeaveTypeClass(
                                                    leave.leaveType
                                                )}`}
                                            >
                                                {leave.leaveType || "-"}
                                            </span>

                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {formatDate(
                                                leave.startDate
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {formatDate(
                                                leave.endDate
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-sm font-medium text-gray-800">
                                            {calculateDays(
                                                leave.startDate,
                                                leave.endDate
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-600 max-w-xs">

                                            <div
                                                className="truncate"
                                                title={
                                                    leave.reason ||
                                                    ""
                                                }
                                            >
                                                {leave.reason ||
                                                    "-"}
                                            </div>

                                        </td>

                                        <td className="px-5 py-4">

                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClass(
                                                    leave.status
                                                )}`}
                                            >
                                                {leave.status ||
                                                    "-"}
                                            </span>

                                        </td>

                                        <td className="px-5 py-4">

                                            {leave.status ===
                                            "Pending" ? (
                                                <div className="flex items-center justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEditClick(
                                                                leave
                                                            )
                                                        }
                                                        title="Edit Leave"
                                                        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-200 transition"
                                                    >
                                                        <i className="fas fa-pen text-xs" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                leave
                                                            )
                                                        }
                                                        title="Delete Leave"
                                                        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                                                    >
                                                        <i className="fas fa-trash text-xs" />
                                                    </button>

                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    No actions
                                                </span>
                                            )}

                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* ==================================================
                APPLY LEAVE MODAL
            ================================================== */}

            {showApplyModal && (
                <LeaveFormModal
                    title="Apply for Leave"
                    subtitle="Submit a new leave request."
                    formData={formData}
                    handleChange={handleChange}
                    onSubmit={handleApplyClick}
                    onClose={closeApplyModal}
                    submitting={submitting}
                    submitText="Continue"
                />
            )}

            {/* ==================================================
                EDIT LEAVE MODAL
            ================================================== */}

            {showEditModal && (
                <LeaveFormModal
                    title="Edit Leave Request"
                    subtitle="Update your pending leave request."
                    formData={formData}
                    handleChange={handleChange}
                    onSubmit={handleUpdateClick}
                    onClose={closeEditModal}
                    submitting={submitting}
                    submitText="Continue"
                />
            )}

            {/* ==================================================
                CONFIRMATION MODAL
            ================================================== */}

            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">

                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

                        <div className="p-6">

                            <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-4">

                                <i
                                    className={`fas ${
                                        modalMode === "edit"
                                            ? "fa-pen"
                                            : "fa-calendar-check"
                                    } text-lg`}
                                />

                            </div>

                            <h2 className="text-xl font-semibold text-gray-900">

                                {modalMode === "edit"
                                    ? "Save Changes?"
                                    : "Submit Leave Request?"}

                            </h2>

                            <p className="text-sm text-gray-500 mt-2 leading-6">

                                {modalMode === "edit"
                                    ? "Please review the updated leave details before saving."
                                    : "Please review your leave details before submitting the request."}

                            </p>

                            <div className="mt-5 bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">

                                <DetailRow
                                    label="Leave Type"
                                    value={
                                        formData.leaveType
                                    }
                                />

                                <DetailRow
                                    label="Start Date"
                                    value={formatDate(
                                        formData.startDate
                                    )}
                                />

                                <DetailRow
                                    label="End Date"
                                    value={formatDate(
                                        formData.endDate
                                    )}
                                />

                                <DetailRow
                                    label="Duration"
                                    value={`${calculateDays(
                                        formData.startDate,
                                        formData.endDate
                                    )} ${
                                        calculateDays(
                                            formData.startDate,
                                            formData.endDate
                                        ) === 1
                                            ? "day"
                                            : "days"
                                    }`}
                                />

                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={
                                        closeConfirmModal
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                                >
                                    Go Back
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        modalMode ===
                                        "edit"
                                            ? handleUpdateLeave
                                            : handleApplyLeave
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
                                >

                                    {submitting && (
                                        <i className="fas fa-spinner fa-spin" />
                                    )}

                                    {submitting
                                        ? modalMode ===
                                          "edit"
                                            ? "Saving..."
                                            : "Submitting..."
                                        : modalMode ===
                                          "edit"
                                        ? "Save Changes"
                                        : "Confirm & Submit"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* ==================================================
                DELETE CONFIRMATION MODAL
            ================================================== */}

            {showDeleteModal && (
                <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">

                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

                        <div className="p-6">

                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">

                                <i className="fas fa-trash text-lg" />

                            </div>

                            <h2 className="text-xl font-semibold text-gray-900">
                                Delete Leave Request?
                            </h2>

                            <p className="text-sm text-gray-500 mt-2 leading-6">
                                This will remove the pending leave request from your leave history. This action cannot be undone.
                            </p>

                            {selectedLeave && (
                                <div className="mt-5 bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">

                                    <DetailRow
                                        label="Leave Type"
                                        value={
                                            selectedLeave.leaveType
                                        }
                                    />

                                    <DetailRow
                                        label="Date"
                                        value={`${formatDate(
                                            selectedLeave.startDate
                                        )} - ${formatDate(
                                            selectedLeave.endDate
                                        )}`}
                                    />

                                </div>
                            )}

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={deleting}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleDeleteLeave
                                    }
                                    disabled={deleting}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
                                >

                                    {deleting && (
                                        <i className="fas fa-spinner fa-spin" />
                                    )}

                                    {deleting
                                        ? "Deleting..."
                                        : "Delete Leave"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

// ======================================================
// LEAVE FORM MODAL
// ======================================================

function LeaveFormModal({
    title,
    subtitle,
    formData,
    handleChange,
    onSubmit,
    onClose,
    submitting,
    submitText
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
            onMouseDown={(e) => {
                if (
                    e.target ===
                    e.currentTarget
                ) {
                    onClose();
                }
            }}
        >

            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            {subtitle}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                        <i className="fas fa-times" />
                    </button>

                </div>

                <form
                    onSubmit={onSubmit}
                    className="p-6 space-y-5"
                >

                    <div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Leave Type
                        </label>

                        <select
                            name="leaveType"
                            value={
                                formData.leaveType
                            }
                            onChange={
                                handleChange
                            }
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                        >

                            <option value="Casual Leave">
                                Casual Leave
                            </option>

                            <option value="Sick Leave">
                                Sick Leave
                            </option>

                            <option value="Annual Leave">
                                Annual Leave
                            </option>

                            <option value="Emergency Leave">
                                Emergency Leave
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>

                            <input
                                type="date"
                                name="startDate"
                                value={
                                    formData.startDate
                                }
                                onChange={
                                    handleChange
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                                required
                            />

                        </div>

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>

                            <input
                                type="date"
                                name="endDate"
                                value={
                                    formData.endDate
                                }
                                onChange={
                                    handleChange
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                                required
                            />

                        </div>

                    </div>

                    <div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason
                        </label>

                        <textarea
                            name="reason"
                            value={
                                formData.reason
                            }
                            onChange={
                                handleChange
                            }
                            rows="4"
                            placeholder="Enter the reason for your leave..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                            required
                        />

                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
                        >
                            {submitText}
                            <i className="fas fa-arrow-right text-xs" />
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

// ======================================================
// DETAIL ROW
// ======================================================

function DetailRow({
    label,
    value
}) {
    return (
        <div className="flex justify-between gap-4">

            <span className="text-sm text-gray-500">
                {label}
            </span>

            <span className="text-sm font-medium text-gray-900 text-right">
                {value}
            </span>

        </div>
    );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
    title,
    value,
    description,
    icon,
    iconClass
}) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

            <div className="flex items-start justify-between gap-4">

                <div>

                    <p className="text-sm text-gray-500">
                        {title}
                    </p>

                    <p className="text-2xl font-bold text-gray-900 mt-2">
                        {value}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                        {description}
                    </p>

                </div>

                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
                >
                    <i
                        className={`fas ${icon}`}
                    />
                </div>

            </div>

        </div>
    );
}


export default MyLeave;