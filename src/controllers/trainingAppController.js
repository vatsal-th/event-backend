const TrainingApp = require('../models/TrainingApp');
const TrainingVideo = require('../models/TrainingVideo');
const ActivityLog = require('../models/activityLogModel');

// ============================================
// ADMIN GET CONTROLLERS
// ============================================

// @desc    Get all training apps (Admin only)
// @route   GET /api/admin/training-apps
// @access  Private (Admin)
exports.getAllTrainingApps = async (req, res) => {
    try {
        const trainingApps = await TrainingApp.find()
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json(trainingApps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all videos for a training app (Admin only)
// @route   GET /api/admin/training-apps/:appId/videos
// @access  Private (Admin)
exports.getAllVideosForApp = async (req, res) => {
    const { appId } = req.params;

    try {
        const trainingVideos = await TrainingVideo.find({ appId })
            .populate('createdBy', 'fullName email')
            .sort({ order: 1, createdAt: 1 });

        res.status(200).json(trainingVideos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// ADMIN TRAINING APP CONTROLLERS
// ============================================

// @desc    Create training app (Admin only)
// @route   POST /api/admin/training-apps
// @access  Private (Admin)
exports.createTrainingApp = async (req, res) => {
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Please provide a title' });
    }

    try {
        const trainingApp = await TrainingApp.create({
            title,
            description,
            createdBy: req.user._id
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Created Training App',
            details: `Created training app: ${trainingApp.title}`
        });

        res.status(201).json(trainingApp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update training app (Admin only)
// @route   PUT /api/admin/training-apps/:id
// @access  Private (Admin)
exports.updateTrainingApp = async (req, res) => {
    const { title, description, isActive } = req.body;

    try {
        const trainingApp = await TrainingApp.findById(req.params.id);

        if (!trainingApp) {
            return res.status(404).json({ message: 'Training app not found' });
        }

        // Update fields
        if (title !== undefined) trainingApp.title = title;
        if (description !== undefined) trainingApp.description = description;
        if (isActive !== undefined) trainingApp.isActive = isActive;

        await trainingApp.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated Training App',
            details: `Updated training app: ${trainingApp.title}`
        });

        res.status(200).json(trainingApp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete training app (Admin only)
// @route   DELETE /api/admin/training-apps/:id
// @access  Private (Admin)
exports.deleteTrainingApp = async (req, res) => {
    try {
        const trainingApp = await TrainingApp.findById(req.params.id);

        if (!trainingApp) {
            return res.status(404).json({ message: 'Training app not found' });
        }

        // Log activity before deleting
        await ActivityLog.create({
            user: req.user._id,
            action: 'Deleted Training App',
            details: `Deleted training app: ${trainingApp.title}`
        });

        // Delete associated videos
        await TrainingVideo.deleteMany({ appId: req.params.id });

        // Delete training app
        await TrainingApp.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Training app and associated videos deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// ADMIN TRAINING VIDEO CONTROLLERS
// ============================================

// @desc    Create training video (Admin only)
// @route   POST /api/admin/training-apps/:appId/videos
// @access  Private (Admin)
exports.createTrainingVideo = async (req, res) => {
    const { title, description, videoUrl, duration, order } = req.body;
    const { appId } = req.params;

    if (!title || !videoUrl) {
        return res.status(400).json({ message: 'Please provide title and video URL' });
    }

    try {
        // Check if training app exists
        const trainingApp = await TrainingApp.findById(appId);
        if (!trainingApp) {
            return res.status(404).json({ message: 'Training app not found' });
        }

        const trainingVideo = await TrainingVideo.create({
            appId,
            title,
            description,
            videoUrl,
            duration,
            order,
            createdBy: req.user._id
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Created Training Video',
            details: `Created video: ${trainingVideo.title} for app: ${trainingApp.title}`
        });

        res.status(201).json(trainingVideo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete training video (Admin only)
// @route   DELETE /api/admin/videos/:id
// @access  Private (Admin)
exports.deleteTrainingVideo = async (req, res) => {
    try {
        const trainingVideo = await TrainingVideo.findById(req.params.id);

        if (!trainingVideo) {
            return res.status(404).json({ message: 'Training video not found' });
        }

        // Log activity before deleting
        await ActivityLog.create({
            user: req.user._id,
            action: 'Deleted Training Video',
            details: `Deleted video: ${trainingVideo.title}`
        });

        await TrainingVideo.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Training video deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// USER TRAINING APP CONTROLLERS
// ============================================

// @desc    Get all active training apps (User)
// @route   GET /api/training-apps
// @access  Private
exports.getTrainingApps = async (req, res) => {
    try {
        const trainingApps = await TrainingApp.find({ isActive: true })
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json(trainingApps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active videos for a training app (User)
// @route   GET /api/training-apps/:appId/videos
// @access  Private
exports.getTrainingVideos = async (req, res) => {
    const { appId } = req.params;

    try {
        // Check if training app exists and is active
        const trainingApp = await TrainingApp.findOne({ _id: appId, isActive: true });
        if (!trainingApp) {
            return res.status(404).json({ message: 'Training app not found or inactive' });
        }

        const trainingVideos = await TrainingVideo.find({ appId, isActive: true })
            .populate('createdBy', 'fullName email')
            .sort({ order: 1, createdAt: 1 });

        res.status(200).json(trainingVideos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
