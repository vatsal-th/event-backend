const express = require('express');
const router = express.Router();
const {
    submitAgencyApplication,
    getAgencyApplications,
    updateAgencyStatus
} = require('../controllers/agencyController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

// User routes
router.post('/apply', protect, submitAgencyApplication);

// Admin routes
router.get('/admin/applications', protect, authorizeAdmin, getAgencyApplications);
router.put('/admin/application/:id', protect, authorizeAdmin, updateAgencyStatus);

module.exports = router;
