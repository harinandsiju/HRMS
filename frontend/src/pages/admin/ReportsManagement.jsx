import { useEffect, useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import api from "../../api/axios";

const REPORT_TYPES = [
    "Employee Report",
    "Attendance Report",
    "Leave Report",
    "Payroll Report",
    "Department Analysis Report"
];

const PAGE_LIMIT = 5;

const PIE_COLORS = [
    "#6366f1",
    "#22c55e",
    "#f97316",
    "#3b82f6",
    "#14b8a6",
    "#94a3b8"
];

function ReportsManagement() {

    // =========================
    // DATA
    // =========================

    const [summary, setSummary] = useState(null);
    const [attendanceOverview, setAttendanceOverview] = useState([]);
    const [departmentDistribution, setDepartmentDistribution] = useState([]);
    const [reports, setReports] = useState([]);
    const [departments, setDepartments] = useState([]);

    // =========================
    // FILTERS
    // =========================

    const [startDate, setStartDate] = useState(
        getMonthStart()
    );

    const [endDate, setEndDate] = useState(
        getMonthEnd()
    );

    const [departmentFilter, setDepartmentFilter] = useState("");
    const [reportTypeFilter, setReportTypeFilter] = useState("");

    // =========================
    // PAGINATION
    // =========================

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);

    // =========================
    // UI STATE
    // =========================

    const [loading, setLoading] = useState(true);
    const [reportsLoading, setReportsLoading] = useState(true);

    const [selectedReport, setSelectedReport] = useState(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);

    const [generating, setGenerating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);

    const [toast, setToast] = useState(null);

    // =========================
    // GENERATE FORM
    // =========================

    const [generateForm, setGenerateForm] = useState({
        reportType: "",
        startDate: getMonthStart(),
        endDate: getMonthEnd(),
        departmentId: ""
    });

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        fetchDashboardData();
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchReports();
    }, [page, reportTypeFilter]);

    // =========================
    // BODY SCROLL LOCK
    // =========================

    useEffect(() => {
        const shouldLock =
            selectedReport ||
            showGenerateModal ||
            showDeleteModal;

        if (shouldLock) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [
        selectedReport,
        showGenerateModal,
        showDeleteModal
    ]);

    // =========================
    // AUTO HIDE TOAST
    // =========================

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [toast]);

    // =========================
    // DASHBOARD DATA
    // =========================

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [
                summaryResponse,
                attendanceResponse,
                departmentResponse
            ] = await Promise.all([
                api.get("/reports/dashboard-summary"),
                api.get(
                    `/reports/attendance-overview?startDate=${startDate}&endDate=${endDate}`
                ),
                api.get("/reports/department-distribution")
            ]);

            setSummary(summaryResponse.data);

            setAttendanceOverview(
                attendanceResponse.data.overview || []
            );

            setDepartmentDistribution(
                departmentResponse.data.distribution || []
            );

        } catch (error) {
            console.error(
                "Reports dashboard error:",
                error
            );

            showToast(
                "error",
                error.response?.data?.message ||
                "Failed to load report analytics."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // DEPARTMENTS
    // =========================

    const fetchDepartments = async () => {
        try {
            const response = await api.get(
                "/departments"
            );

            setDepartments(
                response.data.departments || []
            );

        } catch (error) {
            console.error(
                "Fetch departments error:",
                error
            );
        }
    };

    // =========================
    // REPORTS
    // =========================

    const fetchReports = async () => {
        try {
            setReportsLoading(true);

            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_LIMIT)
            });

            if (reportTypeFilter) {
                params.append(
                    "reportType",
                    reportTypeFilter
                );
            }

            const response = await api.get(
                `/reports?${params.toString()}`
            );

            setReports(
                response.data.reports || []
            );

            setTotalPages(
                response.data.totalPages || 1
            );

            setTotalReports(
                response.data.totalReports || 0
            );

        } catch (error) {
            console.error(
                "Fetch reports error:",
                error
            );

            showToast(
                "error",
                error.response?.data?.message ||
                "Failed to load generated reports."
            );
        } finally {
            setReportsLoading(false);
        }
    };

    // =========================
    // DATE RANGE CHANGE
    // =========================

