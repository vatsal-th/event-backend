const Country = require('../models/Country');
const Category = require('../models/Category');
const App = require('../models/App');
const HostingApplication = require('../models/HostingApplication');
const EventApplication = require('../models/EventApplication');
const AgencyApplication = require('../models/AgencyApplication');
const InfluencerApplication = require('../models/InfluencerApplication');

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

        const [hosting, events, agency, influencers] = await Promise.all([
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
                .sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            data: {
                hosting,
                events,
                agency,
                influencers
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

        const [latestHosting, latestEvent, latestAgency, latestInfluencer] = await Promise.all([
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
                .lean()
        ]);

        res.status(200).json({
            success: true,
            currentUserPoints: req.user.points,
            data: {
                hosting: latestHosting ? { ...latestHosting, applicationType: 'Hosting' } : null,
                event: latestEvent ? { ...latestEvent, applicationType: 'Event' } : null,
                agency: latestAgency ? { ...latestAgency, applicationType: 'Agency' } : null,
                influencer: latestInfluencer ? { ...latestInfluencer, applicationType: 'Influencer' } : null
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

        res.status(200).json({
            success: true,
            message: 'Reward marked as scratched',
            data: application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
