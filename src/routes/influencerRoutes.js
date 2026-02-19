const express = require('express');
const router = express.Router();
const {
    submitInfluencerApplication,
    getInfluencerApplications,
    updateInfluencerStatus
} = require('../controllers/influencerController');
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');

// User routes
router.post('/apply', protect, submitInfluencerApplication);

// Admin routes
router.get('/admin/applications', protect, authorizePermissions('influencer_approval'), getInfluencerApplications);
router.put('/admin/application/:id', protect, authorizePermissions('influencer_approval'), updateInfluencerStatus);

module.exports = router;
