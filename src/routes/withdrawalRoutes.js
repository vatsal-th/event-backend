const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');
const {
    createWithdrawalRequest,
    getUserWithdrawals,
    getWithdrawalStatus,
    getAllWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    getWithdrawalStats,
} = require('../controllers/withdrawalController');

// User routes
router.post('/', protect, createWithdrawalRequest);
router.get('/', protect, getUserWithdrawals);
router.get('/:id', protect, getWithdrawalStatus);

// Admin routes
router.get('/admin/all', protect, authorizeAdmin, getAllWithdrawals);
router.put('/admin/:id/approve', protect, authorizeAdmin, approveWithdrawal);
router.put('/admin/:id/reject', protect, authorizeAdmin, rejectWithdrawal);
router.get('/admin/stats/summary', protect, authorizeAdmin, getWithdrawalStats);

module.exports = router;
