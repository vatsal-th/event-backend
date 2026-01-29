const express = require('express');
const router = express.Router();
const {
    submitInfluencerApplication,
    getInfluencerApplications,
    updateInfluencerStatus
} = require('../controllers/influencerController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

// User routes
router.post('/apply', protect, submitInfluencerApplication);

// Admin routes
router.get('/admin/applications', protect, authorizeAdmin, getInfluencerApplications);
router.put('/admin/application/:id', protect, authorizeAdmin, updateInfluencerStatus);

module.exports = router;
