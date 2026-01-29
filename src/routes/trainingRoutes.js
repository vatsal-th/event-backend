const express = require('express');
const router = express.Router();
const {
    getTrainingApps,
    getTrainingVideos
} = require('../controllers/trainingAppController');
const { protect } = require('../middlewares/authMiddleware');

// User Training App Routes
router.get('/', protect, getTrainingApps);
router.get('/:appId/videos', protect, getTrainingVideos);

module.exports = router;
