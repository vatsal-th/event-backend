const express = require('express');
const router = express.Router();
const { createComplaint, getMyComplaints, getComplaint } = require('../controllers/complaintController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/', protect, upload.array('photos', 5), createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/:id', protect, getComplaint);

module.exports = router;