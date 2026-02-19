const express = require('express');
const router = express.Router();
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');
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
router.get('/admin/all', protect, authorizePermissions('withdrawal_manage'), getAllWithdrawals);
router.put('/admin/:id/approve', protect, authorizePermissions('withdrawal_manage'), approveWithdrawal);
router.put('/admin/:id/reject', protect, authorizePermissions('withdrawal_manage'), rejectWithdrawal);
router.get('/admin/stats/summary', protect, authorizePermissions('withdrawal_manage'), getWithdrawalStats);

module.exports = router;
