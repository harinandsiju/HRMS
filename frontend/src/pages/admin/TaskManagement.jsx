import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const TASKS_PER_PAGE = 8;

const initialTaskForm = {
    employeeId: "",
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    dueDate: ""
};

function TaskManagement() {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search and filters
    const [search, setSearch] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Task details panel
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailsVisible, setDetailsVisible] = useState(false);

    // Add task modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Edit task modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete confirmation
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    // Form
    const [taskForm, setTaskForm] = useState(
        initialTaskForm
    );

    // =========================
    // FETCH DATA
    // =========================

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                taskResponse,
                employeeResponse
            ] = await Promise.all([
                api.get("/task?page=1&limit=100"),
                api.get("/employees?page=1&limit=100")
            ]);

            setTasks(
                taskResponse.data.tasks || []
            );

            setEmployees(
                employeeResponse.data.employees || []
            );
        } catch (err) {
            console.error(
                "Fetch task data error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to fetch task data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // =========================
    // BODY SCROLL LOCK
    // =========================

    useEffect(() => {
        const overlayOpen =
            showAddModal ||
            showEditModal ||
            Boolean(taskToDelete) ||
            Boolean(selectedTask);

        if (!overlayOpen) {
            return;
        }

        const scrollbarWidth =
            window.innerWidth -
            document.documentElement.clientWidth;

        const previousOverflow =
            document.body.style.overflow;

        const previousPaddingRight =
            document.body.style.paddingRight;

        document.body.style.overflow = "hidden";

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight =
                `${scrollbarWidth}px`;
        }

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.body.style.paddingRight =
                previousPaddingRight;
        };
    }, [
        showAddModal,
        showEditModal,
        taskToDelete,
        selectedTask
    ]);

    // =========================
    // TOAST
    // =========================

    const showToast = (
        message,
        type = "success"
    ) => {
        setToast({
            message,
            type
        });
    };

    const closeToast = () => {
        setToast(null);
    };

    // =========================
    // HELPERS
    // =========================

    const getEmployee = (task) => {
        if (
            task?.employeeId &&
            typeof task.employeeId === "object"
        ) {
            return task.employeeId;
        }

        return employees.find(
            (employee) =>
                String(employee._id) ===
                String(
                    task?.employeeId
                )
        );
    };

    const getEmployeeName = (task) => {
        const employee = getEmployee(task);

        if (!employee) {
            return "Unknown Employee";
        }

        return `${employee.firstName || ""} ${
            employee.lastName || ""
        }`.trim();
    };

    const getEmployeeCode = (task) => {
        const employee = getEmployee(task);

        return (
            employee?.employeeCode ||
            "Not available"
        );
    };

    const getEmployeeDesignation = (task) => {
        const employee = getEmployee(task);

        return (
            employee?.designation ||
            "Employee"
        );
    };

    const getInitials = (task) => {
        const employee = getEmployee(task);

        if (!employee) {
            return "NA";
        }

        const first =
            employee.firstName?.charAt(0) || "";

        const last =
            employee.lastName?.charAt(0) || "";

        return `${first}${last}`.toUpperCase();
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

    const getTaskStatusLabel = (status) => {
        if (status === "Pending") {
            return "To Do";
        }

        return status || "Not available";
    };

    const getStatusClass = (status) => {
        if (status === "Pending") {
            return "bg-indigo-50 text-indigo-600 border-indigo-100";
        }

        if (status === "In Progress") {
            return "bg-blue-50 text-blue-600 border-blue-100";
        }

        if (status === "Completed") {
            return "bg-green-50 text-green-600 border-green-100";
        }

        return "bg-gray-50 text-gray-600 border-gray-100";
    };

    const getPriorityClass = (priority) => {
        if (priority === "High") {
            return "bg-red-50 text-red-600 border-red-100";
        }

        if (priority === "Medium") {
            return "bg-orange-50 text-orange-600 border-orange-100";
        }

        if (priority === "Low") {
            return "bg-green-50 text-green-600 border-green-100";
        }

        return "bg-gray-50 text-gray-600 border-gray-100";
    };

    const isOverdue = (task) => {
        if (
            !task?.dueDate ||
            task.status === "Completed"
        ) {
            return false;
        }

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        const dueDate = new Date(
            task.dueDate
        );

        dueDate.setHours(
            0,
            0,
            0,
            0
        );

        return dueDate < today;
    };

    // =========================
    // FILTER TASKS
    // =========================

    const filteredTasks = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return tasks.filter((task) => {
            const employee =
                getEmployee(task);

            const employeeName =
                getEmployeeName(
                    task
                ).toLowerCase();

            const employeeCode =
                getEmployeeCode(
                    task
                ).toLowerCase();

            const title =
                task.title?.toLowerCase() || "";

            const description =
                task.description?.toLowerCase() || "";

            const matchesSearch =
                !searchValue ||
                title.includes(searchValue) ||
                description.includes(searchValue) ||
                employeeName.includes(searchValue) ||
                employeeCode.includes(searchValue);

            const matchesEmployee =
                !employeeFilter ||
                String(
                    employee?._id
                ) === String(employeeFilter);

            const matchesPriority =
                !priorityFilter ||
                task.priority === priorityFilter;

            const matchesStatus =
                !statusFilter ||
                task.status === statusFilter;

            return (
                matchesSearch &&
                matchesEmployee &&
                matchesPriority &&
                matchesStatus
            );
        });
    }, [
        tasks,
        employees,
        search,
        employeeFilter,
        priorityFilter,
        statusFilter
    ]);

    // =========================
    // PAGINATION
    // =========================

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredTasks.length /
                TASKS_PER_PAGE
        )
    );

    const visibleTasks = useMemo(() => {
        const start =
            (currentPage - 1) *
            TASKS_PER_PAGE;

        return filteredTasks.slice(
            start,
            start + TASKS_PER_PAGE
        );
    }, [
        filteredTasks,
        currentPage
    ]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [
        currentPage,
        totalPages
    ]);

    // =========================
    // SUMMARY
    // =========================

    const totalTasks =
        filteredTasks.length;

    const inProgressTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "In Progress"
        ).length;

    const completedTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "Completed"
        ).length;

    const overdueTasks =
        filteredTasks.filter(
            (task) =>
                isOverdue(task)
        ).length;

    // =========================
    // FORM CHANGE
    // =========================

    const handleFormChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setTaskForm(
            (current) => ({
                ...current,
                [name]: value
            })
        );
    };

    // =========================
    // OPEN ADD MODAL
    // =========================

    const openAddModal = () => {
        setTaskForm({
            ...initialTaskForm
        });

        setShowAddModal(true);
    };

    // =========================
    // CREATE TASK
    // =========================

    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (!taskForm.employeeId) {
            showToast(
                "Please select an employee.",
                "error"
            );
            return;
        }

        if (!taskForm.title.trim()) {
            showToast(
                "Please enter a task title.",
                "error"
            );
            return;
        }

        if (!taskForm.dueDate) {
            showToast(
                "Please select a due date.",
                "error"
            );
            return;
        }

        try {
            setIsCreating(true);

            await api.post(
                "/task",
                {
                    employeeId:
                        taskForm.employeeId,

                    title:
                        taskForm.title.trim(),

                    description:
                        taskForm.description.trim(),

                    priority:
                        taskForm.priority,

                    dueDate:
                        taskForm.dueDate
                }
            );

            setShowAddModal(false);

            setTaskForm({
                ...initialTaskForm
            });

            setCurrentPage(1);

            await fetchData();

            showToast(
                "Task created successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Create task error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                "Failed to create task.",
                "error"
            );
        } finally {
            setIsCreating(false);
        }
    };

    // =========================
    // OPEN VIEW PANEL
    // =========================

    const openTaskDetails = (task) => {
        setSelectedTask(task);

        requestAnimationFrame(() => {
            setDetailsVisible(true);
        });
    };

    // =========================
    // CLOSE VIEW PANEL
    // =========================

    const closeTaskDetails = () => {
        setDetailsVisible(false);

        setTimeout(() => {
            setSelectedTask(null);
        }, 300);
    };

    // =========================
    // OPEN EDIT MODAL
    // =========================

    const openEditModal = (task) => {
        setTaskForm({
            employeeId:
                typeof task.employeeId ===
                "object"
                    ? task.employeeId?._id || ""
                    : task.employeeId || "",

            title:
                task.title || "",

            description:
                task.description || "",

            priority:
                task.priority || "Medium",

            status:
                task.status || "Pending",

            dueDate:
                task.dueDate
                    ? new Date(
                          task.dueDate
                      )
                          .toISOString()
                          .split("T")[0]
                    : ""
        });

        /*
         * Keep selectedTask so that handleUpdateTask
         * can access selectedTask._id.
         *
         * If Edit is opened from the details panel,
         * the selected task contains the task ID.
         *
         * If Edit is opened directly from the table,
         * selectedTask is already null, so the task
         * passed into this function is saved here.
         */
        setSelectedTask(task);

        setDetailsVisible(false);

        setTimeout(() => {
            setShowEditModal(true);
        }, 300);
    };

    // =========================
    // UPDATE TASK
    // =========================

    const handleUpdateTask = async (e) => {
        e.preventDefault();

        if (!taskForm.title.trim()) {
            showToast(
                "Please enter a task title.",
                "error"
            );
            return;
        }

        if (!taskForm.dueDate) {
            showToast(
                "Please select a due date.",
                "error"
            );
            return;
        }

        if (!selectedTask?._id) {
            showToast(
                "Task could not be identified.",
                "error"
            );
            return;
        }

        try {
            setIsUpdating(true);

            await api.put(
                `/task/${selectedTask._id}`,
                {
                    title:
                        taskForm.title.trim(),

                    description:
                        taskForm.description.trim(),

                    priority:
                        taskForm.priority,

                    status:
                        taskForm.status,

                    dueDate:
                        taskForm.dueDate
                }
            );

            setShowEditModal(false);

            setTaskForm({
                ...initialTaskForm
            });

            setSelectedTask(null);

            await fetchData();

            showToast(
                "Task updated successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Update task error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                "Failed to update task.",
                "error"
            );
        } finally {
            setIsUpdating(false);
        }
    };

    // =========================
    // OPEN DELETE MODAL
    // =========================

    const openDeleteModal = (task) => {
        setTaskToDelete(task);
    };

    // =========================
    // DELETE TASK
    // =========================

    const handleDeleteTask = async () => {
        if (!taskToDelete?._id) {
            return;
        }

        try {
            setIsDeleting(true);

            await api.delete(
                `/task/${taskToDelete._id}`
            );

            const deletedId =
                taskToDelete._id;

            setTasks(
                (currentTasks) =>
                    currentTasks.filter(
                        (task) =>
                            task._id !==
                            deletedId
                    )
            );

            if (
                selectedTask?._id ===
                deletedId
            ) {
                closeTaskDetails();
            }

            setTaskToDelete(null);

            showToast(
                "Task deleted successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Delete task error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                "Failed to delete task.",
                "error"
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // =========================
    // CLEAR FILTERS
    // =========================

    const clearFilters = () => {
        setSearch("");
        setEmployeeFilter("");
        setPriorityFilter("");
        setStatusFilter("");
        setCurrentPage(1);
    };

    // =========================
    // EXPORT TASKS
    // =========================

    const exportTasks = () => {
        if (!filteredTasks.length) {
            showToast(
                "There are no tasks to export.",
                "info"
            );
            return;
        }

        const headers = [
            "Task Name",
            "Employee",
            "Employee ID",
            "Priority",
            "Due Date",
            "Status"
        ];

        const rows =
            filteredTasks.map(
                (task) => [
                    task.title || "",
                    getEmployeeName(task),
                    getEmployeeCode(task),
                    task.priority || "",
                    formatDate(task.dueDate),
                    getTaskStatusLabel(
                        task.status
                    )
                ]
            );

        const csv = [
            headers,
            ...rows
        ]
            .map((row) =>
                row
                    .map(
                        (value) =>
                            `"${String(
                                value
                            ).replace(
                                /"/g,
                                '""'
                            )}"`
                    )
                    .join(",")
            )
            .join("\n");

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;
        link.download =
            "hrms-tasks.csv";

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        URL.revokeObjectURL(url);

        showToast(
            "Tasks exported successfully.",
            "success"
        );
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-gray-500">
                    <i className="fas fa-spinner fa-spin text-indigo-600" />
                    <span className="text-sm">
                        Loading tasks...
                    </span>
                </div>
            </div>
        );
    }

    // =========================
    // ERROR
    // =========================

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-5">
                <div className="flex items-center gap-3">
                    <i className="fas fa-exclamation-circle" />
                    <span className="text-sm">
                        {error}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* =========================
                PAGE HEADER
            ========================== */}

            <div className="flex items-center justify-between">

                <div>
                    <div className="flex items-center gap-2 text-sm mb-2">

                        <span className="text-indigo-600">
                            Home
                        </span>

                        <i className="fas fa-chevron-right text-[9px] text-gray-400" />

                        <span className="text-gray-500">
                            Task Management
                        </span>

                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Task Management
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage employee tasks and track progress.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm"
                >
                    <i className="fas fa-plus" />
                    Assign Task
                </button>

            </div>

            {/* =========================
                SUMMARY CARDS
            ========================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <SummaryCard
                    title="Total Tasks"
                    value={totalTasks}
                    description="All Tasks"
                    icon="fas fa-clipboard-list"
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <SummaryCard
                    title="In Progress"
                    value={inProgressTasks}
                    description="Currently in progress"
                    icon="fas fa-chart-pie"
                    iconClass="bg-green-50 text-green-600"
                />

                <SummaryCard
                    title="Completed"
                    value={completedTasks}
                    description="Tasks completed"
                    icon="fas fa-check-circle"
                    iconClass="bg-blue-50 text-blue-600"
                />

                <SummaryCard
                    title="Overdue Tasks"
                    value={overdueTasks}
                    description="Past due date"
                    icon="fas fa-clock"
                    iconClass="bg-red-50 text-red-600"
                />

            </div>

            {/* =========================
                FILTERS
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl p-5">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

                    {/* SEARCH */}

                    <div className="relative">

                        <label className="block text-xs font-medium text-gray-500 mb-2">
                            Search
                        </label>

                        <div className="relative">

                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(
                                        e.target.value
                                    );
                                    setCurrentPage(
                                        1
                                    );
                                }}
                                placeholder="Search task..."
                                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />

                        </div>

                    </div>

                    {/* EMPLOYEE */}

                    <SelectField
                        label="Assigned Employee"
                        value={employeeFilter}
                        onChange={(e) => {
                            setEmployeeFilter(
                                e.target.value
                            );
                            setCurrentPage(
                                1
                            );
                        }}
                        placeholder="All Employees"
                        options={employees.map(
                            (employee) => ({
                                value:
                                    employee._id,
                                label:
                                    `${employee.firstName || ""} ${
                                        employee.lastName || ""
                                    }`.trim()
                            })
                        )}
                    />

                    {/* PRIORITY */}

                    <SelectField
                        label="Priority"
                        value={priorityFilter}
                        onChange={(e) => {
                            setPriorityFilter(
                                e.target.value
                            );
                            setCurrentPage(
                                1
                            );
                        }}
                        placeholder="All Priorities"
                        options={[
                            {
                                value: "Low",
                                label: "Low"
                            },
                            {
                                value: "Medium",
                                label: "Medium"
                            },
                            {
                                value: "High",
                                label: "High"
                            }
                        ]}
                    />

                    {/* STATUS */}

                    <SelectField
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(
                                e.target.value
                            );
                            setCurrentPage(
                                1
                            );
                        }}
                        placeholder="All Statuses"
                        options={[
                            {
                                value: "Pending",
                                label: "To Do"
                            },
                            {
                                value: "In Progress",
                                label: "In Progress"
                            },
                            {
                                value: "Completed",
                                label: "Completed"
                            }
                        ]}
                    />

                    {/* EXPORT */}

                    <div className="flex items-end">

                        <button
                            type="button"
                            onClick={exportTasks}
                            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition"
                        >
                            <i className="fas fa-download" />
                            Export Tasks
                        </button>

                    </div>

                </div>

                {(search ||
                    employeeFilter ||
                    priorityFilter ||
                    statusFilter) && (
                    <div className="flex justify-end mt-4">

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            <i className="fas fa-times" />
                            Clear Filters
                        </button>

                    </div>
                )}

            </div>

            {/* =========================
                TASK TABLE
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-200">

                    <h3 className="text-lg font-semibold text-gray-900">
                        Tasks
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        Showing{" "}
                        {visibleTasks.length}{" "}
                        of{" "}
                        {filteredTasks.length}{" "}
                        tasks
                    </p>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1050px] text-sm table-fixed">

                        <colgroup>
                            <col style={{ width: "25%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "13%" }} />
                            <col style={{ width: "13%" }} />
                            <col style={{ width: "20%" }} />
                        </colgroup>

                        <thead className="bg-gray-50 border-b border-gray-200">

                            <tr>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Task Name
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Assigned To
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Priority
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Due Date
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-500">
                                    Status
                                </th>

                                <th className="text-center px-5 py-3 font-medium text-gray-500">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {visibleTasks.length > 0 ? (
                                visibleTasks.map(
                                    (task) => (
                                        <tr
                                            key={task._id}
                                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                                        >

                                            {/* TASK */}

                                            <td className="px-5 py-4 align-middle">

                                                <div className="min-w-0">

                                                    <p className="font-medium text-gray-900 truncate">
                                                        {task.title}
                                                    </p>

                                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                                        {task.description ||
                                                            "No description"}
                                                    </p>

                                                </div>

                                            </td>

                                            {/* EMPLOYEE */}

                                            <td className="px-5 py-4 align-middle">

                                                <div className="flex items-center gap-3 min-w-0">

                                                    <EmployeeAvatar
                                                        task={task}
                                                    />

                                                    <div className="min-w-0">

                                                        <p className="font-medium text-gray-900 truncate">
                                                            {getEmployeeName(
                                                                task
                                                            )}
                                                        </p>

                                                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                            {getEmployeeDesignation(
                                                                task
                                                            )}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* PRIORITY */}

                                            <td className="px-5 py-4 align-middle">

                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getPriorityClass(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority ===
                                                        "High" && (
                                                        <i className="fas fa-arrow-up text-[9px]" />
                                                    )}

                                                    {task.priority ===
                                                        "Medium" && (
                                                        <i className="fas fa-minus text-[9px]" />
                                                    )}

                                                    {task.priority ===
                                                        "Low" && (
                                                        <i className="fas fa-arrow-down text-[9px]" />
                                                    )}

                                                    {task.priority ||
                                                        "Not available"}
                                                </span>

                                            </td>

                                            {/* DUE DATE */}

                                            <td className="px-5 py-4 align-middle">

                                                <div
                                                    className={
                                                        isOverdue(
                                                            task
                                                        )
                                                            ? "text-red-600 font-medium"
                                                            : "text-gray-700"
                                                    }
                                                >
                                                    <span>
                                                        {formatDate(
                                                            task.dueDate
                                                        )}
                                                    </span>

                                                    {isOverdue(
                                                        task
                                                    ) && (
                                                        <i className="fas fa-exclamation-circle ml-2 text-xs" />
                                                    )}
                                                </div>

                                            </td>

                                            {/* STATUS */}

                                            <td className="px-5 py-4 align-middle">

                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClass(
                                                        task.status
                                                    )}`}
                                                >

                                                    <i
                                                        className={
                                                            task.status ===
                                                            "Completed"
                                                                ? "fas fa-check-circle text-[10px]"
                                                                : task.status ===
                                                                  "In Progress"
                                                                ? "fas fa-spinner text-[10px]"
                                                                : "fas fa-clock text-[10px]"
                                                        }
                                                    />

                                                    {getTaskStatusLabel(
                                                        task.status
                                                    )}

                                                </span>

                                            </td>

                                            {/* ACTIONS */}

                                            <td className="px-5 py-4 align-middle">

                                                <div className="flex items-center justify-center gap-2">

                                                    <ActionButton
                                                        icon="fas fa-eye"
                                                        title="View task"
                                                        className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                                        onClick={() =>
                                                            openTaskDetails(
                                                                task
                                                            )
                                                        }
                                                    />

                                                    <ActionButton
                                                        icon="fas fa-pen"
                                                        title="Edit task"
                                                        className="text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                        onClick={() =>
                                                            openEditModal(
                                                                task
                                                            )
                                                        }
                                                    />

                                                    <ActionButton
                                                        icon="fas fa-trash"
                                                        title="Delete task"
                                                        className="text-red-600 bg-red-50 hover:bg-red-100"
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                task
                                                            )
                                                        }
                                                    />

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-5 py-14 text-center"
                                    >

                                        <div className="flex flex-col items-center">

                                            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mb-3">
                                                <i className="fas fa-clipboard-list text-lg" />
                                            </div>

                                            <p className="text-sm font-medium text-gray-700">
                                                No tasks found
                                            </p>

                                            <p className="text-xs text-gray-400 mt-1">
                                                Try changing your search or filters.
                                            </p>

                                        </div>

                                    </td>

                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                {/* =========================
                    PAGINATION
                ========================== */}

                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">

                    <p className="text-sm text-gray-500">
                        Showing{" "}
                        {filteredTasks.length === 0
                            ? 0
                            : (currentPage - 1) *
                                  TASKS_PER_PAGE +
                              1}{" "}
                        to{" "}
                        {Math.min(
                            currentPage *
                                TASKS_PER_PAGE,
                            filteredTasks.length
                        )}{" "}
                        of{" "}
                        {filteredTasks.length}{" "}
                        entries
                    </p>

                    <div className="flex items-center gap-1.5">

                        <button
                            type="button"
                            disabled={
                                currentPage <=
                                1
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        page - 1
                                )
                            }
                            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Previous page"
                        >
                            <i className="fas fa-chevron-left text-xs" />
                        </button>

                        {Array.from(
                            {
                                length:
                                    totalPages
                            },
                            (_, index) =>
                                index + 1
                        )
                            .slice(
                                0,
                                5
                            )
                            .map(
                                (page) => (
                                    <button
                                        type="button"
                                        key={page}
                                        onClick={() =>
                                            setCurrentPage(
                                                page
                                            )
                                        }
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                                            currentPage ===
                                            page
                                                ? "bg-indigo-600 text-white"
                                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                        <button
                            type="button"
                            disabled={
                                currentPage >=
                                totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        page + 1
                                )
                            }
                            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Next page"
                        >
                            <i className="fas fa-chevron-right text-xs" />
                        </button>

                    </div>

                </div>

            </div>

            {/* =========================
                TASK DETAILS SIDE PANEL
            ========================== */}

            {selectedTask && !showEditModal && (
                <div className="fixed inset-0 z-[70]">

                    {/* BACKDROP */}

                    <div
                        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
                            detailsVisible
                                ? "opacity-100"
                                : "opacity-0"
                        }`}
                        onClick={
                            closeTaskDetails
                        }
                    />

                    {/* PANEL */}

                    <div
                        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out ${
                            detailsVisible
                                ? "translate-x-0"
                                : "translate-x-full"
                        }`}
                    >

                        <div className="h-full flex flex-col">

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">

                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Task Details
                                    </h2>

                                    <p className="text-xs text-gray-400 mt-1">
                                        Task information
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeTaskDetails
                                    }
                                    className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                    title="Close details"
                                >
                                    <i className="fas fa-times" />
                                </button>

                            </div>

                            {/* CONTENT */}

                            <div className="flex-1 overflow-y-auto px-6 py-6">

                                {/* TASK HERO */}

                                <div className="flex items-start gap-4">

                                    <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-clipboard-list text-2xl" />
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <div className="flex items-start justify-between gap-3">

                                            <h3 className="text-base font-semibold text-gray-900">
                                                {selectedTask.title}
                                            </h3>

                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${getStatusClass(
                                                    selectedTask.status
                                                )}`}
                                            >
                                                <i
                                                    className={
                                                        selectedTask.status ===
                                                        "Completed"
                                                            ? "fas fa-check-circle text-[9px]"
                                                            : selectedTask.status ===
                                                              "In Progress"
                                                            ? "fas fa-spinner text-[9px]"
                                                            : "fas fa-clock text-[9px]"
                                                    }
                                                />

                                                {getTaskStatusLabel(
                                                    selectedTask.status
                                                )}
                                            </span>

                                        </div>

                                        <p className="text-sm text-gray-500 mt-1">
                                            {selectedTask.description ||
                                                "No description available"}
                                        </p>



                                    </div>

                                </div>

                                <div className="border-t border-gray-200 my-6" />

                                {/* TASK INFORMATION */}

                                <div>

                                    <h3 className="text-sm font-semibold text-gray-900 mb-5">
                                        Task Information
                                    </h3>

                                    <div className="space-y-5">

                                        {/* ASSIGNED TO */}

                                        <div className="flex items-center justify-between gap-4">

                                            <span className="text-sm text-gray-500">
                                                Assigned To
                                            </span>

                                            <div className="flex items-center gap-3">

                                                <EmployeeAvatar
                                                    task={
                                                        selectedTask
                                                    }
                                                />

                                                <div className="text-right">

                                                    <p className="text-sm font-medium text-gray-900">
                                                        {getEmployeeName(
                                                            selectedTask
                                                        )}
                                                    </p>

                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {getEmployeeDesignation(
                                                            selectedTask
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                        {/* EMPLOYEE ID */}

                                        <InfoRow
                                            label="Employee ID"
                                            value={getEmployeeCode(
                                                selectedTask
                                            )}
                                        />

                                        {/* PRIORITY */}

                                        <div className="flex items-center justify-between">

                                            <span className="text-sm text-gray-500">
                                                Priority
                                            </span>

                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getPriorityClass(
                                                    selectedTask.priority
                                                )}`}
                                            >

                                                {selectedTask.priority ===
                                                    "High" && (
                                                    <i className="fas fa-arrow-up text-[9px]" />
                                                )}

                                                {selectedTask.priority ===
                                                    "Medium" && (
                                                    <i className="fas fa-minus text-[9px]" />
                                                )}

                                                {selectedTask.priority ===
                                                    "Low" && (
                                                    <i className="fas fa-arrow-down text-[9px]" />
                                                )}

                                                {selectedTask.priority ||
                                                    "Not available"}

                                            </span>

                                        </div>

                                        {/* DUE DATE */}

                                        <InfoRow
                                            label="Due Date"
                                            value={
                                                <span
                                                    className={
                                                        isOverdue(
                                                            selectedTask
                                                        )
                                                            ? "text-red-600"
                                                            : ""
                                                    }
                                                >
                                                    {formatDate(
                                                        selectedTask.dueDate
                                                    )}

                                                    {isOverdue(
                                                        selectedTask
                                                    ) && (
                                                        <i className="fas fa-exclamation-circle ml-2 text-xs" />
                                                    )}
                                                </span>
                                            }
                                        />

                                        {/* STATUS */}

                                        <div className="flex items-center justify-between">

                                            <span className="text-sm text-gray-500">
                                                Status
                                            </span>

                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClass(
                                                    selectedTask.status
                                                )}`}
                                            >
                                                <i
                                                    className={
                                                        selectedTask.status ===
                                                        "Completed"
                                                            ? "fas fa-check-circle text-[9px]"
                                                            : selectedTask.status ===
                                                              "In Progress"
                                                            ? "fas fa-spinner text-[9px]"
                                                            : "fas fa-clock text-[9px]"
                                                    }
                                                />

                                                {getTaskStatusLabel(
                                                    selectedTask.status
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                <div className="border-t border-gray-200 my-6" />

                                {/* DESCRIPTION */}

                                <div>

                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                        Description
                                    </h3>

                                    <p className="text-sm text-gray-600 leading-6">
                                        {selectedTask.description ||
                                            "No description available for this task."}
                                    </p>

                                </div>

                                <div className="border-t border-gray-200 my-6" />

                                {/* CREATED */}

                                <div>

                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                        Task Activity
                                    </h3>

                                    <div className="space-y-4">

                                        <InfoRow
                                            label="Created On"
                                            value={formatDate(
                                                selectedTask.createdAt
                                            )}
                                        />

                                        <InfoRow
                                            label="Last Updated"
                                            value={formatDate(
                                                selectedTask.updatedAt
                                            )}
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* PANEL FOOTER */}

                            <div className="border-t border-gray-200 p-5">

                                <div className="grid grid-cols-2 gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditModal(
                                                selectedTask
                                            )
                                        }
                                        className="inline-flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg px-4 py-2.5 text-sm font-medium transition"
                                    >
                                        <i className="fas fa-pen" />
                                        Edit Task
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openDeleteModal(
                                                selectedTask
                                            )
                                        }
                                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition"
                                    >
                                        <i className="fas fa-trash" />
                                        Delete Task
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* =========================
                ADD TASK MODAL
            ========================== */}

            {showAddModal && (
                <TaskModal
                    title="Assign Task"
                    description="Create and assign a new task to an employee."
                    form={taskForm}
                    employees={employees}
                    isSubmitting={isCreating}
                    onChange={handleFormChange}
                    onClose={() =>
                        setShowAddModal(false)
                    }
                    onSubmit={
                        handleCreateTask
                    }
                    submitText="Assign Task"
                    submittingText="Assigning..."
                    isEdit={false}
                />
            )}

            {/* =========================
                EDIT TASK MODAL
            ========================== */}

            {showEditModal && (
                <TaskModal
                    title="Edit Task"
                    description="Update task information and progress."
                    form={taskForm}
                    employees={employees}
                    isSubmitting={isUpdating}
                    onChange={handleFormChange}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedTask(null);
                    }}
                    onSubmit={
                        handleUpdateTask
                    }
                    submitText="Save Changes"
                    submittingText="Saving..."
                    isEdit={true}
                />
            )}

            {/* =========================
                DELETE CONFIRMATION
            ========================== */}

            {taskToDelete && (
                <DeleteModal
                    task={taskToDelete}
                    isDeleting={isDeleting}
                    onClose={() =>
                        setTaskToDelete(null)
                    }
                    onConfirm={
                        handleDeleteTask
                    }
                    getEmployeeName={
                        getEmployeeName
                    }
                />
            )}

            {/* =========================
                TOAST
            ========================== */}

            <Toast
                toast={toast}
                onClose={closeToast}
            />

        </div>
    );
}

