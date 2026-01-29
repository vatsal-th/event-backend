const InfluencerApplication = require('../models/InfluencerApplication');
const { issueApplicationReward } = require('../utils/rewardHelper');
const ActivityLog = require('../models/activityLogModel');

// @desc    Submit influencer application
// @route   POST /api/influencer/apply
// @access  Private (User)
exports.submitInfluencerApplication = async (req, res) => {
    const {
        fullName,
        entryDate,
        whatsAppNumber,
        countryId,
        gender,
        socialMediaId,
        instagramFollowers,
        instagramLink
    } = req.body;

    if (!fullName || !entryDate || !whatsAppNumber || !countryId || !gender || !socialMediaId || !instagramFollowers || !instagramLink) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const application = await InfluencerApplication.create({
            fullName,
            entryDate,
            whatsAppNumber,
            countryId,
            gender,
            socialMediaId,
            instagramFollowers,
            instagramLink,
            userId: req.user._id
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Submitted Influencer Application',
            details: `User applied for influencer: ${fullName} (${whatsAppNumber})`
        });

        res.status(201).json({
            success: true,
            message: 'Influencer application submitted successfully',
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all influencer applications (Admin only)
// @route   GET /api/admin/influencer/applications
// @access  Private (Admin)
exports.getInfluencerApplications = async (req, res) => {
    try {
        const applications = await InfluencerApplication.find()
            .populate('countryId', 'name')
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update influencer application status (Admin only)
// @route   PUT /api/admin/influencer/application/:id
// @access  Private (Admin)
exports.updateInfluencerStatus = async (req, res) => {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const application = await InfluencerApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (status === 'Approved' && application.status !== 'Approved') {
            // Award points using common utility
            const rewardPoints = await issueApplicationReward(
                application.userId,
                req.user._id,
                application._id,
                'Influencer',
                application.fullName
            );

            application._rewardPoints = rewardPoints;
        }

        application.status = status;
        await application.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated Influencer Status',
            details: `Influencer application for ${application.fullName} marked as ${status}`
        });

        res.status(200).json({
            success: true,
            message: `Influencer application ${status.toLowerCase()} successfully${application._rewardPoints ? ` and ${application._rewardPoints} points awarded` : ''}`,
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
