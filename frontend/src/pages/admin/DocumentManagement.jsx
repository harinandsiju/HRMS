import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const DOCUMENT_TYPES = [
    "ID Proof",
    "Resume",
    "Certificate",
    "Offer Letter",
    "Other"
];

const DOCUMENTS_PER_PAGE = 8;

// ==================================================
// MAIN COMPONENT
// ==================================================

function DocumentManagement() {
    const [employees, setEmployees] = useState([]);
    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search and filters
    const [search, setSearch] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Upload modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // View panel
    const [selectedDocument, setSelectedDocument] =
        useState(null);
    const [detailsVisible, setDetailsVisible] =
        useState(false);

    // Delete modal
    const [documentToDelete, setDocumentToDelete] =
        useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    // Upload form
    const [uploadForm, setUploadForm] = useState({
        employeeId: "",
        documentType: "Other",
        file: null
    });

    // ==================================================
    // FETCH DATA
    // ==================================================

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const employeeResponse = await api.get(
                "/employees?page=1&limit=100"
            );

            const employeeList =
                employeeResponse.data.employees || [];

            setEmployees(employeeList);

            // Existing backend only provides documents
            // by employee, so fetch each employee's documents.
            const documentResults =
                await Promise.all(
                    employeeList.map(async (employee) => {
                        try {
                            const response =
                                await api.get(
                                    `/documents/employee/${employee._id}`
                                );

                            return (
                                response.data.documents || []
                            );
                        } catch (err) {
                            console.error(
                                `Failed to fetch documents for employee ${employee._id}:`,
                                err
                            );

                            return [];
                        }
                    })
                );

            const allDocuments =
                documentResults.flat();

            setDocuments(allDocuments);
        } catch (err) {
            console.error(
                "Fetch document data error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to fetch documents."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ==================================================
    // BODY SCROLL LOCK
    // ==================================================

    useEffect(() => {
        const overlayOpen =
            showUploadModal ||
            Boolean(selectedDocument) ||
            Boolean(documentToDelete);

        if (!overlayOpen) {
            return;
        }

        const scrollbarWidth =
            window.innerWidth -
            document.documentElement.clientWidth;

        const previousOverflow =
            document.body.style.overflow;

        const previousPaddingRight =
            document.body.style.paddingRight;

        document.body.style.overflow = "hidden";

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight =
                `${scrollbarWidth}px`;
        }

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.body.style.paddingRight =
                previousPaddingRight;
        };
    }, [
        showUploadModal,
        selectedDocument,
        documentToDelete
    ]);

    // ==================================================
    // TOAST
    // ==================================================

    const showToast = (message, type = "success") => {
        setToast({
            message,
            type
        });

        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    // ==================================================
    // HELPER FUNCTIONS
    // ==================================================

    const getEmployee = (document) => {
        if (
            document?.employeeId &&
            typeof document.employeeId === "object"
        ) {
            return document.employeeId;
        }

        return employees.find(
            (employee) =>
                employee._id === document?.employeeId
        );
    };

    const getEmployeeName = (document) => {
        const employee = getEmployee(document);

        if (!employee) {
            return "Unknown Employee";
        }

        return `${employee.firstName || ""} ${
            employee.lastName || ""
        }`.trim() || "Unknown Employee";
    };

    const getEmployeeCode = (document) => {
        const employee = getEmployee(document);

        return employee?.employeeCode || "-";
    };

    const getInitials = (document) => {
        const employee = getEmployee(document);

        if (!employee) {
            return "NA";
        }

        const first =
            employee.firstName?.charAt(0) || "";

        const last =
            employee.lastName?.charAt(0) || "";

        return `${first}${last}`.toUpperCase();
    };

    const getEmployeeDesignation = (document) => {
        const employee = getEmployee(document);

        return employee?.designation || "Employee";
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatDateTime = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes <= 0) {
            return "-";
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        if (bytes < 1024 * 1024 * 1024) {
            return `${(
                bytes /
                (1024 * 1024)
            ).toFixed(1)} MB`;
        }

        return `${(
            bytes /
            (1024 * 1024 * 1024)
        ).toFixed(1)} GB`;
    };

    const getDocumentIcon = (document) => {
        const mimeType =
            document?.mimeType?.toLowerCase() || "";

        const fileName =
            document?.fileName?.toLowerCase() || "";

        if (mimeType.includes("pdf")) {
            return "fas fa-file-pdf";
        }

        if (
            mimeType.includes("word") ||
            fileName.endsWith(".doc") ||
            fileName.endsWith(".docx")
        ) {
            return "fas fa-file-word";
        }

        if (
            mimeType.includes("image") ||
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            fileName.endsWith(".png") ||
            fileName.endsWith(".webp")
        ) {
            return "fas fa-file-image";
        }

        if (
            mimeType.includes("spreadsheet") ||
            mimeType.includes("excel") ||
            fileName.endsWith(".xls") ||
            fileName.endsWith(".xlsx")
        ) {
            return "fas fa-file-excel";
        }

        return "fas fa-file-alt";
    };

    const getDocumentIconClass = (document) => {
        const mimeType =
            document?.mimeType?.toLowerCase() || "";

        const fileName =
            document?.fileName?.toLowerCase() || "";

        if (mimeType.includes("pdf")) {
            return "bg-red-50 text-red-500";
        }

        if (
            mimeType.includes("word") ||
            fileName.endsWith(".doc") ||
            fileName.endsWith(".docx")
        ) {
            return "bg-blue-50 text-blue-500";
        }

        if (
            mimeType.includes("image") ||
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            fileName.endsWith(".png") ||
            fileName.endsWith(".webp")
        ) {
            return "bg-purple-50 text-purple-500";
        }

        if (
            mimeType.includes("spreadsheet") ||
            mimeType.includes("excel") ||
            fileName.endsWith(".xls") ||
            fileName.endsWith(".xlsx")
        ) {
            return "bg-green-50 text-green-500";
        }

        return "bg-gray-100 text-gray-500";
    };

    const getTypeClass = (type) => {
        switch (type) {
            case "ID Proof":
                return "bg-blue-50 text-blue-700 border-blue-100";

            case "Resume":
                return "bg-purple-50 text-purple-700 border-purple-100";

            case "Certificate":
                return "bg-green-50 text-green-700 border-green-100";

            case "Offer Letter":
                return "bg-indigo-50 text-indigo-700 border-indigo-100";

            default:
                return "bg-gray-50 text-gray-600 border-gray-200";
        }
    };

    // ==================================================
    // DOCUMENT URL
    // ==================================================

    const getDocumentUrl = (document) => {
        if (!document?.filePath) {
            return "";
        }

        let baseURL =
            api.defaults?.baseURL || "";

        baseURL = baseURL.replace(
            /\/api\/?$/,
            ""
        );

        baseURL = baseURL.replace(
            /\/$/,
            ""
        );

        const filePath =
            document.filePath.replace(
                /^\/+/,
                ""
            );

        return `${baseURL}/${filePath}`;
    };

    // ==================================================
    // FILTERED DOCUMENTS
    // ==================================================

    const filteredDocuments = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return documents.filter(
            (document) => {
                const employee =
                    getEmployee(document);

                const employeeName =
                    getEmployeeName(
                        document
                    ).toLowerCase();

                const employeeCode =
                    getEmployeeCode(
                        document
                    ).toLowerCase();

                const fileName =
                    (
                        document.fileName || ""
                    ).toLowerCase();

                const matchesSearch =
                    !searchValue ||
                    employeeName.includes(
                        searchValue
                    ) ||
                    employeeCode.includes(
                        searchValue
                    ) ||
                    fileName.includes(
                        searchValue
                    );

                const matchesEmployee =
                    !employeeFilter ||
                    employee?._id ===
                        employeeFilter;

                const matchesType =
                    !typeFilter ||
                    document.documentType ===
                        typeFilter;

                return (
                    matchesSearch &&
                    matchesEmployee &&
                    matchesType
                );
            }
        );
    }, [
        documents,
        employees,
        search,
        employeeFilter,
        typeFilter
    ]);

    // ==================================================
    // PAGINATION
    // ==================================================

    const totalPages =
        Math.ceil(
            filteredDocuments.length /
                DOCUMENTS_PER_PAGE
        ) || 1;

    const visibleDocuments =
        filteredDocuments.slice(
            (currentPage - 1) *
                DOCUMENTS_PER_PAGE,
            currentPage *
                DOCUMENTS_PER_PAGE
        );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [
        currentPage,
        totalPages
    ]);

    // ==================================================
    // SUMMARY
    // ==================================================

    const totalDocuments =
        documents.length;

    const employeesWithDocuments =
        new Set(
            documents
                .map((document) => {
                    const employee =
                        getEmployee(document);

                    return employee?._id;
                })
                .filter(Boolean)
        ).size;

    const documentTypesUsed =
        new Set(
            documents.map(
                (document) =>
                    document.documentType
            )
        ).size;

    const recentDocuments =
        documents.filter((document) => {
            if (!document.createdAt) {
                return false;
            }

            const createdDate =
                new Date(
                    document.createdAt
                );

            const thirtyDaysAgo =
                new Date();

            thirtyDaysAgo.setDate(
                thirtyDaysAgo.getDate() - 30
            );

            return createdDate >=
                thirtyDaysAgo;
        }).length;

    // ==================================================
    // UPLOAD FORM
    // ==================================================

    const handleUploadChange = (e) => {
        const {
            name,
            value,
            files
        } = e.target;

        if (name === "file") {
            setUploadForm(
                (current) => ({
                    ...current,
                    file:
                        files?.[0] || null
                })
            );

            return;
        }

        setUploadForm(
            (current) => ({
                ...current,
                [name]: value
            })
        );
    };

    // ==================================================
    // OPEN UPLOAD MODAL
    // ==================================================

    const openUploadModal = () => {
        setUploadForm({
            employeeId: "",
            documentType: "Other",
            file: null
        });

        setShowUploadModal(true);
    };

    // ==================================================
    // CLOSE UPLOAD MODAL
    // ==================================================

    const closeUploadModal = () => {
        if (isUploading) {
            return;
        }

        setShowUploadModal(false);

        setUploadForm({
            employeeId: "",
            documentType: "Other",
            file: null
        });
    };

    // ==================================================
    // UPLOAD DOCUMENT
    // ==================================================

    const handleUploadDocument = async (e) => {
        e.preventDefault();

        if (!uploadForm.employeeId) {
            showToast(
                "Please select an employee.",
                "error"
            );
            return;
        }

        if (!uploadForm.file) {
            showToast(
                "Please select a file.",
                "error"
            );
            return;
        }

        const maxFileSize =
            10 * 1024 * 1024;

        if (
            uploadForm.file.size >
            maxFileSize
        ) {
            showToast(
                "File size must be 10 MB or less.",
                "error"
            );
            return;
        }

        try {
            setIsUploading(true);

            const formData =
                new FormData();

            formData.append(
                "employeeId",
                uploadForm.employeeId
            );

            formData.append(
                "documentType",
                uploadForm.documentType
            );

            formData.append(
                "file",
                uploadForm.file
            );

            await api.post(
                "/documents",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data"
                    }
                }
            );

            setShowUploadModal(false);

            setUploadForm({
                employeeId: "",
                documentType: "Other",
                file: null
            });

            await fetchData();

            setCurrentPage(1);

            showToast(
                "Document uploaded successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Upload document error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                "Failed to upload document.",
                "error"
            );
        } finally {
            setIsUploading(false);
        }
    };

    // ==================================================
    // OPEN DOCUMENT DETAILS
    // ==================================================

    const openDocumentDetails = (
        document
    ) => {
        setSelectedDocument(document);

        requestAnimationFrame(() => {
            setDetailsVisible(true);
        });
    };

    // ==================================================
    // CLOSE DOCUMENT DETAILS
    // ==================================================

    const closeDocumentDetails = () => {
        setDetailsVisible(false);

        setTimeout(() => {
            setSelectedDocument(null);
        }, 300);
    };

    // ==================================================
    // OPEN DELETE MODAL
    // ==================================================

    const openDeleteModal = (
        document
    ) => {
        setDocumentToDelete(document);
    };

    // ==================================================
    // DELETE DOCUMENT
    // ==================================================

    const handleDeleteDocument = async () => {
        if (
            !documentToDelete?._id
        ) {
            return;
        }

        try {
            setIsDeleting(true);

            await api.delete(
                `/documents/${documentToDelete._id}`
            );

            const deletedId =
                documentToDelete._id;

            setDocuments(
                (currentDocuments) =>
                    currentDocuments.filter(
                        (document) =>
                            document._id !==
                            deletedId
                    )
            );

            if (
                selectedDocument?._id ===
                deletedId
            ) {
                closeDocumentDetails();
            }

            setDocumentToDelete(null);

            showToast(
                "Document deleted successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Delete document error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                "Failed to delete document.",
                "error"
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // ==================================================
    // CLEAR FILTERS
    // ==================================================

    const clearFilters = () => {
        setSearch("");
        setEmployeeFilter("");
        setTypeFilter("");
        setCurrentPage(1);
    };

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="p-6 bg-gray-50 min-h-full">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">

                        <span>
                            Dashboard
                        </span>

                        <i className="fas fa-chevron-right text-[9px] text-gray-400" />

                        <span className="text-gray-800">
                            Documents
                        </span>

                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900">
                        Document Management
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage employee documents and files
                    </p>

                </div>

                <button
                    type="button"
                    onClick={openUploadModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
                >
                    <i className="fas fa-cloud-upload-alt text-xs" />
                    Upload Document
                </button>

            </div>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

                <SummaryCard
                    title="Total Documents"
                    value={totalDocuments}
                    description="Active documents"
                    icon="fas fa-file-alt"
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <SummaryCard
                    title="Employees Covered"
                    value={employeesWithDocuments}
                    description="Employees with documents"
                    icon="fas fa-users"
                    iconClass="bg-blue-50 text-blue-600"
                />

                <SummaryCard
                    title="Document Types"
                    value={documentTypesUsed}
                    description="Types currently used"
                    icon="fas fa-layer-group"
                    iconClass="bg-purple-50 text-purple-600"
                />

                <SummaryCard
                    title="Recent Uploads"
                    value={recentDocuments}
                    description="Uploaded in last 30 days"
                    icon="fas fa-clock"
                    iconClass="bg-green-50 text-green-600"
                />

            </div>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* SEARCH */}

                    <div>

                        <label className="block text-xs font-medium text-gray-500 mb-2">
                            Search
                        </label>

                        <div className="relative">

                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(
                                        e.target.value
                                    );
                                    setCurrentPage(1);
                                }}
                                placeholder="Search file, employee or ID..."
                                className="w-full h-[46px] border border-gray-200 rounded-lg pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />

                        </div>

                    </div>

                    {/* EMPLOYEE */}

                    <FilterSelect
                        label="Employee"
                        value={employeeFilter}
                        onChange={(e) => {
                            setEmployeeFilter(
                                e.target.value
                            );
                            setCurrentPage(1);
                        }}
                        placeholder="All Employees"
                        options={employees.map(
                            (employee) => ({
                                value:
                                    employee._id,
                                label:
                                    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
                                    employee.employeeCode ||
                                    "Unknown Employee"
                            })
                        )}
                    />

                    {/* DOCUMENT TYPE */}

                    <FilterSelect
                        label="Document Type"
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(
                                e.target.value
                            );
                            setCurrentPage(1);
                        }}
                        placeholder="All Document Types"
                        options={DOCUMENT_TYPES.map(
                            (type) => ({
                                value: type,
                                label: type
                            })
                        )}
                    />

                </div>

                {(search ||
                    employeeFilter ||
                    typeFilter) && (
                    <div className="mt-4 flex justify-end">

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear Filters
                        </button>

                    </div>
                )}

            </div>

            {/* ==================================================
                DOCUMENT TABLE
            ================================================== */}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-200">

                    <h3 className="text-lg font-semibold text-gray-900">
                        Employee Documents
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        {filteredDocuments.length} document
                        {filteredDocuments.length !==
                        1
                            ? "s"
                            : ""}{" "}
                        found
                    </p>

                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState
                        message={error}
                        onRetry={fetchData}
                    />
                ) : visibleDocuments.length ===
                  0 ? (
                    <EmptyState
                        hasFilters={
                            Boolean(
                                search ||
                                employeeFilter ||
                                typeFilter
                            )
                        }
                        onClear={clearFilters}
                        onUpload={openUploadModal}
                    />
                ) : (
                    <>

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1000px] text-sm table-fixed">

                                <colgroup>
                                    <col style={{ width: "28%" }} />
                                    <col style={{ width: "20%" }} />
                                    <col style={{ width: "15%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "15%" }} />
                                    <col style={{ width: "10%" }} />
                                </colgroup>

                                <thead className="bg-gray-50 border-b border-gray-200">

                                    <tr>

                                        <th className="text-left px-5 py-3 font-medium text-gray-500">
                                            Document
                                        </th>

                                        <th className="text-left px-5 py-3 font-medium text-gray-500">
                                            Employee
                                        </th>

                                        <th className="text-left px-5 py-3 font-medium text-gray-500">
                                            Type
                                        </th>

                                        <th className="text-left px-5 py-3 font-medium text-gray-500">
                                            Size
                                        </th>

                                        <th className="text-left px-5 py-3 font-medium text-gray-500">
                                            Uploaded
                                        </th>

                                        <th className="text-center px-5 py-3 font-medium text-gray-500">
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                    {visibleDocuments.map(
                                        (document) => (
                                            <tr
                                                key={
                                                    document._id
                                                }
                                                className="hover:bg-gray-50 transition"
                                            >

                                                {/* DOCUMENT */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-3 min-w-0">

                                                        <div
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getDocumentIconClass(
                                                                document
                                                            )}`}
                                                        >
                                                            <i
                                                                className={`${getDocumentIcon(
                                                                    document
                                                                )} text-sm`}
                                                            />
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="font-medium text-gray-800 truncate">
                                                                {document.fileName ||
                                                                    "Unnamed Document"}
                                                            </p>

                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {document.mimeType ||
                                                                    "File"}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* EMPLOYEE */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <EmployeeAvatar
                                                            document={
                                                                document
                                                            }
                                                        />

                                                        <div className="min-w-0">

                                                            <p className="font-medium text-gray-800 truncate">
                                                                {getEmployeeName(
                                                                    document
                                                                )}
                                                            </p>

                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {getEmployeeCode(
                                                                    document
                                                                )}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* TYPE */}

                                                <td className="px-5 py-4">

                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getTypeClass(
                                                            document.documentType
                                                        )}`}
                                                    >
                                                        {
                                                            document.documentType ||
                                                            "Other"
                                                        }
                                                    </span>

                                                </td>

                                                {/* SIZE */}

                                                <td className="px-5 py-4 text-gray-600">

                                                    {formatFileSize(
                                                        document.fileSize
                                                    )}

                                                </td>

                                                {/* DATE */}

                                                <td className="px-5 py-4">

                                                    <p className="text-gray-700">
                                                        {formatDate(
                                                            document.createdAt
                                                        )}
                                                    </p>

                                                </td>

                                                {/* ACTIONS */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center justify-center gap-2">

                                                        <ActionButton
                                                            icon="fas fa-eye"
                                                            title="View document"
                                                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                                            onClick={() =>
                                                                openDocumentDetails(
                                                                    document
                                                                )
                                                            }
                                                        />

                                                        <ActionButton
                                                            icon="fas fa-trash"
                                                            title="Delete document"
                                                            className="text-red-600 bg-red-50 hover:bg-red-100"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    document
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* PAGINATION */}

                        <Pagination
                            currentPage={
                                currentPage
                            }
                            totalPages={
                                totalPages
                            }
                            totalItems={
                                filteredDocuments.length
                            }
                            itemsPerPage={
                                DOCUMENTS_PER_PAGE
                            }
                            onPageChange={
                                setCurrentPage
                            }
                        />

                    </>
                )}

            </div>

            {/* ==================================================
                VIEW DOCUMENT PANEL
            ================================================== */}

            {selectedDocument && (
                <div
                    className={`fixed inset-0 z-[70] ${
                        detailsVisible
                            ? "pointer-events-auto"
                            : "pointer-events-none"
                    }`}
                >

                    {/* BACKDROP */}

                    <div
                        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                            detailsVisible
                                ? "opacity-100"
                                : "opacity-0"
                        }`}
                        onClick={
                            closeDocumentDetails
                        }
                    />

                    {/* SIDE PANEL */}

                    <div
                        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
                            detailsVisible
                                ? "translate-x-0"
                                : "translate-x-full"
                        }`}
                    >

                        {/* HEADER */}

                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-900">
                                    Document Details
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    View uploaded document information
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeDocumentDetails
                                }
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                                aria-label="Close"
                            >
                                <i className="fas fa-times text-sm" />
                            </button>

                        </div>

                        {/* BODY */}

                        <div className="flex-1 overflow-y-auto p-5">

                            {/* FILE PREVIEW CARD */}

                            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">

                                <div className="flex items-center gap-4">

                                    <div
                                        className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getDocumentIconClass(
                                            selectedDocument
                                        )}`}
                                    >
                                        <i
                                            className={`${getDocumentIcon(
                                                selectedDocument
                                            )} text-xl`}
                                        />
                                    </div>

                                    <div className="min-w-0">

                                        <p className="font-semibold text-gray-900 break-words">
                                            {
                                                selectedDocument.fileName
                                            }
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatFileSize(
                                                selectedDocument.fileSize
                                            )}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="border-t border-gray-200 my-6" />

                            {/* DOCUMENT INFO */}

                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                    Document Information
                                </h3>

                                <div className="space-y-4">

                                    <InfoRow
                                        label="Document Type"
                                        value={
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getTypeClass(
                                                    selectedDocument.documentType
                                                )}`}
                                            >
                                                {
                                                    selectedDocument.documentType
                                                }
                                            </span>
                                        }
                                    />

                                    <InfoRow
                                        label="File Size"
                                        value={formatFileSize(
                                            selectedDocument.fileSize
                                        )}
                                    />

                                    <InfoRow
                                        label="File Type"
                                        value={
                                            selectedDocument.mimeType ||
                                            "-"
                                        }
                                    />

                                    <InfoRow
                                        label="Uploaded On"
                                        value={formatDateTime(
                                            selectedDocument.createdAt
                                        )}
                                    />

                                </div>

                            </div>

                            <div className="border-t border-gray-200 my-6" />

                            {/* EMPLOYEE INFO */}

                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                    Employee
                                </h3>

                                <div className="flex items-center gap-3">

                                    <EmployeeAvatar
                                        document={
                                            selectedDocument
                                        }
                                    />

                                    <div>

                                        <p className="text-sm font-medium text-gray-900">
                                            {getEmployeeName(
                                                selectedDocument
                                            )}
                                        </p>

                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {getEmployeeCode(
                                                selectedDocument
                                            )}
                                            {" • "}
                                            {getEmployeeDesignation(
                                                selectedDocument
                                            )}
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* PANEL FOOTER */}

                        <div className="border-t border-gray-200 p-5 space-y-2">

                            {getDocumentUrl(
                                selectedDocument
                            ) && (
                                <a
                                    href={getDocumentUrl(
                                        selectedDocument
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                >
                                    <i className="fas fa-external-link-alt text-xs" />
                                    Open Document
                                </a>
                            )}

                            <button
                                type="button"
                                onClick={
                                    closeDocumentDetails
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ==================================================
                UPLOAD MODAL
            ================================================== */}

            {showUploadModal && (
                <UploadDocumentModal
                    form={uploadForm}
                    employees={employees}
                    isSubmitting={
                        isUploading
                    }
                    onChange={
                        handleUploadChange
                    }
                    onClose={
                        closeUploadModal
                    }
                    onSubmit={
                        handleUploadDocument
                    }
                />
            )}

            {/* ==================================================
                DELETE MODAL
            ================================================== */}

            {documentToDelete && (
                <DeleteDocumentModal
                    document={
                        documentToDelete
                    }
                    employeeName={getEmployeeName(
                        documentToDelete
                    )}
                    isDeleting={
                        isDeleting
                    }
                    onClose={() =>
                        !isDeleting &&
                        setDocumentToDelete(
                            null
                        )
                    }
                    onConfirm={
                        handleDeleteDocument
                    }
                />
            )}

            {/* ==================================================
                TOAST
            ================================================== */}

            {toast && (
                <Toast
                    message={
                        toast.message
                    }
                    type={toast.type}
                    onClose={() =>
                        setToast(null)
                    }
                />
            )}

        </div>
    );
}

