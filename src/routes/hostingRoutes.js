const express = require('express');
const router = express.Router();
const {
    submitApplication,
    getApplications,
    updateApplicationStatus
} = require('../controllers/hostingController');
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');

// User routes
router.post('/apply', protect, submitApplication);

// Admin routes
router.get('/admin/applications', protect, authorizePermissions('hosting_approval'), getApplications);
router.put('/admin/application/:id', protect, authorizePermissions('hosting_approval'), updateApplicationStatus);

module.exports = router;
