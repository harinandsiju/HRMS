const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "hrms/profile",
        allowed_formats: [
            "jpg",
            "jpeg",
            "png"
        ],
        transformation: [
            {
                width: 500,
                height: 500,
                crop: "limit"
            }
        ]
    }
});

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
            new Error(
                "Invalid image type. Only JPG, JPEG and PNG are allowed."
            ),
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