const express = require('express');
const router = express.Router();
const {
    submitEventApplication,
    getMyEvents,
    getAllEventApplications,
    updateEventStatus
} = require('../controllers/eventController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// User routes
router.post('/apply', protect, submitEventApplication);
router.get('/my', protect, getMyEvents);

// Admin routes
router.get('/admin/applications', protect, authorizeAdmin, getAllEventApplications);
router.put('/admin/application/:id', protect, authorizeAdmin, upload.single('eventBanner'), updateEventStatus);

module.exports = router;
