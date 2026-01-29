const AgencyApplication = require('../models/AgencyApplication');
const { issueApplicationReward } = require('../utils/rewardHelper');
const ActivityLog = require('../models/activityLogModel');

// @desc    Submit agency application
// @route   POST /api/agency/apply
// @access  Private (User)
exports.submitAgencyApplication = async (req, res) => {
    const {
        fullName,
        mobileNumber,
        countryId,
        gender,
        agencyName,
        minHostRequirement,
        appId,
        inviterId
    } = req.body;

    if (!fullName || !mobileNumber || !countryId || !gender || !agencyName || !minHostRequirement || !appId) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const application = await AgencyApplication.create({
            fullName,
            mobileNumber,
            countryId,
            gender,
            agencyName,
            minHostRequirement,
            appId,
            inviterId,
            userId: req.user._id
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Submitted Agency Application',
            details: `User applied for agency: ${agencyName} (${mobileNumber})`
        });

        res.status(201).json({
            success: true,
            message: 'Agency application submitted successfully',
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all agency applications (Admin only)
// @route   GET /api/admin/agency/applications
// @access  Private (Admin)
exports.getAgencyApplications = async (req, res) => {
    try {
        const applications = await AgencyApplication.find()
            .populate('countryId', 'name')
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

// @desc    Update agency application status (Admin only)
// @route   PUT /api/admin/agency/application/:id
// @access  Private (Admin)
exports.updateAgencyStatus = async (req, res) => {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const application = await AgencyApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (status === 'Approved' && application.status !== 'Approved') {
            // Award points using common utility
            const rewardPoints = await issueApplicationReward(
                application.userId,
                req.user._id,
                application._id,
                'Agency',
                application.fullName
            );

            application._rewardPoints = rewardPoints;
        }

        application.status = status;
        await application.save();

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated Agency Status',
            details: `Agency application for ${application.agencyName} marked as ${status}`
        });

        res.status(200).json({
            success: true,
            message: `Agency application ${status.toLowerCase()} successfully${application._rewardPoints ? ` and ${application._rewardPoints} points awarded` : ''}`,
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
