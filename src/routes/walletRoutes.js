const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getWalletTransactions,
    getWalletSummary,
    getTransactionsByType,
} = require('../controllers/walletController');

// All routes are protected (require authentication)
router.get('/transactions', protect, getWalletTransactions);
router.get('/summary', protect, getWalletSummary);
router.get('/transactions/:type', protect, getTransactionsByType);

module.exports = router;
