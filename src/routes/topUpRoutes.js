const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');
const {
    createTopUp,
    getUserTopUps,
    getAllTopUps,
    updateTopUpStatus,
    getApps,
    updateTopUpQR,
    getTopUpQR,
    deleteTopUpQR
} = require('../controllers/topUpController');
const upload = require('../middlewares/uploadMiddleware');

// User Routes
router.get('/apps', protect, getApps);
router.get('/qr', protect, getTopUpQR);
router.post('/create', protect, upload.single('paymentProof'), createTopUp);
router.get('/history', protect, getUserTopUps);

// Admin Routes
router.post('/admin/qr', protect, authorizeAdmin, upload.single('qrCode'), updateTopUpQR);
router.delete('/admin/qr', protect, authorizeAdmin, deleteTopUpQR);
router.get('/admin/all', protect, authorizeAdmin, getAllTopUps);
router.put('/admin/update/:id', protect, authorizeAdmin, updateTopUpStatus);

module.exports = router;
