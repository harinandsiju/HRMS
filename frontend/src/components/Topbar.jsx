import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import api from "../api/axios";

function Topbar() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/profile");
                setProfile(response.data.profile);
            } catch (error) {
                console.error("Topbar profile fetch error:", error);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleProfileClick = () => {
        if (user?.role === "Admin") {
            navigate("/admin/profile");
        } else if (user?.role === "Employee") {
            navigate("/employee/profile");
        }
    };

    // =========================
    // SEARCH
    // =========================

    const handleSearch = (event) => {
        event.preventDefault();

        const query = search.trim().toLowerCase();

        if (!query) {
            return;
        }

        const searchItems = [
            {
                keywords: [
                    "dashboard",
                    "home",
                    "employee dashboard"
                ],
                path: "/employee/dashboard"
            },
            {
                keywords: [
                    "profile",
                    "my profile",
                    "employee profile"
                ],
                path: "/employee/profile"
            },
            {
                keywords: [
                    "task",
                    "tasks",
                    "my tasks",
                    "employee tasks"
                ],
                path: "/employee/tasks"
            },
            {
                keywords: [
                    "leave",
                    "leaves",
                    "my leave",
                    "my leaves",
                    "employee leave"
                ],
                path: "/employee/leave"
            },
            {
                keywords: [
                    "document",
                    "documents",
                    "my documents",
                    "employee documents"
                ],
                path: "/employee/documents"
            },
            {
                keywords: [
                    "performance",
                    "my performance",
                    "employee performance"
                ],
                path: "/employee/performance"
            },
            {
                keywords: [
                    "notification",
                    "notifications",
                    "my notifications",
                    "employee notifications"
                ],
                path: "/employee/notifications"
            }
        ];

        const result = searchItems.find((item) =>
            item.keywords.some(
                (keyword) =>
                    keyword === query ||
                    keyword.includes(query) ||
                    query.includes(keyword)
            )
        );

        if (result) {
            navigate(result.path);
            setSearch("");
        } else {
            alert("No matching page found.");
        }
    };

    // =========================
    // PROFILE IMAGE
    // =========================

    const getProfileImage = () => {
        if (!profile?.profileImage) {
            return null;
        }

        // Cloudinary / external image URL
        if (/^https?:\/\//i.test(profile.profileImage)) {
            return `${profile.profileImage}${
                profile.profileImage.includes("?") ? "&" : "?"
            }t=${Date.now()}`;
        }

        // Older local/upload path
        return `${api.defaults.baseURL}/${profile.profileImage.replace(
            /^\/+/,
            ""
        )}?t=${Date.now()}`;
    };

    const profileImage = getProfileImage();

    const displayName =
        profile?.firstName || profile?.lastName
            ? `${profile?.firstName || ""} ${
                  profile?.lastName || ""
              }`.trim()
            : user?.email;

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">

            {/* =========================
                SEARCH
            ========================== */}

            <div className="flex-1 max-w-md">
                <form onSubmit={handleSearch}>
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>

                        <input
                            type="text"
                            placeholder="Search pages..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </form>
            </div>

            {/* =========================
                RIGHT SIDE
            ========================== */}

            <div className="flex items-center gap-4">

                {/* Profile */}

                <button
                    type="button"
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition cursor-pointer"
                    title="Open profile"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-800">
                            {displayName}
                        </p>

                        <p className="text-xs text-gray-500">
                            {user?.role}
                        </p>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold overflow-hidden">
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            profile?.firstName?.[0]?.toUpperCase() ||
                            user?.email?.[0]?.toUpperCase()
                        )}
                    </div>
                </button>
            </div>
        </header>
    );
}

export default Topbar;