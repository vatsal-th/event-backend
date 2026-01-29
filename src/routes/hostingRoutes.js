const express = require('express');
const router = express.Router();
const {
    submitApplication,
    getApplications,
    updateApplicationStatus
} = require('../controllers/hostingController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

// User routes
router.post('/apply', protect, submitApplication);

// Admin routes
router.get('/admin/applications', protect, authorizeAdmin, getApplications);
router.put('/admin/application/:id', protect, authorizeAdmin, updateApplicationStatus);

module.exports = router;
