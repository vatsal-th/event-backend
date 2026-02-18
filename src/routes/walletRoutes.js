const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getWalletTransactions,
    getWalletSummary,
    getTransactionsByType,
    setWalletPassword,
    getWalletPasswordStatus,
} = require('../controllers/walletController');

// All routes are protected (require authentication)
router.get('/transactions', protect, getWalletTransactions);
router.get('/summary', protect, getWalletSummary);
router.get('/transactions/:type', protect, getTransactionsByType);

// Wallet Password Routes
router.post('/password', protect, setWalletPassword);
router.get('/password-status', protect, getWalletPasswordStatus);

module.exports = router;
