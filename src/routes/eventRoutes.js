const express = require('express');
const router = express.Router();
const {
    submitEventApplication,
    getAllEventApplications,
    updateEventStatus
} = require('../controllers/eventController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

// User routes
router.post('/apply', protect, submitEventApplication);

// Admin routes
router.get('/admin/applications', protect, authorizeAdmin, getAllEventApplications);
router.put('/admin/application/:id', protect, authorizeAdmin, updateEventStatus);

module.exports = router;
