const express = require('express');
const router = express.Router();
const { getAllComplaints, resolveComplaint, getAdminComplaint } = require('../controllers/complaintController');
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');

router.get('/', protect, authorizePermissions('complaints_manage'), getAllComplaints);
router.get('/:id', protect, authorizePermissions('complaints_manage'), getAdminComplaint);
router.put('/:id/resolve', protect, authorizePermissions('complaints_manage'), resolveComplaint);

module.exports = router;