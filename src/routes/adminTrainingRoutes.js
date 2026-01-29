const express = require('express');
const router = express.Router();
const {
    getAllTrainingApps,
    getAllVideosForApp,
    createTrainingApp,
    updateTrainingApp,
    deleteTrainingApp,
    createTrainingVideo,
    deleteTrainingVideo
} = require('../controllers/trainingAppController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

// Training App Routes
router.get('/training-apps', protect, authorizeAdmin, getAllTrainingApps);
router.post('/training-apps', protect, authorizeAdmin, createTrainingApp);
router.put('/training-apps/:id', protect, authorizeAdmin, updateTrainingApp);
router.delete('/training-apps/:id', protect, authorizeAdmin, deleteTrainingApp);

// Training Video Routes
router.get('/training-apps/:appId/videos', protect, authorizeAdmin, getAllVideosForApp);
router.post('/training-apps/:appId/videos', protect, authorizeAdmin, createTrainingVideo);
router.delete('/videos/:id', protect, authorizeAdmin, deleteTrainingVideo);

module.exports = router;