// ==================================================
// SUMMARY CARD
// ==================================================

function SummaryCard({
    title,
    value,
    description,
    icon,
    iconClass
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-sm text-gray-500">
                        {title}
                    </p>

                    <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {value}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                        {description}
                    </p>

                </div>

                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
                >
                    <i
                        className={`${icon} text-base`}
                    />
                </div>

            </div>

        </div>
    );
}

// ==================================================
// FILTER SELECT
// ==================================================

function FilterSelect({
    label,
    value,
    onChange,
    placeholder,
    options
}) {
    return (
        <div>

            <label className="block text-xs font-medium text-gray-500 mb-2">
                {label}
            </label>

            <div className="relative">

                <select
                    value={value}
                    onChange={onChange}
                    className="w-full h-[46px] appearance-none border border-gray-200 rounded-lg px-3 py-2.5 pr-9 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >

                    <option value="">
                        {placeholder}
                    </option>

                    {options.map(
                        (option) => (
                            <option
                                key={
                                    option.value
                                }
                                value={
                                    option.value
                                }
                            >
                                {
                                    option.label
                                }
                            </option>
                        )
                    )}

                </select>

                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />

            </div>

        </div>
    );
}

// ==================================================
// EMPLOYEE AVATAR
// ==================================================

function EmployeeAvatar({
    document
}) {
    const employee =
        document?.employeeId &&
        typeof document.employeeId ===
            "object"
            ? document.employeeId
            : null;

    const first =
        employee?.firstName?.charAt(0) ||
        "";

    const last =
        employee?.lastName?.charAt(0) ||
        "";

    const initials =
        `${first}${last}`.toUpperCase();

    return (
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
            {initials || "NA"}
        </div>
    );
}

