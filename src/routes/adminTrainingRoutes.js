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
const { protect, authorizePermissions } = require('../middlewares/authMiddleware');

// Training App Routes
router.get('/training-apps', protect, authorizePermissions('training_manage'), getAllTrainingApps);
router.post('/training-apps', protect, authorizePermissions('training_manage'), createTrainingApp);
router.put('/training-apps/:id', protect, authorizePermissions('training_manage'), updateTrainingApp);
router.delete('/training-apps/:id', protect, authorizePermissions('training_manage'), deleteTrainingApp);

// Training Video Routes
router.get('/training-apps/:appId/videos', protect, authorizePermissions('training_manage'), getAllVideosForApp);
router.post('/training-apps/:appId/videos', protect, authorizePermissions('training_manage'), createTrainingVideo);
router.delete('/videos/:id', protect, authorizePermissions('training_manage'), deleteTrainingVideo);

module.exports = router;
