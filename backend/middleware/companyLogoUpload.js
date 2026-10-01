const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "hrms/company",
        allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp"
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
    "image/webp"
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, PNG and WEBP images are allowed."
            ),
            false
        );
    }
};

const companyLogoUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = companyLogoUpload;