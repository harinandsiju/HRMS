import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const TABS = [
    "Personal Information",
    "Job Information",
    "Compensation",
    "Additional Information"
];

const initialForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    qualification: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    personalEmail: "",
    alternatePhone: "",
    designation: "",
    employmentType: "",
    joiningDate: "",
    reportingManager: "",
    workLocation: "",
    departmentId: "",
    basicSalary: "",
    salaryType: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    relationship: ""
};

function EditEmployee() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(0);
    const [form, setForm] = useState(initialForm);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Profile image states
    const [currentProfileImage, setCurrentProfileImage] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [profilePreview, setProfilePreview] = useState("");

    useEffect(() => {
        fetchEmployee();
        fetchDepartments();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const response = await api.get(`/employees/${id}`);

            const data = response.data.employee || response.data;

            setForm({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                email: data.email || "",
                password: "",
                phone: data.phone || "",
                dateOfBirth: data.dateOfBirth
                    ? data.dateOfBirth.split("T")[0]
                    : "",
                gender: data.gender || "",
                qualification: data.qualification || "",
                address: data.address || "",
                country: data.country || "",
                state: data.state || "",
                city: data.city || "",
                zip: data.zip || "",
                personalEmail: data.personalEmail || "",
                alternatePhone: data.alternatePhone || "",
                designation: data.designation || "",
                employmentType: data.employmentType || "",
                joiningDate: data.joiningDate
                    ? data.joiningDate.split("T")[0]
                    : "",
                reportingManager: data.reportingManager || "",
                workLocation: data.workLocation || "",
                departmentId:
                    typeof data.departmentId === "object"
                        ? data.departmentId?._id || ""
                        : data.departmentId || "",
                basicSalary: data.basicSalary ?? "",
                salaryType: data.salaryType || "",
                bankName: data.bankName || "",
                accountNumber: data.accountNumber || "",
                ifscCode: data.ifscCode || "",
                emergencyContactName:
                    data.emergencyContactName || "",
                emergencyContactPhone:
                    data.emergencyContactPhone || "",
                relationship: data.relationship || ""
            });

            // Load current profile image
            if (data.profileImage) {
                const imageUrl = data.profileImage.startsWith("http")
                    ? data.profileImage
                    : `http://localhost:5000/${data.profileImage.replace(/^\/+/, "")}`;

                setCurrentProfileImage(imageUrl);
                setProfilePreview(imageUrl);
            }

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to load employee details."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");

            setDepartments(response.data.departments || []);
        } catch (err) {
            console.error("Failed to load departments:", err);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            setError("Profile image must be less than 5 MB.");
            return;
        }

        setError("");

        setProfileImage(file);

        const previewUrl = URL.createObjectURL(file);
        setProfilePreview(previewUrl);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            const formData = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (value !== "") {
                    formData.append(key, value);
                }
            });

            // Add new profile image only if selected
            if (profileImage) {
                formData.append("profileImage", profileImage);
            }

            await api.put(`/employees/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            navigate(`/admin/employees/${id}`);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to update employee."
            );
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-gray-500">
                    Loading employee details...
                </p>
            </div>
        );
    }

    if (error && !form.firstName) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>

                <button
                    onClick={() => navigate("/admin/employees")}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    Back to Employees
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Edit Employee
                    </h1>

                    <p className="text-sm text-gray-500">
                        <span className="text-indigo-600">
                            Dashboard
                        </span>{" "}
                        {">"}{" "}
                        <span className="text-indigo-600">
                            Employees
                        </span>{" "}
                        {">"} Edit Employee
                    </p>
                </div>

                <button
                    onClick={() => navigate("/admin/employees")}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                    ← Back to Employees
                </button>

            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Form Card */}
            <div className="rounded-xl border border-gray-200 bg-white">

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-200 px-4">

                    {TABS.map((tab, index) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(index)}
                            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
                                activeTab === index
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-gray-500"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}

                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="p-6"
                >

                    {/* Tab 1 */}
                    {activeTab === 0 && (
                        <div className="space-y-5">

                            {/* Profile Image */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Profile Image
                                </label>

                                <div className="flex items-center gap-5">

                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50">

                                        {profilePreview ? (
                                            <img
                                                src={profilePreview}
                                                alt={`${form.firstName} ${form.lastName}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs font-medium text-indigo-600">
                                                No Image
                                            </span>
                                        )}

                                    </div>

                                    <div>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            onChange={handleProfileImageChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100"
                                        />

                                        <p className="mt-2 text-xs text-gray-400">
                                            JPG, JPEG or PNG. Maximum size 5 MB.
                                        </p>

                                    </div>

                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                <Field
                                    label="First Name"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    required
                                />

                                <Field
                                    label="Last Name"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    required
                                />

                                <SelectField
                                    label="Gender"
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    options={[
                                        "Male",
                                        "Female",
                                        "Other"
                                    ]}
                                    required
                                />

                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                <Field
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    required
                                />

                                <Field
                                    label="Qualification"
                                    name="qualification"
                                    value={form.qualification}
                                    onChange={handleChange}
                                    required
                                />

                                <Field
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                <Field
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                />

                                <Field
                                    label="Personal Email"
                                    name="personalEmail"
                                    type="email"
                                    value={form.personalEmail}
                                    onChange={handleChange}
                                />

                                <Field
                                    label="Phone Number"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                <Field
                                    label="Alternate Phone"
                                    name="alternatePhone"
                                    value={form.alternatePhone}
                                    onChange={handleChange}
                                />

                                <Field
                                    label="Address"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                    className="md:col-span-2"
                                />

                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                                <Field
                                    label="City"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    required
                                />

                                <Field
                                    label="State"
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    required
                                />

                                <Field
                                    label="Country"
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    required
                                />

                                <Field
                                    label="ZIP / Postal Code"
                                    name="zip"
                                    value={form.zip}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>
                    )}

                    {/* Tab 2 */}
                    {activeTab === 1 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                            <Field
                                label="Designation"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                            />

                            <SelectField
                                label="Employment Type"
                                name="employmentType"
                                value={form.employmentType}
                                onChange={handleChange}
                                options={[
                                    "Full-time",
                                    "Part-time",
                                    "Contract",
                                    "Intern"
                                ]}
                            />

                            <Field
                                label="Joining Date"
                                name="joiningDate"
                                type="date"
                                value={form.joiningDate}
                                onChange={handleChange}
                            />

                            <SelectField
                                label="Department"
                                name="departmentId"
                                value={form.departmentId}
                                onChange={handleChange}
                                options={departments.map((d) => ({
                                    value: d._id,
                                    label: d.name
                                }))}
                                isObjectOptions
                            />

                            <Field
                                label="Work Location"
                                name="workLocation"
                                value={form.workLocation}
                                onChange={handleChange}
                            />

                            <Field
                                label="Reporting Manager (Employee ID)"
                                name="reportingManager"
                                value={form.reportingManager}
                                onChange={handleChange}
                            />

                        </div>
                    )}

                    {/* Tab 3 */}
                    {activeTab === 2 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                            <Field
                                label="Basic Salary"
                                name="basicSalary"
                                type="number"
                                value={form.basicSalary}
                                onChange={handleChange}
                            />

                            <SelectField
                                label="Salary Type"
                                name="salaryType"
                                value={form.salaryType}
                                onChange={handleChange}
                                options={[
                                    "Monthly",
                                    "Yearly"
                                ]}
                            />

                            <Field
                                label="Bank Name"
                                name="bankName"
                                value={form.bankName}
                                onChange={handleChange}
                            />

                            <Field
                                label="Account Number"
                                name="accountNumber"
                                value={form.accountNumber}
                                onChange={handleChange}
                            />

                            <Field
                                label="IFSC Code"
                                name="ifscCode"
                                value={form.ifscCode}
                                onChange={handleChange}
                            />

                        </div>
                    )}

                    {/* Tab 4 */}
                    {activeTab === 3 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                            <Field
                                label="Emergency Contact Name"
                                name="emergencyContactName"
                                value={form.emergencyContactName}
                                onChange={handleChange}
                            />

                            <Field
                                label="Relationship"
                                name="relationship"
                                value={form.relationship}
                                onChange={handleChange}
                            />

                            <Field
                                label="Emergency Contact Phone"
                                name="emergencyContactPhone"
                                value={form.emergencyContactPhone}
                                onChange={handleChange}
                            />

                        </div>
                    )}

                    {/* Buttons */}
                    <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5">

                        <button
                            type="button"
                            onClick={() => navigate(`/admin/employees/${id}`)}
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Update Employee
                        </button>

                    </div>

                </form>
            </div>

        </div>
    );
}


/* Input field */
function Field({
    label,
    name,
    value,
    onChange,
    type = "text",
    required = false,
    className = ""
}) {
    return (
        <div className={className}>

            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}{" "}
                {required && (
                    <span className="text-red-500">*</span>
                )}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

        </div>
    );
}


/* Select field */
function SelectField({
    label,
    name,
    value,
    onChange,
    options,
    required = false,
    isObjectOptions = false
}) {
    return (
        <div>

            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}{" "}
                {required && (
                    <span className="text-red-500">*</span>
                )}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="">
                    Select {label}
                </option>

                {isObjectOptions
                    ? options.map((opt) => (
                          <option
                              key={opt.value}
                              value={opt.value}
                          >
                              {opt.label}
                          </option>
                      ))
                    : options.map((opt) => (
                          <option
                              key={opt}
                              value={opt}
                          >
                              {opt}
                          </option>
                      ))}
            </select>

        </div>
    );
}

export default EditEmployee;