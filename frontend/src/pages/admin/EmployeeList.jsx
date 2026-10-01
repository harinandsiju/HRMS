import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 10
            });

            if (search) params.append("search", search);
            if (status) params.append("status", status);

            const res = await api.get(`/employees?${params.toString()}`);

            setEmployees(res.data.employees);
            setTotalPages(res.data.pagination.totalPages);
            setTotalEmployees(res.data.pagination.totalEmployees);

        } catch (error) {
            console.error("Fetch employees error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, status]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchEmployees();
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this employee?")) return;

        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete employee");
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                    <p className="text-sm text-gray-500">
                        <span className="text-indigo-600">Dashboard</span> {">"} Employees
                    </p>
                </div>
                <button
                    onClick={() => navigate("/admin/employees/add")}
                    className="bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-indigo-700"
                >
                    + Add Employee
                </button>
            </div>

            {/* Search + Filters */}
            <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search employees by name, email or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>

                <button
                    type="submit"
                    className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                    Search
                </button>
            </form>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="text-left px-4 py-3">Employee</th>
                            <th className="text-left px-4 py-3">Employee ID</th>
                            <th className="text-left px-4 py-3">Designation</th>
                            <th className="text-left px-4 py-3">Join Date</th>
                            <th className="text-left px-4 py-3">Status</th>
                            <th className="text-left px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        )}

                        {!loading && employees.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-400">
                                    No employees found
                                </td>
                            </tr>
                        )}

                        {!loading && employees.map((emp) => (
                            <tr key={emp._id} className="border-t border-gray-100">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
    {emp.profileImage ? (
        <img
            src={`http://localhost:5000/${emp.profileImage.replace(/^\/+/, "")}`}
            alt={`${emp.firstName} ${emp.lastName}`}
            className="w-full h-full object-cover"
        />
    ) : (
        <>
            {emp.firstName?.[0]}
            {emp.lastName?.[0]}
        </>
    )}
</div>
                                        <div>
                                            <p className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-xs text-gray-500">{emp.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{emp.employeeCode}</td>
                                <td className="px-4 py-3 text-gray-600">{emp.designation || "—"}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        emp.status === "Active"
                                            ? "bg-green-50 text-green-600"
                                            : "bg-red-50 text-red-600"
                                    }`}>
                                        {emp.status || "Active"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/employees/${emp._id}`)}
                                            className="text-gray-500 hover:text-indigo-600 text-xs border border-gray-200 rounded px-2 py-1"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/employees/${emp._id}/edit`)}
                                            className="text-indigo-500 hover:text-indigo-700 text-xs border border-indigo-200 rounded px-2 py-1"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp._id)}
                                            className="text-red-500 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-1"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <p>Showing page {page} of {totalPages} ({totalEmployees} employees)</p>
                <div className="flex gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>

        </div>
    );
}

export default EmployeeList;