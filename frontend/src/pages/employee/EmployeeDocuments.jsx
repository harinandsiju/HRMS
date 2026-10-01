import { useEffect, useState } from "react";
import api from "../../api/axios";

const documentTypes = [
    "ID Proof",
    "Resume",
    "Certificate",
    "Offer Letter",
    "Other"
];

const EmployeeDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [documentType, setDocumentType] = useState("Other");
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: ""
    });

    const showToast = (message, type = "success") => {
        setToast({
            show: true,
            message,
            type
        });

        setTimeout(() => {
            setToast({
                show: false,
                message: "",
                type: ""
            });
        }, 3000);
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/documents/my-documents");

            setDocuments(response.data.documents || []);
        } catch (err) {
            console.error("Fetch Documents Error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load documents."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (!file) {
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            showToast("Please select a file.", "error");
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();

            formData.append("file", selectedFile);
            formData.append("documentType", documentType);

            const profileResponse = await api.get("/profile");

            console.log("PROFILE RESPONSE:", profileResponse.data);

            const employeeId = profileResponse.data.profile?._id;

            console.log("EMPLOYEE ID:", employeeId);

            if (!employeeId) {
                showToast(
                    "Employee profile is not linked correctly.",
                    "error"
                );
                return;
            }

            formData.append("employeeId", employeeId);

            await api.post("/documents", formData);

            showToast("Document uploaded successfully.");

            setShowUploadModal(false);
            setSelectedFile(null);
            setDocumentType("Other");

            await fetchDocuments();
        } catch (err) {
            console.error("Upload Document Error:", err);

            showToast(
                err.response?.data?.message ||
                "Failed to upload document.",
                "error"
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteClick = (document) => {
        setSelectedDocument(document);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedDocument) return;

        try {
            setDeleting(true);

            await api.delete(
                `/documents/${selectedDocument._id}`
            );

            showToast("Document deleted successfully.");

            setShowDeleteModal(false);
            setSelectedDocument(null);

            await fetchDocuments();
        } catch (err) {
            console.error("Delete Document Error:", err);

            showToast(
                err.response?.data?.message ||
                "Failed to delete document.",
                "error"
            );
        } finally {
            setDeleting(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "Unknown size";

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getFileExtension = (fileName) => {
        if (!fileName) return "FILE";

        const parts = fileName.split(".");

        return parts.length > 1
            ? parts[parts.length - 1].toUpperCase()
            : "FILE";
    };

    const getDocumentIcon = (mimeType) => {
        if (!mimeType) return "📄";

        if (mimeType.includes("pdf")) {
            return "📕";
        }

        if (mimeType.includes("image")) {
            return "🖼️";
        }

        if (
            mimeType.includes("word") ||
            mimeType.includes("document")
        ) {
            return "📘";
        }

        return "📄";
    };

const getFileUrl = (filePath) => {
    if (!filePath) return "#";

    if (/^https?:\/\//i.test(filePath)) {
        return filePath;
    }

    return `${api.defaults.baseURL}/${filePath.replace(/^\/+/, "")}`;
};

    return (
        <div className="employee-documents-page">

            {/* Toast */}
            {toast.show && (
                <div
                    style={{
                        position: "fixed",
                        top: "24px",
                        right: "24px",
                        zIndex: 9999,
                        padding: "14px 20px",
                        borderRadius: "10px",
                        background:
                            toast.type === "error"
                                ? "#dc2626"
                                : "#16a34a",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: "500",
                        boxShadow:
                            "0 8px 24px rgba(0,0,0,0.15)"
                    }}
                >
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "28px"
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "28px",
                            fontWeight: "700",
                            color: "#1f2937"
                        }}
                    >
                        Documents
                    </h1>

                    <p
                        style={{
                            marginTop: "6px",
                            color: "#6b7280",
                            fontSize: "14px"
                        }}
                    >
                        Manage and access your documents
                    </p>
                </div>

                <button
                    onClick={() => setShowUploadModal(true)}
                    style={{
                        border: "none",
                        background: "#6c5ce7",
                        color: "#fff",
                        padding: "12px 20px",
                        borderRadius: "9px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    + Upload Document
                </button>
            </div>

            {/* Summary card */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: "14px",
                    padding: "22px 24px",
                    marginBottom: "24px",
                    border: "1px solid #eeeef5",
                    boxShadow:
                        "0 4px 15px rgba(0,0,0,0.04)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                    }}
                >
                    <div
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "12px",
                            background: "#f0edff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px"
                        }}
                    >
                        📁
                    </div>

                    <div>
                        <p
                            style={{
                                margin: 0,
                                color: "#6b7280",
                                fontSize: "13px"
                            }}
                        >
                            Total Documents
                        </p>

                        <h2
                            style={{
                                margin: "4px 0 0",
                                fontSize: "24px",
                                color: "#1f2937"
                            }}
                        >
                            {documents.length}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        marginBottom: "20px"
                    }}
                >
                    {error}
                </div>
            )}

            {/* Loading / Documents */}
            {loading ? (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "14px",
                        padding: "50px",
                        textAlign: "center",
                        color: "#6b7280"
                    }}
                >
                    Loading documents...
                </div>
            ) : documents.length === 0 ? (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "14px",
                        padding: "70px 30px",
                        textAlign: "center",
                        border: "1px solid #eeeef5"
                    }}
                >
                    <div
                        style={{
                            fontSize: "48px",
                            marginBottom: "15px"
                        }}
                    >
                        📂
                    </div>

                    <h3
                        style={{
                            margin: "0 0 8px",
                            color: "#1f2937"
                        }}
                    >
                        No documents yet
                    </h3>

                    <p
                        style={{
                            margin: "0 0 22px",
                            color: "#6b7280",
                            fontSize: "14px"
                        }}
                    >
                        Upload your first document to get started.
                    </p>

                    <button
                        onClick={() => setShowUploadModal(true)}
                        style={{
                            border: "none",
                            background: "#6c5ce7",
                            color: "#fff",
                            padding: "11px 18px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        Upload Document
                    </button>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "20px"
                    }}
                >
                    {documents.map((document) => (
                        <div
                            key={document._id}
                            style={{
                                background: "#fff",
                                borderRadius: "14px",
                                padding: "20px",
                                border: "1px solid #eeeef5",
                                boxShadow:
                                    "0 4px 15px rgba(0,0,0,0.04)"
                            }}
                        >
                            {/* File header */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    marginBottom: "18px"
                                }}
                            >
                                <div
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "10px",
                                        background: "#f4f2ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "23px"
                                    }}
                                >
                                    {getDocumentIcon(
                                        document.mimeType
                                    )}
                                </div>

                                <div
                                    style={{
                                        minWidth: 0,
                                        flex: 1
                                    }}
                                >
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: "15px",
                                            fontWeight: "600",
                                            color: "#1f2937",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}
                                        title={document.fileName}
                                    >
                                        {document.fileName}
                                    </h3>

                                    <span
                                        style={{
                                            display: "inline-block",
                                            marginTop: "5px",
                                            padding: "4px 8px",
                                            borderRadius: "5px",
                                            background: "#f0edff",
                                            color: "#6c5ce7",
                                            fontSize: "11px",
                                            fontWeight: "600"
                                        }}
                                    >
                                        {document.documentType}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div
                                style={{
                                    borderTop:
                                        "1px solid #f0f0f5",
                                    paddingTop: "15px",
                                    marginBottom: "18px"
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        marginBottom: "8px",
                                        fontSize: "13px"
                                    }}
                                >
                                    <span style={{ color: "#6b7280" }}>
                                        File type
                                    </span>

                                    <span
                                        style={{
                                            color: "#374151",
                                            fontWeight: "500"
                                        }}
                                    >
                                        {getFileExtension(
                                            document.fileName
                                        )}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        marginBottom: "8px",
                                        fontSize: "13px"
                                    }}
                                >
                                    <span style={{ color: "#6b7280" }}>
                                        Size
                                    </span>

                                    <span
                                        style={{
                                            color: "#374151",
                                            fontWeight: "500"
                                        }}
                                    >
                                        {formatFileSize(
                                            document.fileSize
                                        )}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        fontSize: "13px"
                                    }}
                                >
                                    <span style={{ color: "#6b7280" }}>
                                        Uploaded
                                    </span>

                                    <span
                                        style={{
                                            color: "#374151",
                                            fontWeight: "500"
                                        }}
                                    >
                                        {formatDate(
                                            document.createdAt
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px"
                                }}
                            >
                                <a
                                    href={getFileUrl(
                                        document.filePath
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        flex: 1,
                                        display: "block",
                                        textAlign: "center",
                                        textDecoration: "none",
                                        background: "#6c5ce7",
                                        color: "#fff",
                                        padding: "10px",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "600"
                                    }}
                                >
                                    View Document
                                </a>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDeleteClick(document)
                                    }
                                    style={{
                                        flex: 1,
                                        border: "1px solid #fecaca",
                                        background: "#fff",
                                        color: "#dc2626",
                                        padding: "10px",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background:
                            "rgba(15, 23, 42, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9998,
                        padding: "20px"
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "480px",
                            background: "#fff",
                            borderRadius: "16px",
                            padding: "28px",
                            boxShadow:
                                "0 20px 50px rgba(0,0,0,0.18)"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                                marginBottom: "24px"
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "20px",
                                    color: "#1f2937"
                                }}
                            >
                                Upload Document
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowUploadModal(false)
                                }
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "22px",
                                    color: "#6b7280",
                                    cursor: "pointer"
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpload}>
                            <div
                                style={{
                                    marginBottom: "20px"
                                }}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "7px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        color: "#374151"
                                    }}
                                >
                                    Document Type
                                </label>

                                <select
                                    value={documentType}
                                    onChange={(e) =>
                                        setDocumentType(
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "11px 12px",
                                        border:
                                            "1px solid #d9d9e5",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        outline: "none"
                                    }}
                                >
                                    {documentTypes.map((type) => (
                                        <option
                                            key={type}
                                            value={type}
                                        >
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div
                                style={{
                                    marginBottom: "24px"
                                }}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "7px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        color: "#374151"
                                    }}
                                >
                                    Select File
                                </label>

                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    style={{
                                        width: "100%",
                                        fontSize: "13px"
                                    }}
                                />

                                {selectedFile && (
                                    <p
                                        style={{
                                            marginTop: "8px",
                                            marginBottom: 0,
                                            color: "#6b7280",
                                            fontSize: "12px"
                                        }}
                                    >
                                        Selected:{" "}
                                        {selectedFile.name}
                                    </p>
                                )}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px"
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowUploadModal(false)
                                    }
                                    style={{
                                        flex: 1,
                                        padding: "11px",
                                        border:
                                            "1px solid #ddd",
                                        background: "#fff",
                                        color: "#374151",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    style={{
                                        flex: 1,
                                        padding: "11px",
                                        border: "none",
                                        background:
                                            uploading
                                                ? "#aaa"
                                                : "#6c5ce7",
                                        color: "#fff",
                                        borderRadius: "8px",
                                        cursor: uploading
                                            ? "not-allowed"
                                            : "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    {uploading
                                        ? "Uploading..."
                                        : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedDocument && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background:
                            "rgba(15, 23, 42, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "420px",
                            background: "#fff",
                            borderRadius: "16px",
                            padding: "28px",
                            boxShadow:
                                "0 20px 50px rgba(0,0,0,0.18)"
                        }}
                    >
                        <h2
                            style={{
                                margin: "0 0 10px",
                                fontSize: "20px",
                                color: "#1f2937"
                            }}
                        >
                            Delete Document?
                        </h2>

                        <p
                            style={{
                                margin: "0 0 8px",
                                color: "#6b7280",
                                fontSize: "14px",
                                lineHeight: "1.5"
                            }}
                        >
                            Are you sure you want to delete this
                            document?
                        </p>

                        <p
                            style={{
                                margin: "0 0 24px",
                                color: "#374151",
                                fontSize: "14px",
                                fontWeight: "600",
                                wordBreak: "break-word"
                            }}
                        >
                            {selectedDocument.fileName}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px"
                            }}
                        >
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedDocument(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    border:
                                        "1px solid #ddd",
                                    background: "#fff",
                                    color: "#374151",
                                    borderRadius: "8px",
                                    cursor: deleting
                                        ? "not-allowed"
                                        : "pointer",
                                    fontWeight: "600"
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    border: "none",
                                    background: deleting
                                        ? "#aaa"
                                        : "#dc2626",
                                    color: "#fff",
                                    borderRadius: "8px",
                                    cursor: deleting
                                        ? "not-allowed"
                                        : "pointer",
                                    fontWeight: "600"
                                }}
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDocuments;