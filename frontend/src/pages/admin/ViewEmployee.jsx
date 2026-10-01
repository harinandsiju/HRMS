import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faPhone,
    faEnvelope,
    faLocationDot,
    faBriefcase,
    faFile,
    faCircleInfo,
    faEdit,
    faArrowLeft,
    faDownload,
    faMoneyBill
} from "@fortawesome/free-solid-svg-icons";

function ViewEmployee() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchEmployee();
        fetchDocuments();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const response = await api.get(`/employees/${id}`);
            setEmployee(response.data.employee || response.data);
        } catch (error) {
            console.error(error);
            setError(
                error.response?.data?.message ||
                "Failed to load employee details."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await api.get(`/documents/employee/${id}`);

            setDocuments(
                response.data.documents ||
                response.data ||
                []
            );
        } catch (error) {
            console.error("Failed to load documents:", error);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || amount === "") {
            return "-";
        }

        return `₹${Number(amount).toLocaleString("en-IN")}`;
    };

    const getValue = (value) => {
        return value !== undefined &&
            value !== null &&
            value !== ""
            ? value
            : "-";
    };

    const getDepartmentName = () => {
        if (!employee?.departmentId) return "-";

        if (typeof employee.departmentId === "object") {
            return employee.departmentId.name || "-";
        }

        return employee.departmentId;
    };

    const getProfileImage = () => {
        if (!employee?.profileImage) return null;

        if (employee.profileImage.startsWith("http")) {
            return employee.profileImage;
        }

        return `http://localhost:5000/${employee.profileImage.replace(
            /^\/+/,
            ""
        )}`;
    };

    const getDocumentName = (document) => {
        return (
            document.originalName ||
            document.fileName ||
            document.name ||
            "Document"
        );
    };

    const getDocumentPath = (document) => {
        const path =
            document.filePath ||
            document.path ||
            document.fileUrl;

        if (!path) return "#";

        if (path.startsWith("http")) {
            return path;
        }

        return `http://localhost:5000/${path.replace(/^\/+/, "")}`;
    };

    const getDocumentIcon = (document) => {
        const name = getDocumentName(document).toLowerCase();

        if (name.endsWith(".pdf")) return "PDF";

        if (
            name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".png")
        ) {
            return "IMG";
        }

        return "FILE";
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>

                    <p className="text-sm text-gray-500">
                        Loading employee details...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
                    {error || "Employee not found."}
                </div>

                <button
                    onClick={() => navigate("/admin/employees")}
                    className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Employees
                </button>
            </div>
        );
    }

    const profileImage = getProfileImage();

    return (
      <div className="space-y-5 p-4 md:p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Dashboard
              </button>

              <span className="text-gray-400">›</span>

              <button
                onClick={() => navigate("/admin/employees")}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Employees
              </button>

              <span className="text-gray-400">›</span>

              <span className="text-gray-500">Employee Details</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Employee Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View detailed information about the employee
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/employees")}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Employees
          </button>
        </div>

        {/* Employee Summary */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
            {/* Employee Profile */}
            <div className="flex items-center gap-5 lg:border-r lg:border-gray-100 lg:pr-8">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={employee.firstName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-indigo-600">
                    {employee.firstName?.charAt(0)?.toUpperCase() || "E"}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {getValue(employee.firstName)} {getValue(employee.lastName)}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      employee.status === "Inactive"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {getValue(employee.status)}
                  </span>
                </div>

                <p className="mt-1 font-medium text-indigo-600">
                  {getValue(employee.designation)}
                </p>

                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2 break-all">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="w-4 text-gray-400"
                    />

                    {getValue(employee.email)}
                  </p>

                  <p className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="w-4 text-gray-400"
                    />

                    {getValue(employee.phone)}
                  </p>

                  <p className="flex items-center gap-2 break-words">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="w-4 text-gray-400"
                    />

                    {getValue(employee.city)}

                    {employee.state ? `, ${employee.state}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
              <InfoRow
                label="Employee ID"
                value={getValue(employee.employeeCode)}
              />

              <InfoRow label="Department" value={getDepartmentName()} />

              <InfoRow
                label="Designation"
                value={getValue(employee.designation)}
              />

              <InfoRow
                label="Employment Type"
                value={getValue(employee.employmentType)}
              />

              <InfoRow label="Status" value={getValue(employee.status)} badge />

              <InfoRow
                label="Reporting Manager"
                value={getValue(employee.reportingManager)}
              />

              <InfoRow
                label="Date of Joining"
                value={formatDate(employee.joiningDate)}
              />

              <InfoRow
                label="Work Location"
                value={getValue(employee.workLocation)}
              />

              <InfoRow label="Gender" value={getValue(employee.gender)} />

              <InfoRow
                label="Date of Birth"
                value={formatDate(employee.dateOfBirth)}
              />
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Personal Information */}
          <InfoCard
            title="Personal Information"
            icon={<FontAwesomeIcon icon={faUser} />}
          >
            <InfoRow label="First Name" value={getValue(employee.firstName)} />



            <InfoRow label="Last Name" value={getValue(employee.lastName)} />

            <InfoRow label="Gender" value={getValue(employee.gender)} />

            <InfoRow
              label="Date of Birth"
              value={formatDate(employee.dateOfBirth)}
            />

            <InfoRow
              label="Qualification"
              value={getValue(employee.qualification)}
            />

            <InfoRow label="Country" value={getValue(employee.country)} />
          </InfoCard>

          {/* Contact Information */}
          <InfoCard
            title="Contact Information"
            icon={<FontAwesomeIcon icon={faPhone} />}
          >
            <InfoRow label="Email Address" value={getValue(employee.email)} />

            <InfoRow
              label="Personal Email"
              value={getValue(employee.personalEmail)}
            />

            <InfoRow label="Phone Number" value={getValue(employee.phone)} />

            <InfoRow
              label="Alternate Phone"
              value={getValue(employee.alternatePhone)}
            />

            <InfoRow
              label="Address"
              value={
                [employee.address, employee.city, employee.state, employee.zip]
                  .filter(Boolean)
                  .join(", ") || "-"
              }
            />
          </InfoCard>

          {/* Job Information */}
          <InfoCard
            title="Job Information"
            icon={<FontAwesomeIcon icon={faBriefcase} />}
          >
            <InfoRow label="Department" value={getDepartmentName()} />

            <InfoRow
              label="Designation"
              value={getValue(employee.designation)}
            />

            <InfoRow
              label="Reporting To"
              value={getValue(employee.reportingManager)}
            />

            <InfoRow
              label="Employment Type"
              value={getValue(employee.employmentType)}
            />

            <InfoRow
              label="Work Location"
              value={getValue(employee.workLocation)}
            />

            <InfoRow
              label="Joining Date"
              value={formatDate(employee.joiningDate)}
            />
          </InfoCard>

          {/* Compensation */}
          <InfoCard
            title="Compensation & Payroll"
            icon={<FontAwesomeIcon icon={faMoneyBill} />}
          >
            <InfoRow
              label="Basic Salary"
              value={formatCurrency(employee.basicSalary)}
            />

            <InfoRow
              label="Salary Type"
              value={getValue(employee.salaryType)}
            />

            <InfoRow label="Bank Name" value={getValue(employee.bankName)} />

            <InfoRow
              label="Bank Account"
              value={
                employee.accountNumber
                  ? `**** **** ${String(employee.accountNumber).slice(-4)}`
                  : "-"
              }
            />

            <InfoRow label="IFSC Code" value={getValue(employee.ifscCode)} />
          </InfoCard>

          {/* Additional Information */}
          <InfoCard
            title="Additional Information"
            icon={<FontAwesomeIcon icon={faCircleInfo} />}
          >
            <InfoRow
              label="Emergency Contact"
              value={getValue(employee.emergencyContactName)}
            />

            <InfoRow
              label="Emergency Phone"
              value={getValue(employee.emergencyContactPhone)}
            />

            <InfoRow
              label="Relationship"
              value={getValue(employee.relationship)}
            />

            <InfoRow
              label="Qualification"
              value={getValue(employee.qualification)}
            />

            <InfoRow
              label="Personal Email"
              value={getValue(employee.personalEmail)}
            />
          </InfoCard>

          {/* Documents */}
          <InfoCard title="Documents" icon={<FontAwesomeIcon icon={faFile} />}>
            {documents.length === 0 ? (
              <div className="py-5 text-center text-sm text-gray-500">
                No documents uploaded.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((document) => (
                  <a
                    key={document._id}
                    href={getDocumentPath(document)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 transition hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-600">
                        {getDocumentIcon(document)}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {getDocumentName(document)}
                        </p>

                        <p className="text-xs text-gray-400">
                          {document.documentType || "Document"}
                        </p>
                      </div>
                    </div>

                    <span className="ml-2 text-indigo-600">
                      <FontAwesomeIcon icon={faDownload} />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </InfoCard>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate("/admin/employees")}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Cancel
          </button>

          <button
            onClick={() => navigate(`/admin/employees/${employee._id}/edit`)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FontAwesomeIcon icon={faEdit} />
            Edit Employee
          </button>
        </div>
      </div>
    );
}


/* Reusable information row */
function InfoRow({ label, value, badge = false }) {
    return (
        <div className="grid grid-cols-[105px_minmax(0,1fr)] gap-3">
            <span className="text-gray-500">
                {label}
            </span>

            {badge ? (
                <span className="min-w-0">
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-600">
                        {value}
                    </span>
                </span>
            ) : (
                <span className="min-w-0 break-words font-medium text-gray-800">
                    {value}
                </span>
            )}
        </div>
    );
}


/* Reusable information card */
function InfoCard({ title, icon, children }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    {icon}
                </div>

                <h2 className="text-base font-bold text-gray-900">
                    {title}
                </h2>

            </div>

            <div className="space-y-3 text-sm">
                {children}
            </div>

        </div>
    );
}

export default ViewEmployee;