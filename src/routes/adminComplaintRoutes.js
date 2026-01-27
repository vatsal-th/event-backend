const express = require('express');
const router = express.Router();
const { getAllComplaints, resolveComplaint, getAdminComplaint } = require('../controllers/complaintController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

router.get('/', protect, authorizeAdmin, getAllComplaints);
router.get('/:id', protect, authorizeAdmin, getAdminComplaint);
router.put('/:id/resolve', protect, authorizeAdmin, resolveComplaint);

module.exports = router;