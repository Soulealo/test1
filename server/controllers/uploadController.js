const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, safeName);
    }
});

function fileFilter(req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtension = /\.(jpe?g|png|webp)$/i.test(file.originalname);

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtension) {
        return cb(null, true);
    }

    return cb(new Error('Зөвхөн JPG, JPEG, PNG, WEBP зураг оруулна уу.'));
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        files: 12,
        fileSize: 5 * 1024 * 1024
    }
});

function uploadImages(req, res) {
    const files = req.files || [];

    if (files.length === 0) {
        return res.status(400).json({ message: 'Зураг сонгоно уу.' });
    }

    return res.status(201).json({
        images: files.map(file => `/uploads/${file.filename}`)
    });
}

module.exports = {
    upload,
    uploadImages
};
