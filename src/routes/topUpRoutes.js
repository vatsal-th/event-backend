const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');
const {
    createTopUp,
    getUserTopUps,
    getAllTopUps,
    updateTopUpStatus
} = require('../controllers/topUpController');

// User Routes
router.post('/create', protect, createTopUp);
router.get('/history', protect, getUserTopUps);

// Admin Routes
router.get('/admin/all', protect, authorizeAdmin, getAllTopUps);
router.put('/admin/update/:id', protect, authorizeAdmin, updateTopUpStatus);

module.exports = router;