// ==================================================
// SUMMARY CARD
// ==================================================

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
                    <i
                        className={`${icon} text-lg`}
                    />
                </div>

            </div>

        </div>
    );
}

// ==================================================
// SELECT FIELD
// ==================================================

function SelectField({
    label,
    value,
    onChange,
    placeholder,
    options
}) {
    return (
        <div>

            <label className="block text-xs font-medium text-gray-500 mb-2">
                {label}
            </label>

            <div className="relative">

                <select
                    value={value}
                    onChange={onChange}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 pr-9 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >

                    <option value="">
                        {placeholder}
                    </option>

                    {options.map(
                        (option) => (
                            <option
                                key={
                                    option.value
                                }
                                value={
                                    option.value
                                }
                            >
                                {
                                    option.label
                                }
                            </option>
                        )
                    )}

                </select>

                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />

            </div>

        </div>
    );
}

// ==================================================
// EMPLOYEE AVATAR
// ==================================================

function EmployeeAvatar({ task }) {
    return (
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
            {getInitialsFromTask(
                task
            )}
        </div>
    );
}

function getInitialsFromTask(task) {
    const employee =
        task?.employeeId &&
        typeof task.employeeId ===
            "object"
            ? task.employeeId
            : null;

    if (!employee) {
        return "NA";
    }

    const first =
        employee.firstName?.charAt(0) || "";

    const last =
        employee.lastName?.charAt(0) || "";

    return `${first}${last}`.toUpperCase();
}

