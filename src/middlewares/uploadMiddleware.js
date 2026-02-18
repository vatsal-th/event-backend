const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: (req, file) => {
            if (req.originalUrl.includes('event')) return 'events';
            if (req.originalUrl.includes('app')) return 'apps';
            if (req.originalUrl.includes('complaint')) return 'complaints';
            if (req.originalUrl.includes('topup')) return 'topups';
            return 'general';
        },
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    },
});

// Upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Max 5 files
    }
});

module.exports = upload;