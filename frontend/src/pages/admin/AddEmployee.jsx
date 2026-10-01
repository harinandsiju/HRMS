import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function AddEmployee() {
    const [activeTab, setActiveTab] = useState(0);
    const [form, setForm] = useState(initialForm);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [profileImage, setProfileImage] = useState(null);
    const [profilePreview, setProfilePreview] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        api.get("/departments")
            .then((res) => setDepartments(res.data.departments))
            .catch(() => {});
    }, []);

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
        setError("");
        setLoading(true);

        try {
            const formData = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (value !== "") {
                    formData.append(key, value);
                }
            });

            if (profileImage) {
                formData.append("profileImage", profileImage);
            }

            await api.post("/employees", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            navigate("/admin/employees");
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to create employee"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Add Employee
                    </h1>

                    <p className="text-sm text-gray-500">
                        <span className="text-indigo-600">
                            Dashboard
                        </span>{" "}
                        {">"}{" "}
                        <span className="text-indigo-600">
                            Employees
                        </span>{" "}
                        {">"} Add Employee
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

            {/* Main Card */}
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

                <form
                    onSubmit={handleSubmit}
                    className="p-6"
                >

                    {/* =========================
                        TAB 1 - PERSONAL
                    ========================== */}
                    {activeTab === 0 && (
                        <div className="space-y-5">

                            {/* Profile Image */}
                            <div className="mb-6">

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Profile Image
                                </label>

                                <div className="flex items-center gap-5">

                                    {/* Preview */}
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50">

                                        {profilePreview ? (
                                            <img
                                                src={profilePreview}
                                                alt="Profile Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs font-medium text-indigo-600">
                                                No Image
                                            </span>
                                        )}

                                    </div>

                                    {/* Upload */}
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

                            {/* Name + Gender */}
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
                                    required
                                    options={[
                                        "Male",
                                        "Female",
                                        "Other"
                                    ]}
                                />

                            </div>

                            {/* DOB + Qualification + Email */}
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

                            {/* Password + Personal Email + Phone */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                <Field
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
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
                                    required
                                />

                            </div>

                            {/* Alternate Phone + Address */}
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

                            {/* Location */}
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

                    {/* =========================
                        TAB 2 - JOB
                    ========================== */}
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

                    {/* =========================
                        TAB 3 - COMPENSATION
                    ========================== */}
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

                    {/* =========================
                        TAB 4 - ADDITIONAL
                    ========================== */}
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

                            <p className="text-xs text-gray-400 md:col-span-3">
                                Additional documents such as Aadhar, PAN,
                                Resume, etc. can be uploaded after the
                                employee is created from their profile page.
                            </p>

                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin/employees")
                            }
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading
                                ? "Saving..."
                                : "Save Employee"}
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}


/* =========================
   Input Field
========================= */

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
                    <span className="text-red-500">
                        *
                    </span>
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


/* =========================
   Select Field
========================= */

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
                    <span className="text-red-500">
                        *
                    </span>
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

export default AddEmployee;