// ==================================================
// ACTION BUTTON
// ==================================================

function ActionButton({
    icon,
    title,
    className,
    onClick
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0 ${className}`}
        >
            <i className={`${icon} text-xs`} />
        </button>
    );
}

// ==================================================
// INFO ROW
// ==================================================

function InfoRow({
    label,
    value
}) {
    return (
        <div className="flex items-center justify-between gap-4">

            <span className="text-sm text-gray-500">
                {label}
            </span>

            <span className="text-sm font-medium text-gray-800 text-right">
                {value}
            </span>

        </div>
    );
}

// ==================================================
// TASK MODAL
// ==================================================

function TaskModal({
    title,
    description,
    form,
    employees,
    isSubmitting,
    onChange,
    onClose,
    onSubmit,
    submitText,
    submittingText,
    isEdit
}) {
    return (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">

                {/* HEADER */}

                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            {description}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={
                            isSubmitting
                        }
                        className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        title="Close"
                    >
                        <i className="fas fa-times" />
                    </button>

                </div>

                {/* BODY */}

                <form
                    onSubmit={onSubmit}
                >

                    <div className="px-6 py-6 max-h-[65vh] overflow-y-auto">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* EMPLOYEE */}

                            <div className="md:col-span-2">

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assigned Employee
                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <div className="relative">

                                    <select
                                        name="employeeId"
                                        value={
                                            form.employeeId
                                        }
                                        onChange={
                                            onChange
                                        }
                                        disabled={
                                            isEdit ||
                                            isSubmitting
                                        }
                                        required
                                        className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    >

                                        <option value="">
                                            Select employee
                                        </option>

                                        {employees.map(
                                            (
                                                employee
                                            ) => (
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

                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

                                </div>

                            </div>

                            {/* TITLE */}

                            <div className="md:col-span-2">

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Task Title
                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={
                                        form.title
                                    }
                                    onChange={
                                        onChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    required
                                    placeholder="Enter task title"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>

                            {/* PRIORITY */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority
                                </label>

                                <div className="relative">

                                    <select
                                        name="priority"
                                        value={
                                            form.priority
                                        }
                                        onChange={
                                            onChange
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >

                                        <option value="Low">
                                            Low
                                        </option>

                                        <option value="Medium">
                                            Medium
                                        </option>

                                        <option value="High">
                                            High
                                        </option>

                                    </select>

                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

                                </div>

                            </div>

                            {/* DUE DATE */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Due Date
                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="date"
                                    name="dueDate"
                                    value={
                                        form.dueDate
                                    }
                                    onChange={
                                        onChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>

                            {/* DESCRIPTION */}

                            <div
                                className="md:col-span-2"
                            >

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={
                                        form.description
                                    }
                                    onChange={
                                        onChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    rows="5"
                                    placeholder="Enter task description"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>

                        </div>

                    </div>

                    {/* FOOTER */}

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={
                                isSubmitting
                            }
                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                isSubmitting
                            }
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition"
                        >

                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" />
                                    {submittingText}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check" />
                                    {submitText}
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

// ==================================================
// DELETE MODAL
// ==================================================

function DeleteModal({
    task,
    isDeleting,
    onClose,
    onConfirm,
    getEmployeeName
}) {
    return (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">

                <div className="p-6">

                    <div className="flex items-start gap-4">

                        <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-trash" />
                        </div>

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                Delete Task
                            </h2>

                            <p className="text-sm text-gray-500 mt-1 leading-5">
                                Are you sure you want to delete this task? This action will remove it from the active task list.
                            </p>

                        </div>

                    </div>

                    <div className="mt-5 bg-gray-50 border border-gray-100 rounded-lg p-4">

                        <p className="text-sm font-medium text-gray-900">
                            {task.title}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                            Assigned to{" "}
                            {getEmployeeName(
                                task
                            )}
                        </p>

                    </div>

                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={
                            isDeleting
                        }
                        className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={
                            isDeleting
                        }
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition"
                    >

                        {isDeleting ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash" />
                                Delete Task
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
}

// ==================================================
// TOAST
// ==================================================

function Toast({
    toast,
    onClose
}) {
    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer =
            setTimeout(() => {
                onClose();
            }, 3500);

        return () =>
            clearTimeout(timer);
    }, [
        toast,
        onClose
    ]);

    if (!toast) {
        return null;
    }

    const config =
        toast.type ===
        "success"
            ? {
                  icon:
                      "fas fa-check-circle",
                  className:
                      "border-green-100 bg-white text-gray-800",
                  iconClass:
                      "text-green-600",
                  title:
                      "Success"
              }
            : toast.type ===
              "info"
            ? {
                  icon:
                      "fas fa-info-circle",
                  className:
                      "border-blue-100 bg-white text-gray-800",
                  iconClass:
                      "text-blue-600",
                  title:
                      "Information"
              }
            : {
                  icon:
                      "fas fa-exclamation-circle",
                  className:
                      "border-red-100 bg-white text-gray-800",
                  iconClass:
                      "text-red-600",
                  title:
                      "Something went wrong"
              };

    return (
        <div
            className="fixed top-5 right-5 z-[120] w-[360px] max-w-[calc(100vw-2rem)]"
            role={
                toast.type ===
                "error"
                    ? "alert"
                    : "status"
            }
        >

            <div
                className={`flex items-start gap-3 border rounded-xl shadow-xl px-4 py-3.5 ${config.className}`}
            >

                <i
                    className={`${config.icon} ${config.iconClass} mt-0.5 text-lg`}
                />

                <div className="flex-1 min-w-0">

                    <p className="text-sm font-semibold">
                        {config.title}
                    </p>

                    <p className="text-sm text-gray-500 mt-0.5">
                        {toast.message}
                    </p>

                </div>

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    className="w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    title="Close notification"
                >
                    <i className="fas fa-times text-xs" />
                </button>

            </div>

        </div>
    );
}

export default TaskManagement;