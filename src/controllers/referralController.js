const ReferralLog = require('../models/ReferralLog');
const User = require('../models/userModel');
const WalletTransaction = require('../models/WalletTransaction');

// @desc    Get current user's referral statistics
// @route   GET /api/referrals/stats
// @access  Private
exports.getUserReferralStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Count total referrals
        const totalReferrals = await ReferralLog.countDocuments({ referrerId: userId });

        // Calculate total points earned from referrals
        const referralLogs = await ReferralLog.find({ referrerId: userId });
        const totalPointsEarned = referralLogs.reduce((sum, log) => sum + log.rewardPoints, 0);

        // Get list of referred users with details
        const referredUsers = await ReferralLog.find({ referrerId: userId })
            .populate('referredUserId', 'fullName email')
            .sort({ timestamp: -1 })
            .limit(50);

        const referralList = referredUsers.map(log => ({
            userName: log.referredUserId?.fullName || 'Unknown User',
            email: log.referredUserId?.email || 'N/A',
            date: log.timestamp,
            pointsEarned: log.rewardPoints,
        }));

        res.status(200).json({
            success: true,
            data: {
                totalReferrals,
                totalPointsEarned,
                referralList,
                userInviteCode: req.user.inviteId,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Aggregate referrals by referrer
        const leaderboard = await ReferralLog.aggregate([
            {
                $group: {
                    _id: '$referrerId',
                    totalReferrals: { $sum: 1 },
                    totalPoints: { $sum: '$rewardPoints' },
                },
            },
            {
                $sort: { totalReferrals: -1 },
            },
            {
                $limit: limit,
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails',
                },
            },
            {
                $unwind: '$userDetails',
            },
            {
                $project: {
                    _id: 1,
                    fullName: '$userDetails.fullName',
                    email: '$userDetails.email',
                    inviteId: '$userDetails.inviteId',
                    totalReferrals: 1,
                    totalPoints: 1,
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: leaderboard,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's detailed referral history
// @route   GET /api/referrals/history
// @access  Private
exports.getUserReferralHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get referral logs with pagination
        const referralLogs = await ReferralLog.find({ referrerId: userId })
            .populate('referredUserId', 'fullName email')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await ReferralLog.countDocuments({ referrerId: userId });

        const history = referralLogs.map(log => ({
            referralId: log._id,
            referredUser: {
                name: log.referredUserId?.fullName || 'Unknown User',
                email: log.referredUserId?.email || 'N/A',
            },
            inviteCodeUsed: log.inviteCode,
            pointsEarned: log.rewardPoints,
            date: log.timestamp,
        }));

        res.status(200).json({
            success: true,
            data: {
                history,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalRecords: totalCount,
                    recordsPerPage: limit,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
