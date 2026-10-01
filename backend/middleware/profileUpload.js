const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/profile folder exists
const uploadDir = path.join(__dirname, "../uploads/profile");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        const ext = path.extname(file.originalname);

        cb(null, `profile-${uniqueSuffix}${ext}`);
    }
});

// Only allow profile images
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg"
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Invalid image type. Only JPG, JPEG and PNG are allowed."),
            false
        );
    }
};

const profileUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = profileUpload;