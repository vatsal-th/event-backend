const express = require('express');
const router = express.Router();
const {
    submitAgencyApplication,
    getAgencyApplications,
    updateAgencyStatus
} = require('../controllers/agencyController');
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');

// User routes
router.post('/apply', protect, submitAgencyApplication);

// Admin routes
router.get('/admin/applications', protect, authorizePermissions('agency_approval'), getAgencyApplications);
router.put('/admin/application/:id', protect, authorizePermissions('agency_approval'), updateAgencyStatus);

module.exports = router;
