import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../../api/axios";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#3b82f6", "#ec4899", "#94a3b8"];

function AdminDashboard() {
    const [summary, setSummary] = useState(null);
    const [attendanceOverview, setAttendanceOverview] = useState([]);
    const [departmentDist, setDepartmentDist] = useState([]);
    const [activities, setActivities] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [totalDepartments, setTotalDepartments] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 6);

                const startDate = sevenDaysAgo.toISOString().split("T")[0];
                const endDate = today.toISOString().split("T")[0];

                const [
                    summaryRes,
                    attendanceRes,
                    deptRes,
                    activityRes,
                    holidayRes,
                    taskRes,
                    deptListRes
                ] = await Promise.all([
                    api.get("/reports/dashboard-summary"),
                    api.get(`/reports/attendance-overview?startDate=${startDate}&endDate=${endDate}`),
                    api.get("/reports/department-distribution"),
                    api.get("/activity-logs?limit=5"),
                    api.get("/holidays/upcoming?limit=4"),
                    api.get("/task?status=Pending&limit=5"),
                    api.get("/departments")
                ]);

                setSummary(summaryRes.data);
                setAttendanceOverview(attendanceRes.data.overview);
                setDepartmentDist(deptRes.data.distribution);
                setActivities(activityRes.data.logs);
                setHolidays(holidayRes.data.holidays);
                setPendingTasks(taskRes.data.tasks);
                setTotalDepartments(deptListRes.data.count);

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <p className="text-gray-500">Loading dashboard...</p>;
    }

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Employees" value={summary.totalEmployees} color="indigo" />
                <StatCard label="Attendance Rate" value={`${summary.attendanceRate}%`} color="green" />
                <StatCard label="Pending Leave Requests" value={summary.pendingLeaveRequests} color="orange" />
                <StatCard label="Departments" value={totalDepartments} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Attendance Overview Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">Attendance Overview (Last 7 Days)</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={attendanceOverview}>
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="attendanceRate" stroke="#6366f1" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Department Distribution Donut */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">Department-wise Employees</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={departmentDist}
                                dataKey="count"
                                nameKey="departmentName"
                                innerRadius={45}
                                outerRadius={70}
                            >
                                {departmentDist.map((entry, index) => (
                                    <Cell key={entry.departmentName} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1">
                        {departmentDist.map((d, index) => (
                            <div key={d.departmentName} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2 text-gray-600">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    {d.departmentName}
                                </span>
                                <span className="text-gray-800 font-medium">
                                    {d.count} ({d.percentage}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Activities */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">Recent Activities</h2>
                    <div className="space-y-3">
                        {activities.length === 0 && (
                            <p className="text-xs text-gray-400">No recent activity</p>
                        )}
                        {activities.map((log) => (
                            <div key={log._id} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                                <p className="font-medium text-gray-800">{log.action}</p>
                                <p className="text-gray-500">{log.description}</p>
                                <p className="text-gray-400 mt-0.5">
                                    {new Date(log.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Holidays */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">Upcoming Holidays</h2>
                    <div className="space-y-3">
                        {holidays.length === 0 && (
                            <p className="text-xs text-gray-400">No upcoming holidays</p>
                        )}
                        {holidays.map((h) => (
                            <div key={h._id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center text-[10px] font-semibold">
                                    <span>{new Date(h.date).toLocaleString("default", { month: "short" }).toUpperCase()}</span>
                                    <span className="text-sm">{new Date(h.date).getDate()}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{h.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(h.date).toLocaleDateString("default", { weekday: "long" })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">Pending Tasks</h2>
                    <div className="space-y-3">
                        {pendingTasks.length === 0 && (
                            <p className="text-xs text-gray-400">No pending tasks</p>
                        )}
                        {pendingTasks.map((task) => (
                            <div key={task._id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{task.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    task.priority === "High"
                                        ? "bg-red-50 text-red-600"
                                        : task.priority === "Medium"
                                        ? "bg-orange-50 text-orange-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}>
                                    {task.priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colorMap = {
        indigo: "bg-indigo-50 text-indigo-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-orange-50 text-orange-600",
        blue: "bg-blue-50 text-blue-600"
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
                ●
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    );
}

export default AdminDashboard;