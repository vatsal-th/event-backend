const express = require('express');
const router = express.Router();
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');
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
router.get('/admin/all', protect, authorizePermissions('bank_manage'), getAllBankDetails);
router.put('/admin/:id/verify', protect, authorizePermissions('bank_manage'), verifyBankDetails);

module.exports = router;
