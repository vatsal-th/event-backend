const Country = require('../models/Country');
const Category = require('../models/Category');
const App = require('../models/App');
const HostingApplication = require('../models/HostingApplication');
const EventApplication = require('../models/EventApplication');
const AgencyApplication = require('../models/AgencyApplication');
const InfluencerApplication = require('../models/InfluencerApplication');
const TopUp = require('../models/TopUp');
const WalletTransaction = require('../models/WalletTransaction');

// @desc    Get all dropdown data for users
// @route   GET /api/dropdowns
// @access  Public
exports.getDropdowns = async (req, res) => {
    try {
        const countries = await Country.find({ status: 'active' })
            .select('_id name')
            .sort({ name: 1 });

        const categories = await Category.find({ status: 'active' })
            .select('_id name')
            .sort({ name: 1 });

        const apps = await App.find({ status: 'active' })
            .select('_id appName')
            .sort({ appName: 1 });

        res.status(200).json({
            success: true,
            data: {
                countries,
                categories,
                apps
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's application history
// @route   GET /api/history
// @access  Private
exports.getUserHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const [hosting, events, agency, influencers, topups] = await Promise.all([
            HostingApplication.find({ userId })
                .populate('countryId', 'name')
                .populate('categoryId', 'name')
                .populate('appId', 'appName')
                .sort({ createdAt: -1 }),
            EventApplication.find({ userId })
                .populate('countryId', 'name')
                .sort({ createdAt: -1 }),
            AgencyApplication.find({ userId })
                .populate('countryId', 'name')
                .populate('appId', 'appName')
                .sort({ createdAt: -1 }),
            InfluencerApplication.find({ userId })
                .populate('countryId', 'name')
                .sort({ createdAt: -1 }),
            TopUp.find({ userId })
                .populate('appId', 'appName')
                .sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            data: {
                hosting,
                events,
                agency,
                influencers,
                topups
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's reward history
// @route   GET /api/rewards
// @access  Private
exports.getUserRewardHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all applications with rewards for this user
        const [hosting, events, agency, influencers] = await Promise.all([
            HostingApplication.find({ userId, rewardPoints: { $gt: 0 } })
                .populate('countryId', 'name')
                .populate('categoryId', 'name')
                .populate('appId', 'appName')
                .sort({ createdAt: -1 })
                .lean(),
            EventApplication.find({ userId, rewardPoints: { $gt: 0 } })
                .populate('countryId', 'name')
                .sort({ createdAt: -1 })
                .lean(),
            AgencyApplication.find({ userId, rewardPoints: { $gt: 0 } })
                .populate('countryId', 'name')
                .populate('appId', 'appName')
                .sort({ createdAt: -1 })
                .lean(),
            InfluencerApplication.find({ userId, rewardPoints: { $gt: 0 } })
                .populate('countryId', 'name')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        // Combine all rewards with type labels
        const allRewards = [
            ...hosting.map(app => ({ ...app, applicationType: 'Hosting' })),
            ...events.map(app => ({ ...app, applicationType: 'Event' })),
            ...agency.map(app => ({ ...app, applicationType: 'Agency' })),
            ...influencers.map(app => ({ ...app, applicationType: 'Influencer' }))
        ];

        // Sort by date (newest first)
        allRewards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calculate total reward points
        const totalRewardPoints = allRewards.reduce((sum, reward) => sum + (reward.rewardPoints || 0), 0);

        res.status(200).json({
            success: true,
            totalRewardPoints,
            rewardCount: allRewards.length,
            currentUserPoints: req.user.points,
            rewards: allRewards
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get user's latest application status for each type
// @route   GET /api/history/latest
// @access  Private
exports.getLatestApplicationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const [latestHosting, latestEvent, latestAgency, latestInfluencer, latestTopUp] = await Promise.all([
            HostingApplication.findOne({ userId })
                .populate('countryId', 'name')
                .populate('categoryId', 'name')
                .populate('appId', 'appName')
                .sort({ createdAt: -1 })
                .lean(),
            EventApplication.findOne({ userId })
                .populate('countryId', 'name')
                .sort({ createdAt: -1 })
                .lean(),
            AgencyApplication.findOne({ userId })
                .populate('countryId', 'name')
                .populate('appId', 'appName')
                .sort({ createdAt: -1 })
                .lean(),
            InfluencerApplication.findOne({ userId })
                .populate('countryId', 'name')
                .sort({ createdAt: -1 })
                .lean(),
            TopUp.findOne({ userId })
                .populate('appId', 'appName')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        res.status(200).json({
            success: true,
            currentUserPoints: req.user.points,
            data: {
                hosting: latestHosting ? { ...latestHosting, applicationType: 'Hosting' } : null,
                event: latestEvent ? { ...latestEvent, applicationType: 'Event' } : null,
                agency: latestAgency ? { ...latestAgency, applicationType: 'Agency' } : null,
                influencer: latestInfluencer ? { ...latestInfluencer, applicationType: 'Influencer' } : null,
                topup: latestTopUp ? { ...latestTopUp, applicationType: 'TopUp' } : null
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a reward scratch card as revealed
// @route   PUT /api/rewards/scratch/:type/:id
// @access  Private
exports.scratchApplicationReward = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user._id;
        const WalletTransaction = require('../models/WalletTransaction');

        let application;
        const query = { _id: id, userId };

        switch (type.toLowerCase()) {
            case 'hosting':
                application = await HostingApplication.findOneAndUpdate(query, { isScratched: true }, { new: true });
                break;
            case 'event':
                application = await EventApplication.findOneAndUpdate(query, { isScratched: true }, { new: true });
                break;
            case 'agency':
                application = await AgencyApplication.findOneAndUpdate(query, { isScratched: true }, { new: true });
                break;
            case 'influencer':
                application = await InfluencerApplication.findOneAndUpdate(query, { isScratched: true }, { new: true });
                break;
            default:
                return res.status(400).json({ message: 'Invalid application type' });
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found or unauthorized' });
        }

        // Create wallet transaction for scratch card reward
        if (application.rewardPoints && application.rewardPoints > 0) {
            await WalletTransaction.create({
                userId: userId,
                transactionType: 'application_reward',
                amount: application.rewardPoints,
                description: `Scratch card reward for ${type} application`,
                relatedId: application._id,
                relatedModel: `${type.charAt(0).toUpperCase() + type.slice(1)}Application`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reward marked as scratched',
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const User = require('../models/userModel');

        // Execute all statutory counts and sums in parallel
        const [
            totalInvites,
            totalHosts,
            totalPlayEvents,
            totalAgency,
            totalInfluencers,
            topUpStats,
            earningStats
        ] = await Promise.all([
            // Total Invites: Users referred by this user
            User.countDocuments({ referredBy: userId }),

            // Total Hosts: Approved Hosting Applications
            HostingApplication.countDocuments({ userId, status: 'Approved' }),

            // Total Play Events: Approved Event Applications
            EventApplication.countDocuments({ userId, status: 'Approved' }),

            // Total Agency: Approved Agency Applications
            AgencyApplication.countDocuments({ userId, status: 'Approved' }),

            // Total Influencers: Approved Influencer Applications
            InfluencerApplication.countDocuments({ userId, status: 'Approved' }),

            // Total Top-Ups: Sum of approved top-up amounts
            TopUp.aggregate([
                { $match: { userId, status: 'Approved' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),

            // Total Earnings: Sum of all positive reward transactions
            WalletTransaction.aggregate([
                { $match: { userId, amount: { $gt: 0 } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalEarnings: earningStats[0]?.total || 0,
                totalInvites: totalInvites || 0,
                totalInfluencers: totalInfluencers || 0,
                walletBalance: req.user.points || 0,
                totalAgency: totalAgency || 0,
                totalHosts: totalHosts || 0,
                totalPlayEvents: totalPlayEvents || 0,
                totalTopUps: topUpStats[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
