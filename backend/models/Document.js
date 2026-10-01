const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        documentType: {
            type: String,
            enum: [
                "ID Proof",
                "Resume",
                "Certificate",
                "Offer Letter",
                "Other"
            ],
            default: "Other"
        },

        fileName: {
            type: String,
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        fileSize: {
            type: Number
        },

        mimeType: {
            type: String
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;