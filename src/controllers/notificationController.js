const HostingApplication = require('../models/HostingApplication');
const EventApplication = require('../models/EventApplication');
const AgencyApplication = require('../models/AgencyApplication');
const InfluencerApplication = require('../models/InfluencerApplication');
const TopUp = require('../models/TopUp');
const WalletRecharge = require('../models/WalletRecharge');
const ReferralLog = require('../models/ReferralLog');
const Notification = require('../models/Notification');
const User = require('../models/userModel');

// Helper to get title and message based on application type and status
const getStatusMeta = (type, status) => {
    const statusMap = {
        Pending: {
            title: `${type} Under Review`,
            message: `Your ${type} request is currently under review.`
        },
        Approved: {
            title: `${type} Approved`,
            message: `Congratulations! Your ${type} request has been approved.`
        },
        Rejected: {
            title: `${type} Rejected`,
            message: `Unfortunately, your ${type} request was not approved.`
        },
        Completed: {
            title: `${type} Completed`,
            message: `Your ${type} process has been completed successfully.`
        }
    };
    return statusMap[status] || { title: `${type} Update`, message: `Your ${type} status has been updated.` };
};

// @desc    Get all notifications for the logged-in user (applications + financial + general)
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch from all collections in parallel
        const [
            hostingApps,
            eventApps,
            agencyApps,
            influencerApps,
            topups,
            recharges,
            referrals,
            generalNotifications
        ] = await Promise.all([
            HostingApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            EventApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            AgencyApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            InfluencerApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            TopUp.find({ userId }).select('status amount createdAt updatedAt').lean(),
            WalletRecharge.find({ userId }).select('status amount createdAt updatedAt').lean(),
            ReferralLog.find({ referrerId: userId }).select('status rewardPoints createdAt updatedAt').lean(),
            Notification.find({ 
                $or: [
                    { userId },
                    { isGlobal: true }
                ] 
            }).select('title message type isRead isGlobal createdAt updatedAt').lean()
        ]);

        const lastServiceViewedAt = req.user.lastServiceViewedAt || 0;
        const lastSystemViewedAt = req.user.lastSystemViewedAt || 0;

        // Map data to unified notification format
        const mapItems = (items, typeName, category) =>
            items.map((item) => {
                const { title, message } = getStatusMeta(typeName, item.status);
                let displayMessage = message;
                
                // Add specific details for financial items
                if (item.amount) displayMessage += ` Amount: ₹${item.amount}`;
                if (item.rewardPoints) displayMessage += ` Reward: ${item.rewardPoints} points`;

                return {
                    id: item._id,
                    type: typeName,
                    category: category,
                    title,
                    message: displayMessage,
                    status: item.status,
                    isRead: item.updatedAt <= lastServiceViewedAt,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                };
            });

        const hostingNotifs = mapItems(hostingApps, 'Event Hosting', 'application');
        const eventNotifs = mapItems(eventApps, 'Apply Event', 'application');
        const agencyNotifs = mapItems(agencyApps, 'Agency', 'application');
        const influencerNotifs = mapItems(influencerApps, 'Influencer', 'application');
        const topupNotifs = mapItems(topups, 'Top Up', 'financial');
        const rechargeNotifs = mapItems(recharges, 'Wallet Recharge', 'financial');
        const referralNotifs = mapItems(referrals, 'Invite & Earn', 'referral');

        // Map general notifications (System Notices)
        const generalNotifs = generalNotifications.map((notif) => ({
            id: notif._id,
            type: notif.type || 'Personal',
            category: 'general',
            title: notif.title,
            message: notif.message,
            status: null,
            isRead: notif.isGlobal 
                ? notif.updatedAt <= lastSystemViewedAt
                : (notif.isRead || notif.updatedAt <= lastSystemViewedAt),
            isGlobal: notif.isGlobal,
            createdAt: notif.createdAt,
            updatedAt: notif.updatedAt
        }));

        // Combine all and sort by updatedAt descending (newest first)
        const allNotifications = [
            ...hostingNotifs,
            ...eventNotifs,
            ...agencyNotifs,
            ...influencerNotifs,
            ...topupNotifs,
            ...rechargeNotifs,
            ...referralNotifs,
            ...generalNotifs
        ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.status(200).json({
            success: true,
            count: allNotifications.length,
            data: allNotifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark a general notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a general notification (admin use / internal)
// @route   POST /api/notifications
// @access  Private (Admin)
exports.createNotification = async (req, res) => {
    try {
        let { userId, email, title, message, isGlobal } = req.body;

        if (!isGlobal) {
            if (!title || !message) {
                return res.status(400).json({ success: false, message: 'title and message are required' });
            }
            if (!userId && !email) {
                return res.status(400).json({ success: false, message: 'userId or email is required for personal notifications' });
            }

            // If email is provided but no userId, find the user
            if (email && !userId) {
                const user = await User.findOne({ email });
                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found with this email' });
                }
                userId = user._id;
            }
        }
        
        if (isGlobal && (!title || !message)) {
            return res.status(400).json({ success: false, message: 'title and message are required for global notifications' });
        }

        const type = isGlobal ? 'Global' : 'Personal';
        const notification = await Notification.create({ userId, title, message, type, isGlobal });

        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update the last time the user viewed notifications
// @route   PATCH /api/notifications/viewed
// @access  Private
exports.updateLastViewedTime = async (req, res) => {
    try {
        const { type } = req.body; // 'service' or 'system'
        
        let updateField = { lastNotificationViewedAt: Date.now() };
        if (type === 'service') updateField.lastServiceViewedAt = Date.now();
        if (type === 'system') updateField.lastSystemViewedAt = Date.now();

        await User.findByIdAndUpdate(req.user._id, updateField);

        res.status(200).json({
            success: true,
            message: `${type ? type : 'General'} last viewed time updated`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const lastServiceViewedAt = req.user.lastServiceViewedAt || 0;
        const lastSystemViewedAt = req.user.lastSystemViewedAt || 0;

        // Fetch counts from all collections in parallel
        const [
            hostingCount,
            eventCount,
            agencyCount,
            influencerCount,
            topupCount,
            rechargeCount,
            referralCount,
            systemCount
        ] = await Promise.all([
            HostingApplication.countDocuments({ userId, updatedAt: { $gt: lastServiceViewedAt } }),
            EventApplication.countDocuments({ userId, updatedAt: { $gt: lastServiceViewedAt } }),
            AgencyApplication.countDocuments({ userId, updatedAt: { $gt: lastServiceViewedAt } }),
            InfluencerApplication.countDocuments({ userId, updatedAt: { $gt: lastServiceViewedAt } }),
            TopUp.countDocuments({ userId, updatedAt: { $gt: lastServiceViewedAt } }),
            WalletRecharge.countDocuments({ userId, updatedAt: { $gt: lastServiceViewedAt } }),
            ReferralLog.countDocuments({ referrerId: userId, updatedAt: { $gt: lastServiceViewedAt } }),
            Notification.countDocuments({ 
                $or: [
                    { userId, isRead: false, updatedAt: { $gt: lastSystemViewedAt } },
                    { isGlobal: true, updatedAt: { $gt: lastSystemViewedAt } }
                ]
            })
        ]);

        const serviceUnread = hostingCount + eventCount + agencyCount + influencerCount + 
                             topupCount + rechargeCount + referralCount;
        const systemUnread = systemCount;

        res.status(200).json({
            success: true,
            serviceUnread,
            systemUnread,
            totalUnread: serviceUnread + systemUnread
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all manual notifications (General + Global) for Admin management
// @route   GET /api/notifications/admin/all
// @access  Private (Admin)
exports.getAllNotificationsForAdmin = async (req, res) => {
    try {
        const notifications = await Notification.find({})
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a manual notification (Admin only)
// @route   PUT /api/notifications/admin/:id
// @access  Private (Admin)
exports.updateNotification = async (req, res) => {
    try {
        let { title, message, type, isGlobal, email, userId } = req.body;

        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Handle User replacement or conversion to Personal
        if (email || userId) {
            if (email && !userId) {
                const user = await User.findOne({ email });
                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found with this email' });
                }
                userId = user._id;
            }
            notification.userId = userId;
            // If we are setting a user, it should likely not be global anymore unless explicitly kept
            if (typeof isGlobal === 'undefined' && notification.isGlobal) {
                notification.isGlobal = false;
            }
        }

        // Explicitly handle Global toggle
        if (typeof isGlobal !== 'undefined') {
            notification.isGlobal = isGlobal;
            if (isGlobal) {
                notification.userId = undefined; // Clear user if it becomes global
            }
        }

        if (title) notification.title = title;
        if (message) notification.message = message;
        
        // Always sync type with isGlobal
        notification.type = notification.isGlobal ? 'Global' : 'Personal';

        // Validation: If it's NOT global, it MUST have a user
        if (!notification.isGlobal && !notification.userId) {
            return res.status(400).json({ success: false, message: 'User (email or userId) is required for personal notifications' });
        }

        await notification.save();

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a manual notification (Admin only)
// @route   DELETE /api/notifications/admin/:id
// @access  Private (Admin)
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.deleteOne();

        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

