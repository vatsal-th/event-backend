const EventApplication = require('../models/EventApplication');
const HostingApplication = require('../models/HostingApplication');
const User = require('../models/userModel');
const ActivityLog = require('../models/activityLogModel');
const { issueApplicationReward } = require('../utils/rewardHelper');

// @desc    Submit event application
// @route   POST /api/events/apply
// @access  Private (User)
exports.submitEventApplication = async (req, res) => {
    const {
        mobileNumber,
        fullName,
        countryId,
        gender,
        agencyCode,
        budget,
        eventTime,
        eventDate,
        yourId,
        opponentId
    } = req.body;

    if (!mobileNumber || !fullName || !countryId || !gender || !agencyCode || !budget || !eventTime || !eventDate) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const application = await EventApplication.create({
            mobileNumber,
            fullName,
            countryId,
            gender,
            agencyCode,
            budget,
            eventTime,
            eventDate,
            yourId: yourId || '',
            opponentId: opponentId || '',
            userId: req.user._id
        });

        // Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'Submitted Event Application',
            details: `User applied for event: ${fullName} (${agencyCode})`
        });

        res.status(201).json({
            success: true,
            message: 'Event application submitted successfully',
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's event applications
// @route   GET /api/events/my
// @access  Private (User)
exports.getMyEvents = async (req, res) => {
    try {
        const applications = await EventApplication.find({ userId: req.user._id })
            .populate('countryId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all event applications (Admin only)
// @route   GET /api/admin/events/applications
// @access  Private (Admin)
exports.getAllEventApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const applications = await EventApplication.find()
            .populate('countryId', 'name')
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await EventApplication.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                applications,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalRecords: totalCount,
                    recordsPerPage: limit,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update event application status (Admin only)
// @route   PUT /api/admin/events/application/:id
// @access  Private (Admin)
exports.updateEventStatus = async (req, res) => {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const application = await EventApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (status === 'Approved' && application.status !== 'Approved') {
            // Award points using common utility
            const rewardPoints = await issueApplicationReward(
                application.userId,
                req.user._id,
                application._id,
                'Event',
                application.fullName
            );

            application.rewardPoints = rewardPoints;
            
            // Handle banner upload
            if (req.file) {
                application.eventBanner = req.file.path;
            }
        }

        application.status = status;
        await application.save();

        // Log status change
        await ActivityLog.create({
            user: req.user._id,
            action: 'Updated Event Status',
            details: `Event application for ${application.agencyCode} marked as ${status}`
        });

        res.status(200).json({
            success: true,
            message: `Event application ${status.toLowerCase()} successfully${application.rewardPoints ? ` and ${application.rewardPoints} points awarded` : ''}`,
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
