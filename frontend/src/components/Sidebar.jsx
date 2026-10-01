import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/employees", label: "Employees" },
    { to: "/admin/departments", label: "Departments" },
    { to: "/admin/attendance", label: "Attendance" },
    { to: "/admin/leave", label: "Leave Management" },
    { to: "/admin/payroll", label: "Payroll" },
    { to: "/admin/tasks", label: "Tasks" },
    { to: "/admin/performance", label: "Performance" },
    { to: "/admin/reports", label: "Reports" },
    { to: "/admin/documents", label: "Documents" },
    { to: "/admin/notifications", label: "Notifications" },
    { to: "/admin/activity-logs", label: "Activity Log" },
    { to: "/admin/settings", label: "Settings" }
];

const employeeLinks = [
    { to: "/employee/dashboard", label: "Dashboard" },
    { to: "/employee/profile", label: "My Profile" },
    { to: "/employee/tasks", label: "My Tasks" },
    { to: "/employee/attendance", label: "My Attendance" },
    { to: "/employee/leave", label: "My Leave" },
    { to: "/employee/documents", label: "My Documents" },
    { to: "/employee/performance", label: "My Performance" },
    { to: "/employee/notifications", label: "Notifications" }
];

function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [companyLogo, setCompanyLogo] = useState("");

    const links =
        user?.role === "Admin"
            ? adminLinks
            : employeeLinks;

    useEffect(() => {
        const fetchCompanyLogo = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) return;

                const response = await fetch(
                    "https://hrms-qxao.onrender.com/company-branding",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (!response.ok) {
                    console.error(
                        "Failed to fetch company settings"
                    );
                    return;
                }

const data = await response.json();

if (data.companyLogo) {
    setCompanyLogo(
       `https://hrms-qxao.onrender.com/${data.companyLogo}`
    );
}
            } catch (error) {
                console.error(
                    "Fetch Company Logo Error:",
                    error
                );
            }
        };

        fetchCompanyLogo();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">

            {/* Brand Header */}
            <div className="h-24 px-5 border-b border-gray-200 bg-white flex items-center">
                <div className="flex items-center gap-3 w-full">

                    {/* Circular Logo */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-gray-700 flex-shrink-0 flex items-center justify-center">
                        {companyLogo ? (
                            <img
                                src={companyLogo}
                                alt="TechNova Logo"
                                className="w-[240%] h-[140%] max-w-none object-cover object-center"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                                <span className="text-black font-black text-sm">
                                    N
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Company Name */}
                    <div className="min-w-0">
                        <h1
                            className="text-black text-xl font-black tracking-tight leading-none"
                            style={{
                                fontFamily:
                                    "Arial, Helvetica, sans-serif",
                                letterSpacing: "-0.8px"
                            }}
                        >
                            TechNova
                        </h1>

                        <p className="text-gray-400 text-[9px] mt-1 tracking-[1.2px] uppercase">
                            Solutions Pvt. Ltd.
                        </p>
                    </div>

                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;