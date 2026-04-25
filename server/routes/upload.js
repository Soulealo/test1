const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { upload, uploadImages } = require('../controllers/uploadController');

const router = express.Router();

router.post('/upload', requireAdmin, (req, res) => {
    upload.array('images', 12)(req, res, error => {
        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return uploadImages(req, res);
    });
});

module.exports = router;
