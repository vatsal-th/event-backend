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
            HostingApplication.find({ userId }).populate('countryId', 'name').populate('categoryId', 'name').populate('appId', 'appName').sort({ createdAt: -1 }),
            EventApplication.find({ userId }).populate('countryId', 'name').sort({ createdAt: -1 }),
            AgencyApplication.find({ userId }).populate('countryId', 'name').populate('appId', 'appName').sort({ createdAt: -1 }),
            InfluencerApplication.find({ userId }).populate('countryId', 'name').sort({ createdAt: -1 })
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
