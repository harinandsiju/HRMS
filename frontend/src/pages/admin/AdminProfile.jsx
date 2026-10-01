import { useEffect, useState } from "react";

import api from "../../api/axios";

function AdminProfile() {
    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: ""
    });

    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ===============================
    // PROFILE IMAGE URL
    // ===============================

    const getProfileImageUrl = (imagePath) => {
        if (!imagePath) {
            return null;
        }

        // Cloudinary / external URL
        if (/^https?:\/\//i.test(imagePath)) {
            return `${imagePath}${
                imagePath.includes("?") ? "&" : "?"
            }t=${Date.now()}`;
        }

        // Older local upload path
        return `${api.defaults.baseURL}/${imagePath.replace(
            /^\/+/,
            ""
        )}?t=${Date.now()}`;
    };

    // ===============================
    // FETCH ADMIN PROFILE
    // ===============================

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/profile");

                const data = response.data.profile;

                setProfile(data);

                setFormData({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    phone: data.phone || ""
                });

                if (data.profileImage) {
                    setPreviewImage(
                        getProfileImageUrl(data.profileImage)
                    );
                }
            } catch (err) {
                console.error("Profile fetch error:", err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // ===============================
    // INPUT CHANGE
    // ===============================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ===============================
    // IMAGE CHANGE
    // ===============================

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setProfileImage(file);

        const imageUrl = URL.createObjectURL(file);

        setPreviewImage(imageUrl);
    };

    // ===============================
    // UPDATE PROFILE
    // ===============================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setSaving(true);

        try {
            const data = new FormData();

            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            data.append("phone", formData.phone);

            if (profileImage) {
                data.append("profileImage", profileImage);
            }

            const response = await api.put("/profile", data);

            const updatedProfile = response.data.profile;

            setProfile(updatedProfile);

            setFormData({
                firstName: updatedProfile.firstName || "",
                lastName: updatedProfile.lastName || "",
                phone: updatedProfile.phone || ""
            });

            if (updatedProfile.profileImage) {
                setPreviewImage(
                    getProfileImageUrl(
                        updatedProfile.profileImage
                    )
                );
            }

            setProfileImage(null);

            setMessage(
                response.data.message ||
                "Profile updated successfully."
            );
        } catch (err) {
            console.error("Profile update error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    // ===============================
    // LOADING
    // ===============================

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-500">
                    Loading profile...
                </p>
            </div>
        );
    }

    // ===============================
    // ERROR
    // ===============================

    if (!profile && error) {
        return (
            <div className="bg-white rounded-xl border border-red-200 p-6">
                <p className="text-sm text-red-600">
                    {error}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Page Header */}

            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    My Profile
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    Manage your administrator profile information.
                </p>
            </div>

            {/* Success Message */}

            {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-green-700">
                        {message}
                    </p>
                </div>
            )}

            {/* Error Message */}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-red-700">
                        {error}
                    </p>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >

                {/* Profile Header */}

                <div className="bg-gray-900 px-6 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                        {/* Profile Image */}

                        <div className="relative">

                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 border-4 border-white/20 flex items-center justify-center">

                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Admin profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-white">
                                        {formData.firstName
                                            ?.charAt(0)
                                            ?.toUpperCase() || "A"}
                                    </span>
                                )}

                            </div>

                            <label
                                htmlFor="profileImage"
                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center cursor-pointer border-2 border-gray-900 hover:bg-indigo-700 transition"
                                title="Change profile picture"
                            >
                                +
                            </label>

                            <input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                        </div>

                        {/* Profile Information */}

                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                {formData.firstName ||
                                formData.lastName
                                    ? `${formData.firstName} ${formData.lastName}`.trim()
                                    : "Administrator"}
                            </h2>

                            <p className="text-sm text-gray-300 mt-1">
                                {profile.email}
                            </p>

                            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-medium">
                                {profile.role}
                            </span>
                        </div>

                    </div>
                </div>

                {/* Form */}

                <div className="p-6 space-y-6">

                    {/* Personal Information */}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-4">
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* First Name */}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Last Name */}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Phone */}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Phone
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Account Information */}

                    <div className="border-t border-gray-100 pt-6">

                        <h3 className="text-sm font-semibold text-gray-800 mb-4">
                            Account Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Email */}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                                />

                                <p className="text-[11px] text-gray-400 mt-1">
                                    Email cannot be changed here.
                                </p>
                            </div>

                            {/* Role */}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Role
                                </label>

                                <input
                                    type="text"
                                    value={profile.role}
                                    disabled
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                                />

                                <p className="text-[11px] text-gray-400 mt-1">
                                    Role is controlled by the system.
                                </p>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Footer */}

                <div className="border-t border-gray-100 px-6 py-4 flex justify-end">

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                </div>

            </form>
        </div>
    );
}

export default AdminProfile;