// ==================================================
// ACTION BUTTON
// ==================================================

function ActionButton({
    icon,
    title,
    className,
    onClick
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0 ${className}`}
        >
            <i
                className={`${icon} text-xs`}
            />
        </button>
    );
}

// ==================================================
// INFO ROW
// ==================================================

function InfoRow({
    label,
    value
}) {
    return (
        <div className="flex items-start justify-between gap-4">

            <span className="text-sm text-gray-500">
                {label}
            </span>

            <span className="text-sm font-medium text-gray-800 text-right break-words max-w-[60%]">
                {value}
            </span>

        </div>
    );
}

// ==================================================
// UPLOAD DOCUMENT MODAL
// ==================================================

function UploadDocumentModal({
    form,
    employees,
    isSubmitting,
    onChange,
    onClose,
    onSubmit
}) {
    return (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl max-h-[90vh] overflow-hidden animate-[fadeIn_.2s_ease-out]">

                {/* HEADER */}

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Upload Document
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Upload a document for an employee
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={
                            isSubmitting
                        }
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                        aria-label="Close"
                    >
                        <i className="fas fa-times text-sm" />
                    </button>

                </div>

                {/* FORM */}

                <form
                    onSubmit={onSubmit}
                >

                    <div className="p-6 space-y-5">

                        {/* EMPLOYEE */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employee
                            </label>

                            <div className="relative">

                                <select
                                    name="employeeId"
                                    value={
                                        form.employeeId
                                    }
                                    onChange={
                                        onChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                                >

                                    <option value="">
                                        Select employee
                                    </option>

                                    {employees
                                        .map(
                                            (
                                                employee
                                            ) => (
                                                <option
                                                    key={
                                                        employee._id
                                                    }
                                                    value={
                                                        employee._id
                                                    }
                                                >
                                                    {`${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
                                                        employee.employeeCode ||
                                                        "Unknown Employee"}
                                                    {" — "}
                                                    {employee.employeeCode ||
                                                        ""}
                                                </option>
                                            )
                                        )}

                                </select>

                                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />

                            </div>

                        </div>

                        {/* DOCUMENT TYPE */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Document Type
                            </label>

                            <div className="relative">

                                <select
                                    name="documentType"
                                    value={
                                        form.documentType
                                    }
                                    onChange={
                                        onChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                                >

                                    {DOCUMENT_TYPES.map(
                                        (
                                            type
                                        ) => (
                                            <option
                                                key={
                                                    type
                                                }
                                                value={
                                                    type
                                                }
                                            >
                                                {
                                                    type
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />

                            </div>

                        </div>

                        {/* FILE */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File
                            </label>

                            <label
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                                    form.file
                                        ? "border-indigo-300 bg-indigo-50"
                                        : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"
                                } ${
                                    isSubmitting
                                        ? "pointer-events-none opacity-60"
                                        : ""
                                }`}
                            >

                                <input
                                    type="file"
                                    name="file"
                                    onChange={
                                        onChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    className="hidden"
                                />

                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">

                                    <i className="fas fa-cloud-upload-alt text-lg" />

                                </div>

                                {form.file ? (
                                    <>
                                        <p className="text-sm font-medium text-gray-800 break-all">
                                            {
                                                form.file
                                                    .name
                                            }
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatFileSizeStatic(
                                                form.file
                                                    .size
                                            )}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-gray-700">
                                            Click to choose a file
                                        </p>

                                        <p className="text-xs text-gray-400 mt-1">
                                            Maximum file size: 10 MB
                                        </p>
                                    </>
                                )}

                            </label>

                        </div>

                    </div>

                    {/* FOOTER */}

                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                isSubmitting
                            }
                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                isSubmitting
                            }
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60 inline-flex items-center gap-2"
                        >

                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin text-xs" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-upload text-xs" />
                                    Upload Document
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

// ==================================================
// DELETE MODAL
// ==================================================

function DeleteDocumentModal({
    document,
    employeeName,
    isDeleting,
    onClose,
    onConfirm
}) {
    return (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">

                <div className="p-6">

                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">

                        <i className="fas fa-trash-alt text-base" />

                    </div>

                    <h2 className="text-lg font-semibold text-gray-900">
                        Delete Document
                    </h2>

<p className="text-sm text-gray-500 mt-2 leading-6 break-words">
    Are you sure you want to delete{" "}
    <span className="font-medium text-gray-700 break-all">
        {document.fileName}
    </span>{" "}
    belonging to{" "}
    <span className="font-medium text-gray-700">
        {employeeName}
    </span>
    ?
</p>

                    <p className="text-xs text-gray-400 mt-2">
                        The document will be removed from the active document list.
                    </p>

                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={
                            isDeleting
                        }
                        className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={
                            isDeleting
                        }
                        className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-60 inline-flex items-center gap-2"
                    >

                        {isDeleting ? (
                            <>
                                <i className="fas fa-spinner fa-spin text-xs" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash text-xs" />
                                Delete
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
}

// ==================================================
// PAGINATION
// ==================================================

function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange
}) {
    if (totalItems === 0) {
        return null;
    }

    const start =
        (currentPage - 1) *
            itemsPerPage +
        1;

    const end =
        Math.min(
            currentPage *
                itemsPerPage,
            totalItems
        );

    return (
        <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                    {start}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-700">
                    {end}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                    {totalItems}
                </span>{" "}
                documents
            </p>

            <div className="flex items-center gap-1">

                <button
                    type="button"
                    disabled={
                        currentPage ===
                        1
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage -
                                1
                        )
                    }
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                >
                    <i className="fas fa-chevron-left text-[10px]" />
                </button>

                {Array.from(
                    {
                        length: totalPages
                    },
                    (_, index) =>
                        index + 1
                )
                    .slice(
                        Math.max(
                            0,
                            currentPage -
                                3
                        ),
                        Math.min(
                            totalPages,
                            currentPage +
                                2
                        )
                    )
                    .map(
                        (page) => (
                            <button
                                type="button"
                                key={
                                    page
                                }
                                onClick={() =>
                                    onPageChange(
                                        page
                                    )
                                }
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                                    currentPage ===
                                    page
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {
                                    page
                                }
                            </button>
                        )
                    )}

                <button
                    type="button"
                    disabled={
                        currentPage ===
                        totalPages
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage +
                                1
                        )
                    }
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                >
                    <i className="fas fa-chevron-right text-[10px]" />
                </button>

            </div>

        </div>
    );
}

// ==================================================
// LOADING STATE
// ==================================================

function LoadingState() {
    return (
        <div className="py-16 flex flex-col items-center justify-center">

            <i className="fas fa-spinner fa-spin text-indigo-600 text-xl" />

            <p className="text-sm text-gray-500 mt-3">
                Loading documents...
            </p>

        </div>
    );
}

// ==================================================
// ERROR STATE
// ==================================================

function ErrorState({
    message,
    onRetry
}) {
    return (
        <div className="py-16 flex flex-col items-center justify-center text-center px-5">

            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">

                <i className="fas fa-exclamation-triangle text-sm" />

            </div>

            <p className="text-sm font-medium text-gray-800 mt-4">
                Unable to load documents
            </p>

            <p className="text-sm text-gray-500 mt-1 max-w-md">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
                <i className="fas fa-redo mr-2 text-xs" />
                Try Again
            </button>

        </div>
    );
}

// ==================================================
// EMPTY STATE
// ==================================================

function EmptyState({
    hasFilters,
    onClear,
    onUpload
}) {
    return (
        <div className="py-16 flex flex-col items-center justify-center text-center px-5">

            <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center">

                <i className="fas fa-folder-open text-lg" />

            </div>

            <p className="text-sm font-medium text-gray-800 mt-4">
                {hasFilters
                    ? "No documents found"
                    : "No documents uploaded yet"}
            </p>

            <p className="text-sm text-gray-500 mt-1 max-w-md">
                {hasFilters
                    ? "Try changing your search or filters."
                    : "Upload an employee document to get started."}
            </p>

            {hasFilters ? (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    Clear Filters
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onUpload}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                    <i className="fas fa-upload text-xs" />
                    Upload Document
                </button>
            )}

        </div>
    );
}

// ==================================================
// TOAST
// ==================================================

function Toast({
    message,
    type,
    onClose
}) {
    const config = {
        success: {
            icon:
                "fas fa-check-circle",
            className:
                "bg-green-50 border-green-200 text-green-700"
        },

        error: {
            icon:
                "fas fa-exclamation-circle",
            className:
                "bg-red-50 border-red-200 text-red-700"
        },

        info: {
            icon:
                "fas fa-info-circle",
            className:
                "bg-blue-50 border-blue-200 text-blue-700"
        }
    };

    const current =
        config[type] ||
        config.success;

    return (
        <div className="fixed bottom-5 right-5 z-[120] animate-[slideUp_.25s_ease-out]">

            <div
                className={`min-w-[300px] max-w-md border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 ${current.className}`}
            >

                <i
                    className={`${current.icon} text-sm flex-shrink-0`}
                />

                <p className="text-sm font-medium flex-1">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    className="opacity-60 hover:opacity-100 transition"
                    aria-label="Close notification"
                >
                    <i className="fas fa-times text-xs" />
                </button>

            </div>

        </div>
    );
}

// ==================================================
// STATIC FILE SIZE HELPER
// ==================================================

function formatFileSizeStatic(
    bytes
) {
    if (!bytes || bytes <= 0) {
        return "-";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    }

    return `${(
        bytes /
        (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
}

// ==================================================
// EXPORT
// ==================================================

export default DocumentManagement;