const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');
const { 
    uploadSalaryCSV, 
    getSalaryRecords, 
    clearSalaryRecords,
    searchUserSalary,
} = require('../controllers/salaryController');

// Multer Storage Configuration (Memory storage)
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.csv') {
            return cb(new Error('Only CSV files are allowed'), false);
        }
        cb(null, true);
    }
});

// Admin Routes for Salary Management
router.post('/upload', protect, authorizeAdmin, upload.single('file'), uploadSalaryCSV);
router.get('/records', protect, authorizeAdmin, getSalaryRecords);
router.delete('/records', protect, authorizeAdmin, clearSalaryRecords);

// User Route (Protected) - Search by Talent ID
router.get('/search', protect, searchUserSalary);

module.exports = router;
