const express = require('express');
const router = express.Router();
const { getDropdowns, getUserHistory, getUserRewardHistory, getLatestApplicationStatus, scratchApplicationReward } = require('../controllers/user.controller');
const { protect } = require('../middlewares/authMiddleware');

// Get all dropdown data
router.get('/dropdowns', getDropdowns);

// Get user history
router.get('/history', protect, getUserHistory);

// Get latest application status
router.get('/history/latest', protect, getLatestApplicationStatus);

// Get user reward history
router.get('/rewards', protect, getUserRewardHistory);

// Mark reward as scratched
router.put('/rewards/scratch/:type/:id', protect, scratchApplicationReward);

module.exports = router;
