import { useEffect, useState } from "react";
import api from "../../api/axios";

function EmployeeProfile() {
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/profile");

            const employeeProfile = response.data.profile;

            setProfile(employeeProfile);

            setFormData({
                firstName: employeeProfile.firstName || "",
                lastName: employeeProfile.lastName || "",
                phoneNumber: employeeProfile.phone || "",
                personalEmail: employeeProfile.personalEmail || "",
                alternatePhone: employeeProfile.alternatePhone || "",
                address: employeeProfile.address || ""
            });
        } catch (err) {
            console.error("Employee Profile Error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load profile"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setSelectedImage(file);
    };

    const handleEdit = () => {
        setSuccess("");
        setError("");
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            phoneNumber: profile.phone || "",
            personalEmail: profile.personalEmail || "",
            alternatePhone: profile.alternatePhone || "",
            address: profile.address || ""
        });

        setSelectedImage(null);
        setError("");
        setSuccess("");
        setIsEditing(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const data = new FormData();

            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            data.append("phone", formData.phoneNumber);
            data.append("personalEmail", formData.personalEmail);
            data.append("alternatePhone", formData.alternatePhone);
            data.append("address", formData.address);

            if (selectedImage) {
                data.append("profileImage", selectedImage);
            }

            const response = await api.put("/profile", data);

            const updatedProfile =
                response.data.profile ||
                response.data.user ||
                response.data;

            /*
             * Refresh the profile from the backend after saving.
             * This ensures we display the actual saved data.
             */
            const refreshed = await api.get("/profile");

            setProfile(refreshed.data.profile);

            const refreshedProfile = refreshed.data.profile;

            setFormData({
                firstName: refreshedProfile.firstName || "",
                lastName: refreshedProfile.lastName || "",
                phoneNumber: refreshedProfile.phone || "",
                personalEmail: refreshedProfile.personalEmail || "",
                alternatePhone:
                    refreshedProfile.alternatePhone || "",
                address: refreshedProfile.address || ""
            });

            setSelectedImage(null);
            setIsEditing(false);

            setSuccess(
                response.data.message ||
                    "Profile updated successfully."
            );
        } catch (err) {
            console.error("Update Employee Profile Error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to update profile"
            );
        } finally {
            setSaving(false);
        }
    };

    const getInitials = () => {
        if (!profile) return "E";

        const first =
            profile.firstName?.charAt(0) || "";

        const last =
            profile.lastName?.charAt(0) || "";

        return (
            `${first}${last}` ||
            profile.email?.charAt(0) ||
            "E"
        ).toUpperCase();
    };

    const getProfileImage = () => {
        if (!profile?.profileImage) return null;

        return `http://localhost:5000/${profile.profileImage}?t=${Date.now()}`;
    };

    const getSelectedImagePreview = () => {
        if (!selectedImage) return null;

        return URL.createObjectURL(selectedImage);
    };

