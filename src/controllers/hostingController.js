const HostingApplication = require('../models/HostingApplication');
const EventApplication = require('../models/EventApplication');
const User = require('../models/userModel');
const ActivityLog = require('../models/activityLogModel');
const { issueApplicationReward } = require('../utils/rewardHelper');

// @desc    Submit hosting application
// @route   POST /api/hosting/apply
// @access  Private (User)
exports.submitApplication = async (req, res) => {
    const {
        fullName,
        mobileNumber,
        countryId,
        gender,
        categoryId,
        talent,
        appId,
        inviterId
    } = req.body;

    if (!fullName || !mobileNumber || !countryId || !gender || !categoryId || !talent || !appId) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const application = await HostingApplication.create({
            fullName,
            mobileNumber,
            countryId,
            gender,
            categoryId,
            talent,
            appId,
            inviterId,
            userId: req.user._id
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Submitted Hosting Application',
            details: `User applied for hosting: ${fullName} (${mobileNumber})`
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all applications (Admin only)
// @route   GET /api/admin/hosting/applications
// @access  Private (Admin)
exports.getApplications = async (req, res) => {
    try {
        const applications = await HostingApplication.find()
            .populate('countryId', 'name')
            .populate('categoryId', 'name')
            .populate('appId', 'appName')
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

// @desc    Update application status (Admin only)
// @route   PUT /api/admin/hosting/application/:id
// @access  Private (Admin)
exports.updateApplicationStatus = async (req, res) => {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const application = await HostingApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (status === 'Approved' && application.status !== 'Approved') {
            // Award points using common utility
            const rewardPoints = await issueApplicationReward(
                application.userId,
                req.user._id,
                application._id,
                'Hosting',
                application.fullName
            );

            // Save reward points to application
            application.rewardPoints = rewardPoints;
        }

        application.status = status;
        await application.save();

        // Log status change
        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated Application Status',
            details: `Hosting application for ${application.fullName} marked as ${status}`
        });

        res.status(200).json({
            success: true,
            message: `Application ${status.toLowerCase()} successfully${application.rewardPoints ? ` and ${application.rewardPoints} points awarded` : ''}`,
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
