import { useEffect, useState } from "react";
import api from "../../api/axios";

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/task/my-tasks");

            setTasks(response.data.tasks || []);
        } catch (err) {
            console.error("Fetch My Tasks Error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load your tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            setUpdatingTaskId(taskId);
            setError("");

            await api.patch(
                `/task/${taskId}/status`,
                {
                    status: newStatus
                }
            );

            await fetchTasks();
        } catch (err) {
            console.error("Update Task Status Error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to update task status."
            );
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const filteredTasks = tasks.filter((task) => {
        const matchesStatus =
            !statusFilter ||
            task.status === statusFilter;

        const matchesPriority =
            !priorityFilter ||
            task.priority === priorityFilter;

        return matchesStatus && matchesPriority;
    });

    const getStatusClasses = (status) => {
        switch (status) {
            case "Completed":
                return "bg-green-50 text-green-700";

            case "In Progress":
                return "bg-blue-50 text-blue-700";

            case "Pending":
                return "bg-yellow-50 text-yellow-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getPriorityClasses = (priority) => {
        switch (priority) {
            case "High":
                return "bg-red-50 text-red-700";

            case "Medium":
                return "bg-orange-50 text-orange-700";

            case "Low":
                return "bg-green-50 text-green-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const formatDate = (date) => {
        if (!date) return "No deadline";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const isOverdue = (task) => {
        if (!task.dueDate || task.status === "Completed") {
            return false;
        }

        return new Date(task.dueDate) < new Date();
    };

    if (loading) {
        return (
            <div className="min-h-full bg-gray-50 p-4 sm:p-6">
                <div className="animate-pulse space-y-6">

                    <div className="h-8 w-48 bg-gray-200 rounded-lg" />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="h-24 bg-white rounded-2xl" />
                        <div className="h-24 bg-white rounded-2xl" />
                        <div className="h-24 bg-white rounded-2xl" />
                    </div>

                    <div className="h-40 bg-white rounded-2xl" />
                    <div className="h-40 bg-white rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 p-4 sm:p-6">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    My Tasks
                </h1>

                <p className="mt-1.5 text-sm sm:text-base text-gray-500">
                    View and manage the tasks assigned to you.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center justify-between gap-4">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={fetchTasks}
                        className="font-medium underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Summary Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

                <SummaryCard
                    icon="fa-tasks"
                    title="Total Tasks"
                    value={tasks.length}
                />

                <SummaryCard
                    icon="fa-spinner"
                    title="In Progress"
                    value={
                        tasks.filter(
                            (task) =>
                                task.status === "In Progress"
                        ).length
                    }
                />

                <SummaryCard
                    icon="fa-check-circle"
                    title="Completed"
                    value={
                        tasks.filter(
                            (task) =>
                                task.status === "Completed"
                        ).length
                    }
                />
            </div>

            {/* Filters */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">

<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <i className="fas fa-filter text-violet-600" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900">
            Filters
        </h2>
    </div>

    {(statusFilter || priorityFilter) && (
        <button
            type="button"
            onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
        >
            <i className="fas fa-times mr-2" />
            Clear Filters
        </button>
    )}
</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Status
                        </label>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                        >
                            <option value="">
                                All Statuses
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Completed">
                                Completed
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Priority
                        </label>

                        <select
                            value={priorityFilter}
                            onChange={(e) =>
                                setPriorityFilter(e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                        >
                            <option value="">
                                All Priorities
                            </option>

                            <option value="High">
                                High
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="Low">
                                Low
                            </option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Tasks */}
            {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">

                    <div className="w-14 h-14 mx-auto rounded-full bg-violet-50 flex items-center justify-center">
                        <i className="fas fa-clipboard-list text-violet-600 text-xl" />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-gray-900">
                        No tasks found
                    </h2>

                    <p className="mt-1.5 text-sm text-gray-500">
                        {tasks.length === 0
                            ? "You currently have no tasks assigned to you."
                            : "No tasks match the selected filters."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">

                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            updatingTaskId={updatingTaskId}
                            updateTaskStatus={updateTaskStatus}
                            getStatusClasses={getStatusClasses}
                            getPriorityClasses={getPriorityClasses}
                            formatDate={formatDate}
                            isOverdue={isOverdue}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon, title, value }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${icon} text-violet-600`} />
                </div>

                <div>
                    <p className="text-sm text-gray-500">
                        {title}
                    </p>

                    <p className="text-2xl font-bold text-gray-900 mt-0.5">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function TaskCard({
    task,
    updatingTaskId,
    updateTaskStatus,
    getStatusClasses,
    getPriorityClasses,
    formatDate,
    isOverdue
}) {
    const updating =
        updatingTaskId === task._id;

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">

            {/* Top */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                <div className="min-w-0">

                    <h2 className="text-lg font-semibold text-gray-900 break-words">
                        {task.title || "Untitled Task"}
                    </h2>

                    {task.description && (
                        <p className="mt-2 text-sm text-gray-500 leading-6">
                            {task.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-4">

                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                                task.status
                            )}`}
                        >
                            {task.status === "Pending"
                                ? "To Do"
                                : task.status}
                        </span>

                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityClasses(
                                task.priority
                            )}`}
                        >
                            {task.priority || "No Priority"}
                        </span>

                        {isOverdue(task) && (
                            <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                                Overdue
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Control */}
                <div className="w-full lg:w-48 flex-shrink-0">

                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Update Status
                    </label>

                    <select
                        value={task.status || "Pending"}
                        disabled={updating}
                        onChange={(e) =>
                            updateTaskStatus(
                                task._id,
                                e.target.value
                            )
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                        <option value="Pending">
                            To Do
                        </option>

                        <option value="In Progress">
                            In Progress
                        </option>

                        <option value="Completed">
                            Completed
                        </option>
                    </select>

                    {updating && (
                        <p className="text-xs text-violet-600 mt-1.5">
                            Updating...
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Details */}
            <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <TaskDetail
                    icon="fa-calendar-alt"
                    label="Due Date"
                    value={formatDate(task.dueDate)}
                    danger={isOverdue(task)}
                />

                <TaskDetail
                    icon="fa-flag"
                    label="Priority"
                    value={task.priority || "Not specified"}
                />

                <TaskDetail
                    icon="fa-clock"
                    label="Created"
                    value={formatDate(task.createdAt)}
                />
            </div>
        </section>
    );
}

function TaskDetail({
    icon,
    label,
    value,
    danger = false
}) {
    return (
        <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <i
                    className={`fas ${icon} ${
                        danger
                            ? "text-red-500"
                            : "text-gray-500"
                    }`}
                />
            </div>

            <div className="min-w-0">
                <p className="text-xs text-gray-400">
                    {label}
                </p>

                <p
                    className={`text-sm font-medium ${
                        danger
                            ? "text-red-600"
                            : "text-gray-700"
                    }`}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

export default MyTasks;