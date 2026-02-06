const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getUserReferralStats,
    getLeaderboard,
    getUserReferralHistory,
} = require('../controllers/referralController');

// All routes are protected (require authentication)
router.get('/stats', protect, getUserReferralStats);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/history', protect, getUserReferralHistory);

module.exports = router;
