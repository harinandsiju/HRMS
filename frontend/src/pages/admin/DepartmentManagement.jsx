import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";

function DepartmentManagement() {
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [managerFilter, setManagerFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Pagination
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Toast
    const [toast, setToast] = useState({
        show: false,
        type: "success",
        message: ""
    });

    const toastTimer = useRef(null);

    const showToast = (message, type = "success") => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }

        setToast({
            show: true,
            type,
            message
        });

        toastTimer.current = setTimeout(() => {
            setToast({
                show: false,
                type: "success",
                message: ""
            });
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (toastTimer.current) {
                clearTimeout(toastTimer.current);
            }
        };
    }, []);

    // Add Department Modal
    const [showAddModal, setShowAddModal] = useState(false);

    const [departmentName, setDepartmentName] = useState("");
    const [departmentHead, setDepartmentHead] = useState("");
    const [departmentDescription, setDepartmentDescription] = useState("");
    const [departmentStatus, setDepartmentStatus] = useState("Active");
    const [isAddingDepartment, setIsAddingDepartment] = useState(false);

    // Edit Department Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [isUpdatingDepartment, setIsUpdatingDepartment] = useState(false);

    // Delete Department Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [isDeletingDepartment, setIsDeletingDepartment] = useState(false);

    // Fetch Departments
    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/departments");

            setDepartments(response.data.departments || []);
        } catch (error) {
            console.error("Failed to fetch departments:", error);
            setError(
                error.response?.data?.message ||
                "Failed to load departments."
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch Employees
    const fetchEmployees = async () => {
        try {
            const response = await api.get("/employees");

            setEmployees(response.data.employees || []);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchEmployees();
    }, []);

    // Reset form
    const resetDepartmentFields = () => {
        setDepartmentName("");
        setDepartmentHead("");
        setDepartmentDescription("");
        setDepartmentStatus("Active");
    };

    // Add Department
    const handleAddDepartment = async () => {
        if (!departmentName.trim()) {
            showToast("Department name is required.", "error");
            return;
        }

        try {
            setIsAddingDepartment(true);

            const response = await api.post("/departments", {
                name: departmentName.trim(),
                managerId: departmentHead || null,
                description: departmentDescription.trim(),
                status: departmentStatus
            });

            resetDepartmentFields();
            setShowAddModal(false);

            await fetchDepartments();

            showToast(
                response.data.message || "Department added successfully.",
                "success"
            );
        } catch (error) {
            console.error("Failed to add department:", error);

            showToast(
                error.response?.data?.message ||
                "Failed to add department.",
                "error"
            );
        } finally {
            setIsAddingDepartment(false);
        }
    };

    // Edit Department
    const handleEditClick = (department) => {
        setEditingDepartment(department);

        setDepartmentName(department.name || "");

        setDepartmentHead(
            department.managerId?._id ||
            department.managerId ||
            ""
        );

        setDepartmentDescription(
            department.description || ""
        );

        setDepartmentStatus(
            department.status || "Active"
        );

        setShowEditModal(true);
    };

    // Update Department
    const handleUpdateDepartment = async () => {
        if (!departmentName.trim()) {
            showToast("Department name is required.", "error");
            return;
        }

        if (!editingDepartment) {
            return;
        }

        try {
            setIsUpdatingDepartment(true);

            const response = await api.put(
                `/departments/${editingDepartment._id}`,
                {
                    name: departmentName.trim(),
                    managerId: departmentHead || null,
                    description: departmentDescription.trim(),
                    status: departmentStatus
                }
            );

            resetDepartmentFields();
            setEditingDepartment(null);
            setShowEditModal(false);

            await fetchDepartments();

            showToast(
                response.data.message ||
                "Department updated successfully.",
                "success"
            );
        } catch (error) {
            console.error("Failed to update department:", error);

            showToast(
                error.response?.data?.message ||
                "Failed to update department.",
                "error"
            );
        } finally {
            setIsUpdatingDepartment(false);
        }
    };

    // Open Delete Modal
    const handleDeleteClick = (department) => {
        setDepartmentToDelete(department);
        setShowDeleteModal(true);
    };

    // Confirm Delete
    const confirmDeleteDepartment = async () => {
        if (!departmentToDelete) {
            return;
        }

        try {
            setIsDeletingDepartment(true);

            const response = await api.delete(
                `/departments/${departmentToDelete._id}`
            );

            setShowDeleteModal(false);
            setDepartmentToDelete(null);

            await fetchDepartments();

            showToast(
                response.data.message ||
                "Department deleted successfully.",
                "success"
            );
        } catch (error) {
            console.error("Failed to delete department:", error);

            showToast(
                error.response?.data?.message ||
                "Failed to delete department.",
                "error"
            );
        } finally {
            setIsDeletingDepartment(false);
        }
    };

    // Close Edit Modal
    const closeEditModal = () => {
        if (isUpdatingDepartment) {
            return;
        }

        setShowEditModal(false);
        setEditingDepartment(null);

        resetDepartmentFields();
    };

    // Close Delete Modal
    const closeDeleteModal = () => {
        if (isDeletingDepartment) {
            return;
        }

        setShowDeleteModal(false);
        setDepartmentToDelete(null);
    };

    // Summary Cards
    const totalDepartments = departments.length;

    const activeDepartments = departments.filter(
        (department) => department.status === "Active"
    ).length;

    const departmentHeads = departments.filter(
        (department) => department.managerId
    ).length;

    const totalEmployees = departments.reduce(
        (total, department) =>
            total + (department.employeeCount || 0),
        0
    );

    // Employees belonging to department being edited
    const editDepartmentEmployees = employees.filter((employee) => {
        if (!editingDepartment) {
            return false;
        }

        const employeeDepartmentId =
            typeof employee.departmentId === "object"
                ? employee.departmentId?._id
                : employee.departmentId;

        return (
            employeeDepartmentId === editingDepartment._id ||
            employee._id === departmentHead
        );
    });

    // Actual Department Heads
    const departmentHeadEmployees = departments
        .map((department) => {
            if (!department.managerId) {
                return null;
            }

            if (typeof department.managerId === "object") {
                return department.managerId;
            }

            return employees.find(
                (employee) =>
                    employee._id === department.managerId
            );
        })
        .filter(Boolean)
        .filter(
            (employee, index, array) =>
                array.findIndex(
                    (item) => item._id === employee._id
                ) === index
        );

    // Filtering
    const filteredDepartments = departments.filter(
        (department) => {
            const departmentName =
                department.name?.toLowerCase() || "";

            const searchValue =
                search.trim().toLowerCase();

            const managerId =
                typeof department.managerId === "object"
                    ? department.managerId?._id
                    : department.managerId;

            const matchesSearch =
                departmentName.includes(searchValue);

            const matchesManager =
                !managerFilter ||
                managerId === managerFilter;

            const matchesStatus =
                !statusFilter ||
                department.status === statusFilter;

            return (
                matchesSearch &&
                matchesManager &&
                matchesStatus
            );
        }
    );

    // Pagination
    const totalPages = Math.ceil(
        filteredDepartments.length / ITEMS_PER_PAGE
    );

    const startIndex =
        (currentPage - 1) * ITEMS_PER_PAGE;

    const paginatedDepartments =
        filteredDepartments.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, managerFilter, statusFilter]);

    useEffect(() => {
        if (
            totalPages > 0 &&
            currentPage > totalPages
        ) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const clearFilters = () => {
        setSearch("");
        setManagerFilter("");
        setStatusFilter("");
        setCurrentPage(1);
    };

    const hasFilters =
        search ||
        managerFilter ||
        statusFilter;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-500">
                    Loading departments...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">

            {/* Toast */}
            {toast.show && (
                <div
                    className={`fixed top-6 right-6 z-[100] min-w-[300px] max-w-[420px] rounded-xl border px-4 py-3 shadow-lg ${
                        toast.type === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-800"
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-lg">
                            {toast.type === "success"
                                ? "✓"
                                : "!"
                            }
                        </div>

                        <div className="flex-1">
                            <p className="font-medium">
                                {toast.message}
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                setToast({
                                    show: false,
                                    type: "success",
                                    message: ""
                                })
                            }
                            className="text-lg opacity-60 hover:opacity-100"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>Dashboard</span>
                        <span>→</span>
                        <span className="text-gray-800">
                            Departments
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Department Management
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage departments, department heads and employee assignments.
                    </p>
                </div>

                <button
                    onClick={() => {
                        resetDepartmentFields();
                        setShowAddModal(true);
                    }}
                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                    + Add Department
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Total Departments
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {totalDepartments}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Active Departments
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {activeDepartments}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Department Heads
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {departmentHeads}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Total Employees
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {totalEmployees}
                    </p>
                </div>

            </div>

            {/* Filters */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

                    {/* Search */}
                    <div className="flex-1">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Search Department
                        </label>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search department..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                        />
                    </div>

                    {/* Department Head */}
                    <div className="flex-1">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Department Head
                        </label>

                        <select
                            value={managerFilter}
                            onChange={(e) =>
                                setManagerFilter(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                        >
                            <option value="">
                                All Department Heads
                            </option>

                            {departmentHeadEmployees.map(
                                (employee) => (
                                    <option
                                        key={employee._id}
                                        value={employee._id}
                                    >
                                        {employee.firstName}{" "}
                                        {employee.lastName}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Status */}
                    <div className="flex-1">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Status
                        </label>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                        >
                            <option value="">
                                All Status
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>
                        </select>
                    </div>

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    )}

                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1000px] text-left">

                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Department
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Head
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Description
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Employees
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Created
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">

                            {paginatedDepartments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center"
                                    >
                                        <p className="text-sm font-medium text-gray-700">
                                            No departments found
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Try changing your filters.
                                        </p>

                                        {hasFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="mt-4 text-sm font-medium text-gray-900 underline"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedDepartments.map(
                                    (department) => (
                                        <tr
                                            key={department._id}
                                            className="hover:bg-gray-50"
                                        >

                                            {/* Department */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700">
                                                        {department.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() || "D"}
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {department.name}
                                                        </p>
                                                    </div>

                                                </div>
                                            </td>

                                            {/* Head */}
                                            <td className="px-5 py-4">
                                                {department.managerId ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {typeof department.managerId === "object"
                                                                ? `${department.managerId.firstName || ""} ${department.managerId.lastName || ""}`.trim()
                                                                : department.managerId}
                                                        </p>

                                                        {typeof department.managerId === "object" &&
                                                            department.managerId.employeeCode && (
                                                                <p className="text-xs text-gray-500">
                                                                    {department.managerId.employeeCode}
                                                                </p>
                                                            )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">
                                                        No Department Head
                                                    </span>
                                                )}
                                            </td>

                                            {/* Description */}
                                            <td className="max-w-[260px] px-5 py-4">
                                                <p className="truncate text-sm text-gray-600">
                                                    {department.description ||
                                                        "No description"}
                                                </p>
                                            </td>

                                            {/* Employees */}
                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                                                    {department.employeeCount || 0}
                                                </span>
                                            </td>

                                            {/* Created */}
                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {department.createdAt
                                                    ? new Date(
                                                        department.createdAt
                                                    ).toLocaleDateString()
                                                    : "-"}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        department.status === "Active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {department.status || "Inactive"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        onClick={() =>
                                                            handleEditClick(
                                                                department
                                                            )
                                                        }
                                                        disabled={
                                                            isDeletingDepartment
                                                        }
                                                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                department
                                                            )
                                                        }
                                                        disabled={
                                                            isDeletingDepartment
                                                        }
                                                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        Delete
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
                {filteredDepartments.length > 0 && (
                    <div className="flex items-center justify-between border-t px-5 py-4">

                        <p className="text-sm text-gray-500">
                            Showing{" "}
                            <span className="font-medium text-gray-800">
                                {startIndex + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium text-gray-800">
                                {Math.min(
                                    startIndex + ITEMS_PER_PAGE,
                                    filteredDepartments.length
                                )}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium text-gray-800">
                                {filteredDepartments.length}
                            </span>{" "}
                            departments
                        </p>

                        <div className="flex items-center gap-2">

                            <button
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            Math.max(
                                                page - 1,
                                                1
                                            )
                                    )
                                }
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                            >
                                Previous
                            </button>

                            <div className="flex items-center gap-1">

                                {Array.from(
                                    {
                                        length: totalPages
                                    },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() =>
                                            setCurrentPage(page)
                                        }
                                        className={`h-8 min-w-8 rounded-lg px-2 text-sm ${
                                            currentPage === page
                                                ? "bg-gray-900 text-white"
                                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                            </div>

                            <button
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            Math.min(
                                                page + 1,
                                                totalPages
                                            )
                                    )
                                }
                                disabled={
                                    currentPage === totalPages
                                }
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                            >
                                Next
                            </button>

                        </div>
                    </div>
                )}

            </div>

            {/* Add Department Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Add Department
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Create a new department.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    if (!isAddingDepartment) {
                                        setShowAddModal(false);
                                        resetDepartmentFields();
                                    }
                                }}
                                className="text-2xl text-gray-400 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 px-6 py-5">

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Department Name
                                </label>

                                <input
                                    type="text"
                                    value={departmentName}
                                    onChange={(e) =>
                                        setDepartmentName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter department name"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Department Head
                                </label>

                                <select
                                    value={departmentHead}
                                    onChange={(e) =>
                                        setDepartmentHead(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                >
                                    <option value="">
                                        No Department Head
                                    </option>
                                </select>

                                <p className="mt-1.5 text-xs text-gray-500">
                                    Assign a department head after adding employees to this department.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Description
                                </label>

                                <textarea
                                    value={departmentDescription}
                                    onChange={(e) =>
                                        setDepartmentDescription(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter department description"
                                    rows="4"
                                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Status
                                </label>

                                <select
                                    value={departmentStatus}
                                    onChange={(e) =>
                                        setDepartmentStatus(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                >
                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>
                            </div>

                        </div>

                        <div className="flex justify-end gap-3 border-t px-6 py-4">

                            <button
                                onClick={() => {
                                    if (!isAddingDepartment) {
                                        setShowAddModal(false);
                                        resetDepartmentFields();
                                    }
                                }}
                                disabled={isAddingDepartment}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleAddDepartment}
                                disabled={isAddingDepartment}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {isAddingDepartment
                                    ? "Adding..."
                                    : "Add Department"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* Edit Department Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b px-6 py-4">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Edit Department
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Update department information.
                                </p>
                            </div>

                            <button
                                onClick={closeEditModal}
                                disabled={isUpdatingDepartment}
                                className="text-2xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
                            >
                                ×
                            </button>

                        </div>

                        <div className="space-y-4 px-6 py-5">

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Department Name
                                </label>

                                <input
                                    type="text"
                                    value={departmentName}
                                    onChange={(e) =>
                                        setDepartmentName(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Department Head
                                </label>

                                <select
                                    value={departmentHead}
                                    onChange={(e) =>
                                        setDepartmentHead(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                >
                                    <option value="">
                                        No Department Head
                                    </option>

                                    {editDepartmentEmployees.map(
                                        (employee) => (
                                            <option
                                                key={employee._id}
                                                value={employee._id}
                                            >
                                                {employee.firstName}{" "}
                                                {employee.lastName}{" "}
                                                {employee.employeeCode
                                                    ? `(${employee.employeeCode})`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Description
                                </label>

                                <textarea
                                    value={departmentDescription}
                                    onChange={(e) =>
                                        setDepartmentDescription(
                                            e.target.value
                                        )
                                    }
                                    rows="4"
                                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Status
                                </label>

                                <select
                                    value={departmentStatus}
                                    onChange={(e) =>
                                        setDepartmentStatus(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                                >
                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>
                            </div>

                        </div>

                        <div className="flex justify-end gap-3 border-t px-6 py-4">

                            <button
                                onClick={closeEditModal}
                                disabled={isUpdatingDepartment}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleUpdateDepartment}
                                disabled={isUpdatingDepartment}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {isUpdatingDepartment
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && departmentToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                        <div className="px-6 pt-6">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
                                !
                            </div>

                            <h2 className="mt-4 text-lg font-semibold text-gray-900">
                                Delete Department?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                Are you sure you want to delete{" "}
                                <span className="font-semibold text-gray-900">
                                    {departmentToDelete.name}
                                </span>
                                ?
                            </p>

                            {departmentToDelete.employeeCount > 0 && (
                                <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                    This department currently has{" "}
                                    <span className="font-semibold">
                                        {departmentToDelete.employeeCount}
                                    </span>{" "}
                                    employee
                                    {departmentToDelete.employeeCount !== 1
                                        ? "s"
                                        : ""}{" "}
                                    assigned. The department cannot be deleted until those employees are reassigned.
                                </div>
                            )}

                        </div>

                        <div className="flex justify-end gap-3 px-6 py-5">

                            <button
                                onClick={closeDeleteModal}
                                disabled={isDeletingDepartment}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDeleteDepartment}
                                disabled={isDeletingDepartment}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeletingDepartment
                                    ? "Deleting..."
                                    : "Delete Department"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default DepartmentManagement;