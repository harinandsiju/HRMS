const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const logActivity = require("../helpers/activityLogger");
const Document = require("../models/Document");
const Employee = require("../models/Employee");
const User = require("../models/User");


// Upload Document (Admin - any employee, Employee - self only)
const uploadDocument = async (req, res) => {
    try {
        const { employeeId, documentType } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        if (!employeeId) {
            // Clean up uploaded file since request is invalid
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                message: "Employee ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        // If the requester is an Employee (not Admin), enforce self-upload only
        if (req.user.role !== "Admin") {
            const user = await User.findById(req.user.userId);

            if (
                !user ||
                !user.employeeId ||
                user.employeeId.toString() !== employeeId
            ) {
                fs.unlinkSync(req.file.path);

                return res.status(403).json({
                    message: "Access Denied. You can only upload your own documents."
                });
            }
        }

        // Check employee exists
        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            fs.unlinkSync(req.file.path);

            return res.status(404).json({
                message: "Active employee not found"
            });
        }

        // Validate documentType if provided
        const validTypes = [
            "ID Proof",
            "Resume",
            "Certificate",
            "Offer Letter",
            "Other"
        ];

        if (documentType && !validTypes.includes(documentType)) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                message: "Invalid document type"
            });
        }

        // Store relative path (not absolute) for portability
        const relativePath = path
            .join("uploads/documents", req.file.filename)
            .replace(/\\/g, "/");

        const document = await Document.create({
            employeeId,
            documentType: documentType || "Other",
            fileName: req.file.originalname,
            filePath: relativePath,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user.userId
        });

        await logActivity({
            userId: req.user.userId,
            employeeId: employeeId,
            action: "Document Uploaded",
            module: "Document",
            description: `Document uploaded for ${employee.firstName} ${employee.lastName} (${documentType || "Other"})`,
            req
        });

        return res.status(201).json({
            message: "Document uploaded successfully",
            document
        });

    } catch (error) {
        console.error("Upload Document Error:", error);

        // Clean up file if something failed after upload
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get Documents by Employee (Admin)
const getDocumentsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }

        const documents = await Document.find({
            employeeId,
            isActive: true
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Documents fetched successfully",
            count: documents.length,
            documents
        });

    } catch (error) {
        console.error("Get Documents By Employee Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get My Documents (Employee - self only)
const getMyDocuments = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user"
            });
        }

        const documents = await Document.find({
            employeeId: user.employeeId,
            isActive: true
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "My documents fetched successfully",
            count: documents.length,
            documents
        });

    } catch (error) {
        console.error("Get My Documents Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Soft Delete Document (Admin - any document, Employee - own document only)
const deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({
                message: "Invalid document ID"
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            isActive: true
        });

        if (!document) {
            return res.status(404).json({
                message: "Active document not found"
            });
        }

        // Employee can delete only their own document
        if (req.user.role !== "Admin") {
            const user = await User.findById(req.user.userId);

            if (
                !user ||
                !user.employeeId ||
                user.employeeId.toString() !==
                    document.employeeId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "Access Denied. You can only delete your own documents."
                });
            }
        }

        // Soft delete
        document.isActive = false;

        await document.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: document.employeeId,
            action: "Document Deleted",
            module: "Document",
            description: "Document deleted",
            req
        });

        return res.status(200).json({
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("Delete Document Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    uploadDocument,
    getDocumentsByEmployee,
    getMyDocuments,
    deleteDocument
};