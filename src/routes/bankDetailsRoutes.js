const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');
const {
    addOrUpdateBankDetails,
    getBankDetails,
    deleteBankDetails,
    getAllBankDetails,
    verifyBankDetails,
} = require('../controllers/bankDetailsController');

// User routes (Base path: /api/bank-details)
router.post('/', protect, addOrUpdateBankDetails);
router.get('/', protect, getBankDetails);
router.delete('/', protect, deleteBankDetails);

// Admin routes (Base path: /api/bank-details)
router.get('/admin/all', protect, authorizeAdmin, getAllBankDetails);
router.put('/admin/:id/verify', protect, authorizeAdmin, verifyBankDetails);

module.exports = router;
