const express = require('express');
const router = express.Router();
const {
    submitEventApplication,
    getMyEvents,
    getAllEventApplications,
    updateEventStatus
} = require('../controllers/eventController');
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// User routes
router.post('/apply', protect, submitEventApplication);
router.get('/my', protect, getMyEvents);

// Admin routes
router.get('/admin/applications', protect, authorizePermissions('event_approval'), getAllEventApplications);
router.put('/admin/application/:id', protect, authorizePermissions('event_approval'), upload.single('eventBanner'), updateEventStatus);

module.exports = router;