const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not provided";
    }

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};


    if (loading) {
        return (
            <div className="min-h-full bg-gray-50 p-4 sm:p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg" />

                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center gap-5">
                            <div className="w-24 h-24 rounded-full bg-gray-200" />

                            <div className="space-y-3">
                                <div className="h-5 w-40 bg-gray-200 rounded" />
                                <div className="h-4 w-56 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="min-h-full bg-gray-50 p-6 flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md w-full">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-red-500 text-lg" />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-gray-900">
                        Unable to load profile
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={fetchProfile}
                        className="mt-5 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    const fullName =
        `${profile.firstName || ""} ${
            profile.lastName || ""
        }`.trim() || "Employee";

    const imagePreview =
        getSelectedImagePreview() || getProfileImage();

    return (
        <div className="min-h-full bg-gray-50 p-4 sm:p-6">

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        My Profile
                    </h1>

                    <p className="mt-1.5 text-sm sm:text-base text-gray-500">
                        View and manage your personal information.
                    </p>
                </div>

                {!isEditing && (
                    <button
                        type="button"
                        onClick={handleEdit}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
                    >
                        <i className="fas fa-edit" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-green-50 border border-green-100 text-green-700 text-sm">
                    {success}
                </div>
            )}

            {/* Error Message */}
            {error && profile && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSave}>

                {/* Profile Header */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                        {/* Profile Image */}
                        <div className="relative w-24 h-24 flex-shrink-0">

                            <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 bg-violet-50 flex items-center justify-center">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt={fullName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-semibold text-violet-600">
                                        {getInitials()}
                                    </span>
                                )}
                            </div>

                            {isEditing && (
                                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-violet-700 transition">
                                    <i className="fas fa-camera text-xs" />

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        {/* Basic Details */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {fullName}
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                {profile.email || "No email available"}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                {profile.employeeCode && (
                                    <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                                        {profile.employeeCode}
                                    </span>
                                )}

                                <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                    {profile.isActive === false
                                        ? "Inactive"
                                        : "Active"}
                                </span>

                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                    Employee
                                </span>
                            </div>

                            {isEditing && (
                                <p className="text-xs text-gray-400 mt-3">
                                    JPG, JPEG or PNG. Maximum size 5 MB.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Editable Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Personal Information */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <SectionTitle
                            icon="fa-user"
                            title="Personal Information"
                        />

                        <div className="space-y-4">

                            {isEditing ? (
                                <>
                                    <InputField
                                        label="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />

                                    <InputField
                                        label="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />

                                    <InfoRow
                                        label="Gender"
                                        value={profile.gender}
                                    />

                                    <InfoRow
                                        label="Date of Birth"
                                        value={formatDate(profile.dateOfBirth)}
                                    />

                                    <InfoRow
                                        label="Qualification"
                                        value={profile.qualification}
                                    />
                                </>
                            ) : (
                                <>
                                    <InfoRow
                                        label="First Name"
                                        value={profile.firstName}
                                    />

                                    <InfoRow
                                        label="Last Name"
                                        value={profile.lastName}
                                    />

                                    <InfoRow
                                        label="Gender"
                                        value={profile.gender}
                                    />

                                    <InfoRow
                                        label="Date of Birth"
                                        value={formatDate(profile.dateOfBirth)}
                                    />

                                    <InfoRow
                                        label="Qualification"
                                        value={profile.qualification}
                                    />
                                </>
                            )}
                        </div>
                    </section>

                    {/* Contact Information */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <SectionTitle
                            icon="fa-address-book"
                            title="Contact Information"
                        />

                        <div className="space-y-4">

                            <InfoRow
                                label="Work Email"
                                value={profile.email}
                            />

                            {isEditing ? (
                                <>
                                    <InputField
                                        label="Personal Email"
                                        name="personalEmail"
                                        type="email"
                                        value={formData.personalEmail}
                                        onChange={handleChange}
                                    />

                                    <InputField
                                        label="Phone Number"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />

                                    <InputField
                                        label="Alternate Phone"
                                        name="alternatePhone"
                                        value={formData.alternatePhone}
                                        onChange={handleChange}
                                    />

                                    <TextAreaField
                                        label="Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </>
                            ) : (
                                <>
                                    <InfoRow
                                        label="Personal Email"
                                        value={profile.personalEmail}
                                    />

                                    <InfoRow
                                        label="Phone Number"
                                        value={profile.phone}
                                    />

                                    <InfoRow
                                        label="Alternate Phone"
                                        value={profile.alternatePhone}
                                    />

                                    <InfoRow
                                        label="Address"
                                        value={profile.address}
                                    />
                                </>
                            )}
                        </div>
                    </section>

                    {/* Job Information - Read Only */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <SectionTitle
                            icon="fa-briefcase"
                            title="Job Information"
                        />

                        <div className="space-y-4">
                            <InfoRow
                                label="Employee Code"
                                value={profile.employeeCode}
                            />

                            <InfoRow
                                label="Designation"
                                value={profile.designation}
                            />

                            <InfoRow
                                label="Employment Type"
                                value={profile.employmentType}
                            />

                            <InfoRow
                                label="Joining Date"
                                value={formatDate(profile.joiningDate)}
                            />

                            <InfoRow
                                label="Department"
                                value={
                                    profile.departmentId?.name ||
                                    profile.department?.name
                                }
                            />
                        </div>

                        {isEditing && (
                            <p className="mt-5 text-xs text-gray-400">
                                Job information can only be changed by an administrator.
                            </p>
                        )}
                    </section>

                    {/* Account Information - Read Only */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <SectionTitle
                            icon="fa-shield-alt"
                            title="Account Information"
                        />

                        <div className="space-y-4">
                            <InfoRow
                                label="Account Email"
                                value={profile.email}
                            />

                            <InfoRow
                                label="Role"
                                value="Employee"
                            />

                            <InfoRow
                                label="Account Status"
                                value={
                                    profile.isActive === false
                                        ? "Inactive"
                                        : "Active"
                                }
                            />

                            <InfoRow
                                label="Account Created"
                                value={
                                    formatDate(profile.createdAt)
                                }
                            />
                        </div>
                    </section>
                </div>

                {/* Edit Actions */}
                {isEditing && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

function SectionTitle({ icon, title }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <i className={`fas ${icon} text-violet-600`} />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
                {title}
            </h2>
        </div>
    );
}

function InputField({
    label,
    name,
    value,
    onChange,
    type = "text",
    required = false
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
            />
        </div>
    );
}

function TextAreaField({
    label,
    name,
    value,
    onChange
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
            </label>

            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows="3"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition resize-none"
            />
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 py-2 border-b border-gray-50 last:border-b-0">
            <span className="text-sm text-gray-500">
                {label}
            </span>

            <span className="text-sm font-medium text-gray-800 sm:text-right break-words">
                {value || "Not provided"}
            </span>
        </div>
    );
}

export default EmployeeProfile;