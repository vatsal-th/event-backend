const express = require('express');
const router = express.Router();
const { getDropdowns, getUserHistory } = require('../controllers/user.controller');
const { protect } = require('../middlewares/authMiddleware');

// Get all dropdown data
router.get('/dropdowns', getDropdowns);

// Get user history
router.get('/history', protect, getUserHistory);

module.exports = router;
