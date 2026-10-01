import {
    useEffect,
    useMemo,
    useState
} from "react";

import api from "../../api/axios";


const MODULES = [
    "Auth",
    "Employee",
    "Department",
    "Attendance",
    "Leave",
    "Payroll",
    "Task",
    "Document",
    "Notification",
    "Performance",
    "Other"
];

const LOGS_PER_PAGE = 10;


function ActivityLogManagement() {

    const [logs, setLogs] = useState([]);
    const [employees, setEmployees] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadingMore, setLoadingMore] =
        useState(false);

    const [employeesLoading, setEmployeesLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // Filters
    const [search, setSearch] =
        useState("");

    const [moduleFilter, setModuleFilter] =
        useState("");

    const [employeeFilter, setEmployeeFilter] =
        useState("");

    const [dateFilter, setDateFilter] =
        useState("");

    // Pagination
    const [page, setPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalLogs, setTotalLogs] =
        useState(0);

    // Details
    const [selectedLog, setSelectedLog] =
        useState(null);

    const [detailsVisible, setDetailsVisible] =
        useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] =
        useState(null);

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    // Toast
    const [toast, setToast] =
        useState(null);


    // ==================================================
    // FETCH EMPLOYEES
    // ==================================================

    const fetchEmployees = async () => {
        try {
            setEmployeesLoading(true);

            const response =
                await api.get(
                    "/employees?page=1&limit=100"
                );

            setEmployees(
                response.data.employees || []
            );

        } catch (error) {
            console.error(
                "Fetch employees error:",
                error
            );
        } finally {
            setEmployeesLoading(false);
        }
    };


    // ==================================================
    // FETCH LOGS
    // ==================================================

    const fetchLogs = async (
        requestedPage = 1,
        append = false
    ) => {

        try {

            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            setError("");

            const params =
                new URLSearchParams();

            params.set(
                "page",
                String(requestedPage)
            );

            params.set(
                "limit",
                String(LOGS_PER_PAGE)
            );

            if (moduleFilter) {
                params.set(
                    "module",
                    moduleFilter
                );
            }

            if (employeeFilter) {
                params.set(
                    "employeeId",
                    employeeFilter
                );
            }

            if (dateFilter) {
                params.set(
                    "date",
                    dateFilter
                );
            }

            const response =
                await api.get(
                    `/activity-logs?${params.toString()}`
                );

            const newLogs =
                response.data.logs || [];

            if (append) {
                setLogs(
                    (current) => [
                        ...current,
                        ...newLogs
                    ]
                );
            } else {
                setLogs(newLogs);
            }

            setPage(
                response.data.currentPage ||
                requestedPage
            );

            setTotalPages(
                response.data.totalPages || 1
            );

            setTotalLogs(
                response.data.totalLogs || 0
            );

        } catch (error) {

            console.error(
                "Fetch activity logs error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load activity logs."
            );

        } finally {

            setLoading(false);
            setLoadingMore(false);
        }
    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {
        fetchEmployees();
    }, []);


    useEffect(() => {
        fetchLogs(1, false);
    }, [
        moduleFilter,
        employeeFilter,
        dateFilter
    ]);


    // ==================================================
    // DETAILS
    // ==================================================

    const openDetails = (log) => {

        setSelectedLog(log);

        requestAnimationFrame(() => {
            setDetailsVisible(true);
        });
    };


    const closeDetails = () => {

        setDetailsVisible(false);

        setTimeout(() => {
            setSelectedLog(null);
        }, 300);
    };


    // ==================================================
    // DELETE
    // ==================================================

    const openDeleteModal = (log) => {

        setDeleteTarget(log);
        setShowDeleteModal(true);
    };


    const closeDeleteModal = () => {

        if (deleting) {
            return;
        }

        setShowDeleteModal(false);
        setDeleteTarget(null);
    };


    const handleDelete = async () => {

        if (!deleteTarget?._id) {
            return;
        }

        try {

            setDeleting(true);

            await api.delete(
                `/activity-logs/${deleteTarget._id}`
            );

            setLogs(
                (current) =>
                    current.filter(
                        (log) =>
                            log._id !==
                            deleteTarget._id
                    )
            );

            setTotalLogs(
                (current) =>
                    Math.max(0, current - 1)
            );

            if (
                selectedLog?._id ===
                deleteTarget._id
            ) {
                closeDetails();
            }

            setShowDeleteModal(false);
            setDeleteTarget(null);

            showToast(
                "Activity log deleted successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Delete activity log error:",
                error
            );

            showToast(
                error.response?.data?.message ||
                "Failed to delete activity log.",
                "error"
            );

        } finally {
            setDeleting(false);
        }
    };


    // ==================================================
    // LOAD MORE
    // ==================================================

    const handleLoadMore = () => {

        if (
            loadingMore ||
            page >= totalPages
        ) {
            return;
        }

        fetchLogs(
            page + 1,
            true
        );
    };


    // ==================================================
    // HELPERS
    // ==================================================

    const getEmployeeObject = (
        log
    ) => {

        if (
            log?.employeeId &&
            typeof log.employeeId ===
                "object"
        ) {
            return log.employeeId;
        }

        const id =
            typeof log?.employeeId ===
            "string"
                ? log.employeeId
                : "";

        return employees.find(
            (employee) =>
                String(employee._id) ===
                String(id)
        );
    };


    const getEmployeeName = (
        log
    ) => {

        const employee =
            getEmployeeObject(log);

        if (!employee) {
            return "System";
        }

        return (
            `${employee.firstName || ""} ${
                employee.lastName || ""
            }`.trim() ||
            "Unknown Employee"
        );
    };


    const getEmployeeCode = (
        log
    ) => {

        const employee =
            getEmployeeObject(log);

        return (
            employee?.employeeCode ||
            "-"
        );
    };


    const getActorEmployee = (
        log
    ) => {

        if (
            log?.userId?.employeeId &&
            typeof log.userId.employeeId ===
                "object"
        ) {
            return log.userId.employeeId;
        }

        const userEmployeeId =
            log?.userId?.employeeId;

        if (!userEmployeeId) {
            return null;
        }

        return employees.find(
            (employee) =>
                String(employee._id) ===
                String(userEmployeeId)
        );
    };


    const getActorName = (
        log
    ) => {

        const employee =
            getActorEmployee(log);

        if (employee) {
            const name =
                `${employee.firstName || ""} ${
                    employee.lastName || ""
                }`.trim();

            if (name) {
                return name;
            }
        }

        return (
            log?.userId?.email ||
            "System"
        );
    };


    const getActorEmail = (
        log
    ) => {

        return (
            log?.userId?.email ||
            "-"
        );
    };


    const getActorRole = (
        log
    ) => {

        return (
            log?.userId?.role ||
            "-"
        );
    };


    const formatDate = (
        date
    ) => {

        if (!date) {
            return "-";
        }

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

        if (!date) {
            return "-";
        }

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


    const getModuleStyle = (
        module
    ) => {

        const styles = {
            Auth:
                "bg-purple-50 text-purple-600",

            Employee:
                "bg-blue-50 text-blue-600",

            Department:
                "bg-indigo-50 text-indigo-600",

            Attendance:
                "bg-green-50 text-green-600",

            Leave:
                "bg-orange-50 text-orange-600",

            Payroll:
                "bg-emerald-50 text-emerald-600",

            Task:
                "bg-yellow-50 text-yellow-700",

            Document:
                "bg-violet-50 text-violet-600",

            Notification:
                "bg-pink-50 text-pink-600",

            Performance:
                "bg-cyan-50 text-cyan-600",

            Other:
                "bg-gray-100 text-gray-600"
        };

        return (
            styles[module] ||
            styles.Other
        );
    };


    const getModuleIcon = (
        module
    ) => {

        const icons = {
            Auth:
                "fa-shield-halved",

            Employee:
                "fa-user",

            Department:
                "fa-building",

            Attendance:
                "fa-calendar-check",

            Leave:
                "fa-plane",

            Payroll:
                "fa-money-bill",

            Task:
                "fa-list-check",

            Document:
                "fa-file-lines",

            Notification:
                "fa-bell",

            Performance:
                "fa-chart-line",

            Other:
                "fa-circle"
        };

        return (
            icons[module] ||
            icons.Other
        );
    };


    // ==================================================
    // SEARCH
    // ==================================================

    const filteredLogs =
        useMemo(() => {

            const value =
                search
                    .trim()
                    .toLowerCase();

            if (!value) {
                return logs;
            }

            return logs.filter(
                (log) => {

                    const employeeName =
                        getEmployeeName(
                            log
                        ).toLowerCase();

                    const employeeCode =
                        getEmployeeCode(
                            log
                        ).toLowerCase();

                    const actorName =
                        getActorName(
                            log
                        ).toLowerCase();

                    const actorEmail =
                        getActorEmail(
                            log
                        ).toLowerCase();

                    return (
                        String(
                            log.action || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            log.description || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            log.module || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        employeeName.includes(
                            value
                        ) ||

                        employeeCode.includes(
                            value
                        ) ||

                        actorName.includes(
                            value
                        ) ||

                        actorEmail.includes(
                            value
                        ) ||

                        String(
                            log.ipAddress || ""
                        )
                            .toLowerCase()
                            .includes(value)
                    );
                }
            );

        }, [
            logs,
            search,
            employees
        ]);


    // ==================================================
    // SUMMARY
    // ==================================================

    const employeeCount =
        new Set(
            logs
                .map(
                    (log) =>
                        getEmployeeObject(
                            log
                        )?._id
                )
                .filter(Boolean)
        ).size;

    const moduleCount =
        new Set(
            logs
                .map(
                    (log) =>
                        log.module
                )
                .filter(Boolean)
        ).size;


    const clearFilters = () => {

        setSearch("");
        setModuleFilter("");
        setEmployeeFilter("");
        setDateFilter("");
    };


    const showToast = (
        message,
        type = "success"
    ) => {

        setToast({
            message,
            type
        });

        setTimeout(() => {
            setToast(null);
        }, 3000);
    };


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-gray-500">
                    <i className="fas fa-spinner fa-spin text-indigo-600" />
                    <span className="text-sm">
                        Loading activity logs...
                    </span>
                </div>
            </div>
        );
    }


    // ==================================================
    // PAGE
    // ==================================================

    return (
        <div className="space-y-6">

            {/* HEADER */}

            <div>
                <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-indigo-600">
                        Dashboard
                    </span>

                    <i className="fas fa-chevron-right text-[9px] text-gray-400" />

                    <span className="text-gray-500">
                        Activity Log
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">
                    Activity Log
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    Track important activities performed across the HRMS.
                </p>
            </div>


            {/* SUMMARY */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <SummaryCard
                    icon="fa-list"
                    label="Total Activities"
                    value={totalLogs}
                />

                <SummaryCard
                    icon="fa-clock"
                    label="Loaded Activities"
                    value={logs.length}
                />

                <SummaryCard
                    icon="fa-users"
                    label="Employees"
                    value={employeeCount}
                />

                <SummaryCard
                    icon="fa-layer-group"
                    label="Modules"
                    value={moduleCount}
                />

            </div>


            {/* FILTERS */}

            <div className="bg-white border border-gray-200 rounded-xl p-4">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">

                    <div className="relative">

                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search activities..."
                            className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                    </div>


                    <select
                        value={moduleFilter}
                        onChange={(event) =>
                            setModuleFilter(
                                event.target.value
                            )
                        }
                        className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >

                        <option value="">
                            All Modules
                        </option>

                        {MODULES.map(
                            (module) => (
                                <option
                                    key={module}
                                    value={module}
                                >
                                    {module}
                                </option>
                            )
                        )}

                    </select>


                    <select
                        value={employeeFilter}
                        onChange={(event) =>
                            setEmployeeFilter(
                                event.target.value
                            )
                        }
                        className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >

                        <option value="">
                            All Employees
                        </option>

                        {employees.map(
                            (employee) => (
                                <option
                                    key={employee._id}
                                    value={employee._id}
                                >
                                    {employee.firstName}{" "}
                                    {employee.lastName}
                                    {" - "}
                                    {employee.employeeCode}
                                </option>
                            )
                        )}

                    </select>


                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(event) =>
                            setDateFilter(
                                event.target.value
                            )
                        }
                        className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />


                    <button
                        type="button"
                        onClick={clearFilters}
                        className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                        Clear Filters
                    </button>

                </div>

            </div>


            {/* ERROR */}

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                    {error}
                </div>
            )}


            {/* ACTIVITY LIST */}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Recent Activities
                        </h2>

                        <p className="text-xs text-gray-500 mt-1">
                            {filteredLogs.length} activities shown
                        </p>
                    </div>

                </div>


                <div className="divide-y divide-gray-100">

                    {filteredLogs.length === 0 ? (

                        <div className="py-16 text-center">

                            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <i className="fas fa-clock" />
                            </div>

                            <p className="mt-3 text-sm font-medium text-gray-700">
                                No activities found
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Try changing your filters.
                            </p>

                        </div>

                    ) : (

                        filteredLogs.map(
                            (log) => (

                                <div
                                    key={log._id}
                                    className="px-5 py-4 hover:bg-gray-50 transition"
                                >

                                    <div className="flex items-start gap-4">

                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getModuleStyle(log.module)}`}
                                        >
                                            <i
                                                className={`fas ${getModuleIcon(log.module)}`}
                                            />
                                        </div>


                                        <div className="min-w-0 flex-1">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {log.action}
                                                </h3>

                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getModuleStyle(log.module)}`}
                                                >
                                                    {log.module}
                                                </span>

                                            </div>


                                            <p className="text-sm text-gray-600 mt-1">
                                                {log.description ||
                                                    "No description available."}
                                            </p>


                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">

                                                <span>
                                                    <i className="fas fa-user mr-1" />
                                                    {getActorName(log)}
                                                </span>

                                                <span>
                                                    <i className="fas fa-clock mr-1" />
                                                    {formatDateTime(
                                                        log.createdAt
                                                    )}
                                                </span>

                                                {getEmployeeObject(
                                                    log
                                                ) && (
                                                    <span>
                                                        <i className="fas fa-id-card mr-1" />
                                                        {getEmployeeCode(
                                                            log
                                                        )}
                                                    </span>
                                                )}

                                            </div>

                                        </div>


                                        <div className="flex items-center gap-2 shrink-0">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openDetails(
                                                        log
                                                    )
                                                }
                                                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition"
                                                title="View activity"
                                            >
                                                <i className="fas fa-eye text-xs" />
                                            </button>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openDeleteModal(
                                                        log
                                                    )
                                                }
                                                className="w-9 h-9 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition"
                                                title="Delete activity"
                                            >
                                                <i className="fas fa-trash text-xs" />
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            )
                        )

                    )}

                </div>


                {/* LOAD MORE */}

                {page < totalPages && (
                    <div className="px-5 py-4 border-t border-gray-100 flex justify-center">

                        <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-5 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2" />
                                    Loading...
                                </>
                            ) : (
                                "Load More"
                            )}
                        </button>

                    </div>
                )}

            </div>


            {/* ==================================================
                RIGHT SLIDE-IN DETAILS
            ================================================== */}

            {selectedLog && (
                <div className="fixed inset-0 z-[70]">

                    {/* BACKDROP */}

                    <div
                        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
                            detailsVisible
                                ? "opacity-100"
                                : "opacity-0"
                        }`}
                        onClick={closeDetails}
                    />


                    {/* PANEL */}

                    <div
                        className={`absolute top-0 right-0 h-full w-full sm:w-[430px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
                            detailsVisible
                                ? "translate-x-0"
                                : "translate-x-full"
                        }`}
                    >

                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">

                            <div>

                                <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    Activity Details
                                </p>

                                <h2 className="text-lg font-semibold text-gray-900 mt-1">
                                    {selectedLog.action}
                                </h2>

                            </div>


                            <button
                                type="button"
                                onClick={closeDetails}
                                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                            >
                                <i className="fas fa-times" />
                            </button>

                        </div>


                        {/* CONTENT */}

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            <div className="flex items-center gap-3">

                                <div
                                    className={`w-11 h-11 rounded-full flex items-center justify-center ${getModuleStyle(selectedLog.module)}`}
                                >
                                    <i
                                        className={`fas ${getModuleIcon(selectedLog.module)}`}
                                    />
                                </div>

                                <div>

                                    <p className="text-sm font-semibold text-gray-900">
                                        {selectedLog.action}
                                    </p>

                                    <span
                                        className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getModuleStyle(selectedLog.module)}`}
                                    >
                                        {selectedLog.module}
                                    </span>

                                </div>

                            </div>


                            <DetailSection title="Description">

                                <p className="text-sm leading-6 text-gray-600">
                                    {selectedLog.description ||
                                        "No description available."}
                                </p>

                            </DetailSection>


                            <DetailSection title="Employee">

                                <DetailRow
                                    label="Name"
                                    value={getEmployeeName(
                                        selectedLog
                                    )}
                                />

                                <DetailRow
                                    label="Employee Code"
                                    value={getEmployeeCode(
                                        selectedLog
                                    )}
                                />

                            </DetailSection>


                            <DetailSection title="Performed By">

                                <DetailRow
                                    label="Name"
                                    value={getActorName(
                                        selectedLog
                                    )}
                                />

                                <DetailRow
                                    label="Role"
                                    value={getActorRole(
                                        selectedLog
                                    )}
                                />

                                <DetailRow
                                    label="Email"
                                    value={getActorEmail(
                                        selectedLog
                                    )}
                                />

                            </DetailSection>


                            <DetailSection title="Activity Information">

                                <DetailRow
                                    label="Module"
                                    value={selectedLog.module}
                                />

                                <DetailRow
                                    label="Date"
                                    value={formatDate(
                                        selectedLog.createdAt
                                    )}
                                />

                                <DetailRow
                                    label="Time"
                                    value={new Date(
                                        selectedLog.createdAt
                                    ).toLocaleTimeString(
                                        "en-IN",
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }
                                    )}
                                />

                                <DetailRow
                                    label="IP Address"
                                    value={
                                        selectedLog.ipAddress ||
                                        "-"
                                    }
                                />

                            </DetailSection>

                        </div>


                        {/* FOOTER */}

                        <div className="px-5 py-4 border-t border-gray-200 shrink-0">

                            <button
                                type="button"
                                onClick={() =>
                                    openDeleteModal(
                                        selectedLog
                                    )
                                }
                                className="w-full h-11 rounded-lg bg-red-50 text-red-600 border border-red-100 font-medium text-sm hover:bg-red-100 transition"
                            >
                                <i className="fas fa-trash mr-2" />
                                Delete Activity
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* ==================================================
                DELETE MODAL
            ================================================== */}

            {showDeleteModal &&
                deleteTarget && (
                    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">

                        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">

                            <div className="flex items-start gap-4">

                                <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <i className="fas fa-trash" />
                                </div>

                                <div>

                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Delete Activity Log?
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-2 leading-6">
                                        This activity will be permanently removed.
                                        This action cannot be undone.
                                    </p>

                                </div>

                            </div>


                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={deleting}
                                    className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                                >
                                    {deleting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete"
                                    )}
                                </button>

                            </div>

                        </div>

                    </div>
                )}


            {/* TOAST */}

            {toast && (
                <div className="fixed bottom-5 right-5 z-[100]">

                    <div
                        className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
                            toast.type === "error"
                                ? "bg-red-600"
                                : "bg-green-600"
                        }`}
                    >
                        {toast.message}
                    </div>

                </div>
            )}

        </div>
    );
}


// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
    icon,
    label,
    value
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">

            <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <i className={`fas ${icon}`} />
                </div>

                <div>

                    <p className="text-xs text-gray-500">
                        {label}
                    </p>

                    <p className="text-xl font-bold text-gray-900 mt-1">
                        {value}
                    </p>

                </div>

            </div>

        </div>
    );
}


// ======================================================
// DETAIL SECTION
// ======================================================

function DetailSection({
    title,
    children
}) {
    return (
        <div className="border border-gray-100 rounded-xl p-4">

            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {title}
            </h3>

            <div className="space-y-3">
                {children}
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
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-sm">

            <span className="text-gray-400">
                {label}
            </span>

            <span className="font-medium text-gray-800 break-words">
                {value || "-"}
            </span>

        </div>
    );
}


export default ActivityLogManagement;