const handleDateChange = (
    field,
    value
) => {

    const newStartDate =
        field === "startDate"
            ? value
            : startDate;

    const newEndDate =
        field === "endDate"
            ? value
            : endDate;

    if (field === "startDate") {
        setStartDate(value);
    }

    if (field === "endDate") {
        setEndDate(value);
    }

    // Wait until both dates are selected
    if (!newStartDate || !newEndDate) {
        return;
    }

    // Don't request invalid date ranges
    if (
        new Date(newStartDate) >
        new Date(newEndDate)
    ) {
        return;
    }

    fetchAttendanceForRange(
        newStartDate,
        newEndDate
    );
};

    const applyDateRange = async () => {

        if (!startDate || !endDate) {
            showToast(
                "error",
                "Please select both start and end dates."
            );
            return;
        }

        if (
            new Date(startDate) >
            new Date(endDate)
        ) {
            showToast(
                "error",
                "Start date cannot be after end date."
            );
            return;
        }

        try {
            setLoading(true);

            const attendanceResponse =
                await api.get(
                    `/reports/attendance-overview?startDate=${startDate}&endDate=${endDate}`
                );

            setAttendanceOverview(
                attendanceResponse.data.overview || []
            );

        } catch (error) {
            console.error(
                "Date range error:",
                error
            );

            showToast(
                "error",
                error.response?.data?.message ||
                "Failed to update attendance overview."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // RESET FILTERS
    // =========================

    const resetFilters = () => {

        const newStartDate = getMonthStart();
        const newEndDate = getMonthEnd();

        setStartDate(newStartDate);
        setEndDate(newEndDate);
        setDepartmentFilter("");
        setReportTypeFilter("");
        setPage(1);

        fetchAttendanceForRange(
            newStartDate,
            newEndDate
        );

        setTimeout(() => {
            fetchReports();
        }, 0);
    };

    const fetchAttendanceForRange = async (
        start,
        end
    ) => {
        try {

            const response =
                await api.get(
                    `/reports/attendance-overview?startDate=${start}&endDate=${end}`
                );

            setAttendanceOverview(
                response.data.overview || []
            );

        } catch (error) {
            console.error(
                "Reset attendance error:",
                error
            );
        }
    };

    // =========================
    // REPORT DETAILS
    // =========================

    const handleViewReport = async (
        report
    ) => {

        try {

            const response =
                await api.get(
                    `/reports/${report._id}`
                );

            setSelectedReport(
                response.data.report
            );

        } catch (error) {

            console.error(
                "Get report details error:",
                error
            );

            showToast(
                "error",
                error.response?.data?.message ||
                "Failed to load report details."
            );
        }
    };

    // =========================
    // GENERATE REPORT
    // =========================

    const openGenerateModal = () => {

        setGenerateForm({
            reportType: "",
            startDate: getMonthStart(),
            endDate: getMonthEnd(),
            departmentId: ""
        });

        setShowGenerateModal(true);
    };

    const handleGenerateFormChange = (
        field,
        value
    ) => {

        setGenerateForm((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const handleGenerateReport = async (
        event
    ) => {

        event.preventDefault();

        if (!generateForm.reportType) {
            showToast(
                "error",
                "Please select a report type."
            );
            return;
        }

        if (
            !generateForm.startDate ||
            !generateForm.endDate
        ) {
            showToast(
                "error",
                "Please select a date range."
            );
            return;
        }

        if (
            new Date(generateForm.startDate) >
            new Date(generateForm.endDate)
        ) {
            showToast(
                "error",
                "Start date cannot be after end date."
            );
            return;
        }

        try {

            setGenerating(true);

            const response =
                await api.post(
                    "/reports/generate",
                    {
                        reportType:
                            generateForm.reportType,

                        startDate:
                            generateForm.startDate,

                        endDate:
                            generateForm.endDate,

                        departmentId:
                            generateForm.departmentId ||
                            undefined
                    }
                );

            setShowGenerateModal(false);

            showToast(
                "success",
                response.data.message ||
                "Report generated successfully."
            );

            setPage(1);

            await fetchReports();

        } catch (error) {

            console.error(
                "Generate report error:",
                error
            );

            showToast(
                "error",
                error.response?.data?.message ||
                "Failed to generate report."
            );
        } finally {
            setGenerating(false);
        }
    };

    // =========================
    // DOWNLOAD REPORT
    // =========================

    const handleDownloadReport = async (
        report
    ) => {

        try {

            setDownloadingId(
                report._id
            );

            const response =
                await api.get(
                    `/reports/${report._id}/download`,
                    {
                        responseType: "blob"
                    }
                );

            const blobUrl =
                window.URL.createObjectURL(
                    new Blob(
                        [response.data],
                        {
                            type: "application/pdf"
                        }
                    )
                );

            const link =
                document.createElement("a");

            link.href = blobUrl;

            link.download =
                `${report.reportName}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(
                blobUrl
            );

            showToast(
                "success",
                "Report PDF downloaded successfully."
            );

        } catch (error) {

            console.error(
                "Download report error:",
                error
            );

            showToast(
                "error",
                "Failed to download report PDF."
            );

        } finally {
            setDownloadingId(null);
        }
    };

    // =========================
    // DELETE REPORT
    // =========================

    const openDeleteModal = (
        report
    ) => {

        setReportToDelete(report);
        setShowDeleteModal(true);
    };

    const handleDeleteReport = async () => {

        if (!reportToDelete) return;

        try {

            setDeleting(true);

            const response =
                await api.delete(
                    `/reports/${reportToDelete._id}`
                );

            setShowDeleteModal(false);
            setReportToDelete(null);

            showToast(
                "success",
                response.data.message ||
                "Report deleted successfully."
            );

            if (
                reports.length === 1 &&
                page > 1
            ) {
                setPage(
                    (previous) =>
                        previous - 1
                );
            } else {
                await fetchReports();
            }

            if (
                selectedReport?._id ===
                reportToDelete._id
            ) {
                setSelectedReport(null);
            }

        } catch (error) {

            console.error(
                "Delete report error:",
                error
            );

            showToast(
                "error",
                error.response?.data?.message ||
                "Failed to delete report."
            );
        } finally {
            setDeleting(false);
        }
    };

    // =========================
    // TOAST
    // =========================

    const showToast = (
        type,
        message
    ) => {

        setToast({
            id: Date.now(),
            type,
            message
        });
    };

    // =========================
    // CHART DATA
    // =========================

    const attendanceChartData =
        useMemo(() => {

            return attendanceOverview.map(
                (item) => ({
                    date: formatShortDate(
                        item.date
                    ),
                    attendanceRate:
                        Number(
                            item.attendanceRate ||
                            0
                        )
                })
            );

        }, [attendanceOverview]);

    const filteredDepartmentDistribution =
        useMemo(() => {

            if (!departmentFilter) {
                return departmentDistribution;
            }

            return departmentDistribution.filter(
                (item) =>
                    String(
                        item.departmentId
                    ) ===
                    String(
                        departmentFilter
                    )
            );

        }, [
            departmentDistribution,
            departmentFilter
        ]);

    const totalDepartmentEmployees =
        filteredDepartmentDistribution.reduce(
            (total, item) =>
                total +
                Number(item.count || 0),
            0
        );

    // =========================
    // REPORT TYPE ICON
    // =========================

    const getReportIcon = (
        reportType
    ) => {

        switch (reportType) {

            case "Employee Report":
                return "fas fa-users";

            case "Attendance Report":
                return "fas fa-calendar-check";

            case "Leave Report":
                return "fas fa-calendar-minus";

            case "Payroll Report":
                return "fas fa-wallet";

            case "Department Analysis Report":
                return "fas fa-chart-pie";

            default:
                return "fas fa-file-alt";
        }
    };

    const getReportIconClass = (
        reportType
    ) => {

        switch (reportType) {

            case "Employee Report":
                return "bg-indigo-50 text-indigo-600";

            case "Attendance Report":
                return "bg-green-50 text-green-600";

            case "Leave Report":
                return "bg-orange-50 text-orange-600";

            case "Payroll Report":
                return "bg-blue-50 text-blue-600";

            case "Department Analysis Report":
                return "bg-purple-50 text-purple-600";

            default:
                return "bg-gray-50 text-gray-600";
        }
    };

    // =========================
    // REPORT TYPE BADGE
    // =========================

    const getReportBadgeClass = (
        reportType
    ) => {

        switch (reportType) {

            case "Employee Report":
            case "Department Analysis Report":
                return "bg-indigo-50 text-indigo-600 border-indigo-100";

            case "Attendance Report":
                return "bg-green-50 text-green-600 border-green-100";

            case "Leave Report":
                return "bg-orange-50 text-orange-600 border-orange-100";

            case "Payroll Report":
                return "bg-blue-50 text-blue-600 border-blue-100";

            default:
                return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    // =========================
    // FORMATTING
    // =========================

    const formatDate = (
        date
    ) => {

        if (!date) return "-";

        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatDateTime = (
        date
    ) => {

        if (!date) return "-";

        return new Date(
            date
        ).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    const formatCurrency = (
        amount
    ) => {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        ).format(
            Number(amount || 0)
        );
    };

    const getDepartmentName = (
        departmentId
    ) => {

        if (!departmentId) {
            return "All Departments";
        }

        if (
            typeof departmentId ===
            "object"
        ) {
            return (
                departmentId.name ||
                "All Departments"
            );
        }

        const department =
            departments.find(
                (item) =>
                    String(item._id) ===
                    String(departmentId)
            );

        return (
            department?.name ||
            "All Departments"
        );
    };

    const getGeneratedBy = (
        generatedBy
    ) => {

        if (!generatedBy) {
            return "Unknown";
        }

        if (
            typeof generatedBy ===
            "object"
        ) {
            return (
                generatedBy.email ||
                "Unknown"
            );
        }

        return String(
            generatedBy
        );
    };

    // =========================
    // LOADING
    // =========================

    if (
        loading &&
        !summary
    ) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-2xl text-indigo-600" />
                    <p className="text-sm text-gray-500 mt-3">
                        Loading reports...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* =========================
                PAGE HEADER
            ========================== */}

            <div className="flex items-start justify-between gap-4">

                <div>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Reports & Analytics
                    </h1>

                    <div className="flex items-center gap-2 mt-1 text-sm">

                        <span className="text-indigo-600">
                            Home
                        </span>

                        <i className="fas fa-chevron-right text-[9px] text-gray-400" />

                        <span className="text-gray-500">
                            Reports & Analytics
                        </span>

                    </div>

                </div>

                <button
                    type="button"
                    onClick={openGenerateModal}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm"
                >
                    <i className="fas fa-plus" />
                    Generate Report
                </button>

            </div>

            {/* =========================
                SUMMARY CARDS
            ========================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <SummaryCard
                    title="Total Employees"
                    value={
                        summary?.totalEmployees ??
                        0
                    }
                    description="All Departments"
                    icon="fas fa-users"
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <SummaryCard
                    title="Attendance Rate"
                    value={`${summary?.attendanceRate ?? 0}%`}
                    description="This Month"
                    icon="fas fa-calendar-check"
                    iconClass="bg-green-50 text-green-600"
                />

                <SummaryCard
                    title="Leave Requests"
                    value={
                        summary?.pendingLeaveRequests ??
                        0
                    }
                    description="Pending Requests"
                    icon="fas fa-calendar-minus"
                    iconClass="bg-orange-50 text-orange-600"
                />

                <SummaryCard
                    title="Payroll Processed"
                    value={formatCurrency(
                        summary?.payrollProcessedThisMonth
                    )}
                    description="This Month"
                    icon="fas fa-wallet"
                    iconClass="bg-blue-50 text-blue-600"
                />

            </div>

            {/* =========================
                FILTERS
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl p-4">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

                    {/* Date range */}

                    <div className="xl:col-span-1">

                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Date Range
                        </label>

                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">

                            <div className="flex items-center gap-2 px-3 flex-1">

                                <i className="fas fa-calendar text-gray-400 text-sm" />

                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        handleDateChange(
                                            "startDate",
                                            e.target.value
                                        )
                                    }
                                    className="w-full py-2 text-sm text-gray-700 outline-none"
                                />

                            </div>

                            <span className="text-gray-400 text-sm">
                                -
                            </span>

                            <div className="flex items-center px-3 flex-1">

                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) =>
                                        handleDateChange(
                                            "endDate",
                                            e.target.value
                                        )
                                    }
                                    className="w-full py-2 text-sm text-gray-700 outline-none"
                                />

                            </div>

                            <button
                                type="button"
                                onClick={applyDateRange}
                                title="Apply date range"
                                className="px-3 text-indigo-600 hover:text-indigo-700"
                            >
                                <i className="fas fa-chevron-down text-xs" />
                            </button>

                        </div>

                    </div>

                    {/* Department */}

                    <div>

                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Department
                        </label>

                        <select
                            value={departmentFilter}
                            onChange={(e) =>
                                setDepartmentFilter(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">
                                All Departments
                            </option>

                            {departments.map(
                                (department) => (
                                    <option
                                        key={
                                            department._id
                                        }
                                        value={
                                            department._id
                                        }
                                    >
                                        {
                                            department.name
                                        }
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                    {/* Report Type */}

                    <div>

                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Report Type
                        </label>

                        <select
                            value={reportTypeFilter}
                            onChange={(e) => {
                                setReportTypeFilter(
                                    e.target.value
                                );
                                setPage(1);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">
                                All Types
                            </option>

                            {REPORT_TYPES.map(
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

                    {/* Reset */}

                    <div className="flex items-end">

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="w-full xl:w-auto border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium transition inline-flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-undo-alt" />
                            Reset
                        </button>

                    </div>

                </div>

            </div>

            {/* =========================
                CHARTS
            ========================== */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* Attendance */}

                <div className="bg-white border border-gray-200 rounded-xl p-5">

                    <div className="flex items-center justify-between mb-5">

                        <h2 className="text-base font-semibold text-gray-900">
                            Attendance Overview
                        </h2>

                        <span className="text-xs text-gray-500">
                            {formatDate(startDate)}
                            {" - "}
                            {formatDate(endDate)}
                        </span>

                    </div>

                    <div className="h-[260px]">

                        {attendanceChartData.length > 0 ? (

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        attendanceChartData
                                    }
                                    margin={{
                                        top: 5,
                                        right: 10,
                                        left: 0,
                                        bottom: 5
                                    }}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="date"
                                        tick={{
                                            fontSize: 10
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        domain={[
                                            0,
                                            100
                                        ]}
                                        tick={{
                                            fontSize: 10
                                        }}
                                        tickFormatter={(value) =>
                                            `${value}%`
                                        }
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <Tooltip
                                        formatter={(value) =>
                                            [
                                                `${value}%`,
                                                "Attendance Rate"
                                            ]
                                        }
                                    />

                                    <Bar
                                        dataKey="attendanceRate"
                                        fill="#6366f1"
                                        radius={[
                                            5,
                                            5,
                                            0,
                                            0
                                        ]}
                                        maxBarSize={28}
                                    />

                                </BarChart>
                            </ResponsiveContainer>

                        ) : (

                            <EmptyChart
                                icon="fas fa-chart-column"
                                message="No attendance data available for this period."
                            />

                        )}

                    </div>

                </div>

                {/* Department Distribution */}

                <div className="bg-white border border-gray-200 rounded-xl p-5">

                    <div className="flex items-center justify-between mb-5">

                        <h2 className="text-base font-semibold text-gray-900">
                            Department-wise Employees
                        </h2>

                        <span className="text-xs text-gray-500">
                            {totalDepartmentEmployees} Total
                        </span>

                    </div>

                    <div className="h-[260px] flex items-center">

                        {filteredDepartmentDistribution.length > 0 ? (

                            <div className="w-full h-full flex items-center">

                                <div className="w-1/2 h-full">

                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >

                                        <PieChart>

                                            <Pie
                                                data={
                                                    filteredDepartmentDistribution
                                                }
                                                dataKey="count"
                                                nameKey="departmentName"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={88}
                                                paddingAngle={2}
                                            >

                                                {filteredDepartmentDistribution.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <Cell
                                                            key={
                                                                item.departmentId ||
                                                                index
                                                            }
                                                            fill={
                                                                PIE_COLORS[
                                                                    index %
                                                                    PIE_COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}

                                            </Pie>

                                            <Tooltip
                                                formatter={(
                                                    value,
                                                    name
                                                ) => [
                                                    value,
                                                    name
                                                ]}
                                            />

                                        </PieChart>

                                    </ResponsiveContainer>

                                </div>

                                <div className="w-1/2 space-y-3">

                                    {filteredDepartmentDistribution.map(
                                        (
                                            item,
                                            index
                                        ) => (

                                            <div
                                                key={
                                                    item.departmentId ||
                                                    index
                                                }
                                                className="flex items-center justify-between gap-2"
                                            >

                                                <div className="flex items-center gap-2 min-w-0">

                                                    <span
                                                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                PIE_COLORS[
                                                                    index %
                                                                    PIE_COLORS.length
                                                                ]
                                                        }}
                                                    />

                                                    <span className="text-xs text-gray-600 truncate">
                                                        {
                                                            item.departmentName
                                                        }
                                                    </span>

                                                </div>

                                                <span className="text-xs font-medium text-gray-800 whitespace-nowrap">
                                                    {
                                                        item.count
                                                    }
                                                    {" "}
                                                    (
                                                    {
                                                        item.percentage
                                                    }
                                                    %)
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        ) : (

                            <EmptyChart
                                icon="fas fa-chart-pie"
                                message="No department data available."
                            />

                        )}

                    </div>

                </div>

            </div>

            {/* =========================
                GENERATED REPORTS
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-200">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-base font-semibold text-gray-900">
                                Generated Reports
                            </h2>

                            <p className="text-xs text-gray-500 mt-1">
                                {totalReports} report
                                {totalReports !== 1
                                    ? "s"
                                    : ""}{" "}
                                available
                            </p>

                        </div>

                    </div>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm min-w-[760px]">

                        <thead className="bg-gray-50 border-b border-gray-200">

                            <tr>

                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                                    Report Name
                                </th>

                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                                    Generated By
                                </th>

                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                                    Generated On
                                </th>

                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                                    Type
                                </th>

                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {reportsLoading ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="py-12 text-center"
                                    >
                                        <i className="fas fa-spinner fa-spin text-indigo-600" />
                                        <p className="text-sm text-gray-500 mt-2">
                                            Loading reports...
                                        </p>
                                    </td>

                                </tr>

                            ) : reports.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="py-12 text-center"
                                    >

                                        <div className="flex flex-col items-center">

                                            <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
                                                <i className="fas fa-file-alt text-xl" />
                                            </div>

                                            <p className="text-sm font-medium text-gray-700 mt-3">
                                                No reports found
                                            </p>

                                            <p className="text-xs text-gray-400 mt-1">
                                                Generate a report to see it here.
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            ) : (

                                reports.map(
                                    (report) => (

                                        <tr
                                            key={
                                                report._id
                                            }
                                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                                        >

                                            {/* Report Name */}

                                            <td className="px-5 py-3.5">

                                                <div className="flex items-center gap-3 min-w-0">

                                                    <div
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getReportIconClass(
                                                            report.reportType
                                                        )}`}
                                                    >
                                                        <i
                                                            className={getReportIcon(
                                                                report.reportType
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="min-w-0">

                                                        <p className="font-medium text-gray-900 truncate max-w-[250px]">
                                                            {
                                                                report.reportName
                                                            }
                                                        </p>

                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {formatDate(
                                                                report.startDate
                                                            )}
                                                            {" - "}
                                                            {formatDate(
                                                                report.endDate
                                                            )}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* Generated By */}

                                            <td className="px-5 py-3.5">

                                                <div className="flex items-center gap-2">

                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                                                        <i className="fas fa-user" />
                                                    </div>

                                                    <span className="text-gray-700 text-sm">
                                                        {
                                                            getGeneratedBy(
                                                                report.generatedBy
                                                            )
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            {/* Generated On */}

                                            <td className="px-5 py-3.5 text-gray-600">

                                                {
                                                    formatDateTime(
                                                        report.createdAt
                                                    )
                                                }

                                            </td>

                                            {/* Type */}

                                            <td className="px-5 py-3.5">

                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${getReportBadgeClass(
                                                        report.reportType
                                                    )}`}
                                                >
                                                    {
                                                        report.reportType
                                                    }
                                                </span>

                                            </td>

                                            {/* Actions */}

                                            <td className="px-5 py-3.5">

                                                <div className="flex items-center justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewReport(
                                                                report
                                                            )
                                                        }
                                                        title="View report"
                                                        className="w-10 h-9 rounded-lg border border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center"
                                                    >
                                                        <i className="fas fa-eye" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDownloadReport(
                                                                report
                                                            )
                                                        }
                                                        disabled={
                                                            downloadingId ===
                                                            report._id
                                                        }
                                                        title="Download PDF"
                                                        className="w-10 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <i
                                                            className={
                                                                downloadingId ===
                                                                report._id
                                                                    ? "fas fa-spinner fa-spin"
                                                                    : "fas fa-download"
                                                            }
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                report
                                                            )
                                                        }
                                                        title="Delete report"
                                                        className="w-10 h-9 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition flex items-center justify-center"
                                                    >
                                                        <i className="fas fa-trash-alt" />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

                {/* Pagination */}

                <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100">

                    <p className="text-sm text-gray-500">

                        Showing{" "}
                        {totalReports === 0
                            ? 0
                            : (page - 1) *
                                  PAGE_LIMIT +
                              1}
                        {" "}
                        to{" "}
                        {Math.min(
                            page * PAGE_LIMIT,
                            totalReports
                        )}
                        {" "}
                        of{" "}
                        {totalReports}{" "}
                        entries

                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage(
                                    (previous) =>
                                        previous - 1
                                )
                            }
                            className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-left text-xs" />
                        </button>

                        {renderPagination(
                            page,
                            totalPages,
                            setPage
                        )}

                        <button
                            type="button"
                            disabled={
                                page >=
                                totalPages
                            }
                            onClick={() =>
                                setPage(
                                    (previous) =>
                                        previous + 1
                                )
                            }
                            className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-right text-xs" />
                        </button>

                    </div>

                </div>

            </div>

            {/* =========================
                REPORT DETAILS PANEL
            ========================== */}

            {selectedReport && (

                <div className="fixed inset-0 z-50">

                    {/* Backdrop */}

                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] animate-fadeIn"
                        onClick={() =>
                            setSelectedReport(null)
                        }
                    />

                    {/* Panel */}

                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-slideInRight overflow-y-auto">

                        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-5 border-b border-gray-200">

                            <h2 className="text-lg font-semibold text-gray-900">
                                Report Details
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedReport(null)
                                }
                                className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition flex items-center justify-center"
                            >
                                <i className="fas fa-times" />
                            </button>

                        </div>

                        <div className="p-6">

                            {/* Report Hero */}

                            <div className="flex items-start gap-4 pb-5 border-b border-gray-200">

                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getReportIconClass(
                                        selectedReport.reportType
                                    )}`}
                                >
                                    <i
                                        className={`${getReportIcon(
                                            selectedReport.reportType
                                        )} text-xl`}
                                    />
                                </div>

                                <div className="min-w-0">

                                    <h3 className="font-semibold text-gray-900 leading-6 break-words">
                                        {
                                            selectedReport.reportName
                                        }
                                    </h3>

                                    <span
                                        className={`inline-flex mt-2 px-2.5 py-1 rounded-md border text-xs font-medium ${getReportBadgeClass(
                                            selectedReport.reportType
                                        )}`}
                                    >
                                        {
                                            selectedReport.reportType
                                        }
                                    </span>

                                </div>

                            </div>

                            {/* Information */}

                            <div className="py-5 border-b border-gray-200 space-y-5">

                                <DetailRow
                                    label="Report Type"
                                    value={
                                        selectedReport.reportType
                                    }
                                />

                                <DetailRow
                                    label="Date Generated"
                                    value={formatDateTime(
                                        selectedReport.createdAt
                                    )}
                                />

                                <DetailRow
                                    label="Generated By"
                                    value={getGeneratedBy(
                                        selectedReport.generatedBy
                                    )}
                                />

                                <DetailRow
                                    label="Date Range"
                                    value={`${formatDate(
                                        selectedReport.startDate
                                    )} - ${formatDate(
                                        selectedReport.endDate
                                    )}`}
                                />

                                <DetailRow
                                    label="Department"
                                    value={getDepartmentName(
                                        selectedReport.departmentId
                                    )}
                                />

                            </div>

                            {/* Summary */}

                            <div className="py-5">

                                <h3 className="text-base font-semibold text-gray-900 mb-4">
                                    Summary
                                </h3>

                                <div className="bg-green-50 border border-green-100 rounded-xl p-4">

                                    <div className="flex items-start gap-3">

                                        <div className="w-8 h-8 rounded-full bg-white text-green-600 flex items-center justify-center flex-shrink-0">
                                            <i className="fas fa-check-circle" />
                                        </div>

                                        <div className="min-w-0">

                                            <p className="text-sm text-gray-700 leading-6">
                                                This report was generated from the selected HRMS data and contains the summary information for the selected period.
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* Summary Values */}

                            <div className="space-y-3 pb-5 border-b border-gray-200">

                                {Object.entries(
                                    selectedReport.summary ||
                                    {}
                                ).map(
                                    (
                                        [
                                            key,
                                            value
                                        ]
                                    ) => (

                                        <div
                                            key={key}
                                            className="flex items-center justify-between gap-4"
                                        >

                                            <div className="flex items-center gap-2 min-w-0">

                                                <i className="fas fa-chart-simple text-gray-400 text-xs" />

                                                <span className="text-sm text-gray-600">
                                                    {formatLabel(
                                                        key
                                                    )}
                                                </span>

                                            </div>

                                            <span className="text-sm font-semibold text-gray-900 text-right">
                                                {formatSummaryValue(
                                                    value,
                                                    key
                                                )}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                            {/* Footer */}

                            <div className="pt-5 space-y-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownloadReport(
                                            selectedReport
                                        )
                                    }
                                    disabled={
                                        downloadingId ===
                                        selectedReport._id
                                    }
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <i
                                        className={
                                            downloadingId ===
                                            selectedReport._id
                                                ? "fas fa-spinner fa-spin"
                                                : "fas fa-download"
                                        }
                                    />

                                    {downloadingId ===
                                    selectedReport._id
                                        ? "Downloading..."
                                        : "Download PDF"}

                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedReport(
                                            null
                                        );
                                        openDeleteModal(
                                            selectedReport
                                        );
                                    }}
                                    className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-lg py-3 text-sm font-medium transition flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-trash-alt" />
                                    Delete Report
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

            {/* =========================
                GENERATE REPORT MODAL
            ========================== */}

            {showGenerateModal && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fadeIn"
                        onClick={() =>
                            !generating &&
                            setShowGenerateModal(false)
                        }
                    />

                    <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl animate-modalIn">

                        {/* Header */}

                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-900">
                                    Generate Report
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    Select the report details below.
                                </p>

                            </div>

                            <button
                                type="button"
                                disabled={generating}
                                onClick={() =>
                                    setShowGenerateModal(
                                        false
                                    )
                                }
                                className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition flex items-center justify-center disabled:opacity-40"
                            >
                                <i className="fas fa-times" />
                            </button>

                        </div>

                        {/* Form */}

                        <form
                            onSubmit={
                                handleGenerateReport
                            }
                            className="p-6 space-y-5"
                        >

                            {/* Report Type */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Report Type
                                    <span className="text-red-500">
                                        {" "}
                                        *
                                    </span>
                                </label>

                                <select
                                    value={
                                        generateForm.reportType
                                    }
                                    onChange={(e) =>
                                        handleGenerateFormChange(
                                            "reportType",
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">
                                        Select Report Type
                                    </option>

                                    {REPORT_TYPES.map(
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

                            {/* Department */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Department
                                </label>

                                <select
                                    value={
                                        generateForm.departmentId
                                    }
                                    onChange={(e) =>
                                        handleGenerateFormChange(
                                            "departmentId",
                                            e.target.value
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                >

                                    <option value="">
                                        All Departments
                                    </option>

                                    {departments.map(
                                        (department) => (
                                            <option
                                                key={
                                                    department._id
                                                }
                                                value={
                                                    department._id
                                                }
                                            >
                                                {
                                                    department.name
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* Dates */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Start Date
                                        <span className="text-red-500">
                                            {" "}
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            generateForm.startDate
                                        }
                                        onChange={(e) =>
                                            handleGenerateFormChange(
                                                "startDate",
                                                e.target.value
                                            )
                                        }
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        End Date
                                        <span className="text-red-500">
                                            {" "}
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            generateForm.endDate
                                        }
                                        onChange={(e) =>
                                            handleGenerateFormChange(
                                                "endDate",
                                                e.target.value
                                            )
                                        }
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />

                                </div>

                            </div>

                            {/* Info */}

                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3.5 flex items-start gap-3">

                                <i className="fas fa-circle-info text-indigo-600 mt-0.5" />

                                <p className="text-xs text-indigo-700 leading-5">
                                    The selected report will be generated from the HRMS data for the chosen period and saved as a PDF.
                                </p>

                            </div>

                            {/* Buttons */}

                            <div className="flex items-center justify-end gap-3 pt-2">

                                <button
                                    type="button"
                                    disabled={
                                        generating
                                    }
                                    onClick={() =>
                                        setShowGenerateModal(
                                            false
                                        )
                                    }
                                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        generating
                                    }
                                    className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition flex items-center gap-2 disabled:opacity-60"
                                >

                                    <i
                                        className={
                                            generating
                                                ? "fas fa-spinner fa-spin"
                                                : "fas fa-file-circle-plus"
                                        }
                                    />

                                    {generating
                                        ? "Generating..."
                                        : "Generate Report"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =========================
                DELETE MODAL
            ========================== */}

            {showDeleteModal &&
                reportToDelete && (

                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">

                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fadeIn"
                            onClick={() =>
                                !deleting &&
                                setShowDeleteModal(
                                    false
                                )
                            }
                        />

                        <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl animate-modalIn">

                            <div className="p-6">

                                <div className="flex items-start gap-4">

                                    <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">

                                        <i className="fas fa-trash-alt" />

                                    </div>

                                    <div className="min-w-0">

                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Delete Report
                                        </h2>

                                        <p className="text-sm text-gray-500 mt-2 leading-6 break-words">

                                            Are you sure you want to delete{" "}

                                            <span className="font-medium text-gray-700 break-all">
                                                {
                                                    reportToDelete.reportName
                                                }
                                            </span>

                                            ?

                                        </p>

                                        <p className="text-xs text-gray-400 mt-2">
                                            The report will be removed from the active reports list.
                                        </p>

                                    </div>

                                </div>

                                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100">

                                    <button
                                        type="button"
                                        disabled={
                                            deleting
                                        }
                                        onClick={() =>
                                            setShowDeleteModal(
                                                false
                                            )
                                        }
                                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            deleting
                                        }
                                        onClick={
                                            handleDeleteReport
                                        }
                                        className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition flex items-center gap-2 disabled:opacity-60"
                                    >

                                        <i
                                            className={
                                                deleting
                                                    ? "fas fa-spinner fa-spin"
                                                    : "fas fa-trash-alt"
                                            }
                                        />

                                        {deleting
                                            ? "Deleting..."
                                            : "Delete Report"}

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            {/* =========================
                TOAST
            ========================== */}

            {toast && (

                <div className="fixed top-5 right-5 z-[100] animate-toastIn">

                    <div
                        className={`min-w-[300px] max-w-[420px] bg-white border rounded-xl shadow-xl px-4 py-3 flex items-start gap-3 ${
                            toast.type ===
                            "success"
                                ? "border-green-200"
                                : "border-red-200"
                        }`}
                    >

                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                toast.type ===
                                "success"
                                    ? "bg-green-50 text-green-600"
                                    : "bg-red-50 text-red-600"
                            }`}
                        >
                            <i
                                className={
                                    toast.type ===
                                    "success"
                                        ? "fas fa-check"
                                        : "fas fa-exclamation"
                                }
                            />
                        </div>

                        <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold text-gray-900">
                                {toast.type ===
                                "success"
                                    ? "Success"
                                    : "Error"}
                            </p>

                            <p className="text-sm text-gray-500 mt-0.5 break-words">
                                {
                                    toast.message
                                }
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setToast(null)
                            }
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-times text-xs" />
                        </button>

                    </div>

                </div>

            )}

            {/* =========================
                ANIMATION STYLES
            ========================== */}

            <style>{`

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }

                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.96) translateY(10px);
                    }

                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes toastIn {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }

                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }

                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }

                .animate-modalIn {
                    animation: modalIn 0.22s ease-out;
                }

                .animate-toastIn {
                    animation: toastIn 0.25s ease-out;
                }

            `}</style>

        </div>
    );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
    title,
    value,
    description,
    icon,
    iconClass
}) {

    return (

        <div className="bg-white border border-gray-200 rounded-xl p-5">

            <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconClass}`}
            >
                <i className={`${icon} text-lg`} />
            </div>

            <p className="text-2xl font-bold text-gray-900">
                {value}
            </p>

            <p className="text-sm font-medium text-gray-800 mt-1">
                {title}
            </p>

            <p className="text-xs text-gray-500 mt-1">
                {description}
            </p>

        </div>
    );
}

// =====================================================
// DETAIL ROW
// =====================================================

function DetailRow({
    label,
    value
}) {

    return (

        <div className="flex items-start justify-between gap-5">

            <span className="text-sm font-medium text-gray-700">
                {label}
            </span>

            <span className="text-sm text-gray-600 text-right break-words max-w-[220px]">
                {value}
            </span>

        </div>
    );
}

// =====================================================
// EMPTY CHART
// =====================================================

function EmptyChart({
    icon,
    message
}) {

    return (

        <div className="h-full flex flex-col items-center justify-center text-center">

            <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">

                <i className={`${icon} text-xl`} />

            </div>

            <p className="text-sm text-gray-500 mt-3">
                {message}
            </p>

        </div>
    );
}

// =====================================================
// PAGINATION
// =====================================================

function renderPagination(
    currentPage,
    totalPages,
    setPage
) {

    if (totalPages <= 1) {
        return (
            <button
                type="button"
                className="w-9 h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium"
            >
                1
            </button>
        );
    }

    const pages = [];

    if (totalPages <= 5) {

        for (
            let i = 1;
            i <= totalPages;
            i++
        ) {
            pages.push(i);
        }

    } else {

        pages.push(1);

        if (currentPage > 3) {
            pages.push("...");
        }

        const start =
            Math.max(
                2,
                currentPage - 1
            );

        const end =
            Math.min(
                totalPages - 1,
                currentPage + 1
            );

        for (
            let i = start;
            i <= end;
            i++
        ) {
            pages.push(i);
        }

        if (
            currentPage <
            totalPages - 2
        ) {
            pages.push("...");
        }

        pages.push(totalPages);
    }

    return pages.map(
        (item, index) => {

            if (item === "...") {

                return (
                    <span
                        key={`dots-${index}`}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
                    >
                        ...
                    </span>
                );
            }

            return (
                <button
                    key={item}
                    type="button"
                    onClick={() =>
                        setPage(item)
                    }
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                        currentPage === item
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    {item}
                </button>
            );
        }
    );
}

// =====================================================
// HELPERS
// =====================================================

function getMonthStart() {

    const date = new Date();

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        "01"
    ].join("-");
}

function getMonthEnd() {

    const date = new Date();

    const lastDay =
        new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
        ).getDate();

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(lastDay).padStart(
            2,
            "0"
        )
    ].join("-");
}

function formatShortDate(
    date
) {

    if (!date) return "-";

    return new Date(
        date
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short"
        }
    );
}

function formatLabel(
    key
) {

    return String(key)
        .replace(
            /([A-Z])/g,
            " $1"
        )
        .replace(
            /^./,
            (text) =>
                text.toUpperCase()
        );
}

function formatSummaryValue(
    value,
    key
) {

    if (
        key
            .toLowerCase()
            .includes("amount")
    ) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        ).format(
            Number(value || 0)
        );
    }

    if (
        key
            .toLowerCase()
            .includes("rate")
    ) {
        return `${value}%`;
    }

    return value;
}

export default ReportsManagement;