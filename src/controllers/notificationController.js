const HostingApplication = require('../models/HostingApplication');
const EventApplication = require('../models/EventApplication');
const AgencyApplication = require('../models/AgencyApplication');
const InfluencerApplication = require('../models/InfluencerApplication');
const Notification = require('../models/Notification');
const User = require('../models/userModel');

// Helper to get title and message based on application type and status
const getApplicationMeta = (type, status) => {
    const statusMap = {
        Pending: {
            title: 'Application Received',
            message: `Your application for ${type} has been received and is currently under review.`
        },
        Approved: {
            title: 'Application Approved',
            message: `Congratulations! Your application for ${type} has been approved.`
        },
        Rejected: {
            title: 'Application Rejected',
            message: `Unfortunately, your application for ${type} was not approved at this time. Please review our guidelines.`
        }
    };
    return statusMap[status] || { title: 'Application Update', message: `Your ${type} application status has been updated.` };
};

// @desc    Get all notifications for the logged-in user (applications + general)
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch from all 5 collections in parallel
        const [
            hostingApps,
            eventApps,
            agencyApps,
            influencerApps,
            generalNotifications
        ] = await Promise.all([
            HostingApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            EventApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            AgencyApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            InfluencerApplication.find({ userId }).select('status createdAt updatedAt').lean(),
            Notification.find({ 
                $or: [
                    { userId },
                    { isGlobal: true }
                ] 
            }).select('title message type isRead isGlobal createdAt updatedAt').lean()
        ]);

        // Map applications to unified notification format
        const mapApplications = (apps, typeName) =>
            apps.map((app) => {
                const { title, message } = getApplicationMeta(typeName, app.status);
                return {
                    id: app._id,
                    type: typeName,
                    category: 'application',
                    title,
                    message,
                    status: app.status,
                    isRead: app.updatedAt <= (req.user.lastNotificationViewedAt || 0),
                    createdAt: app.updatedAt,
                    updatedAt: app.updatedAt
                };
            });

        const hostingNotifs = mapApplications(hostingApps, 'Event Hosting');
        const eventNotifs = mapApplications(eventApps, 'Apply Event');
        const agencyNotifs = mapApplications(agencyApps, 'Agency');
        const influencerNotifs = mapApplications(influencerApps, 'Influencer');

        // Map general notifications to unified format
        const generalNotifs = generalNotifications.map((notif) => ({
            id: notif._id,
            type: notif.type || 'General',
            category: 'general',
            title: notif.title,
            message: notif.message,
            status: null,
            isRead: notif.isGlobal 
                ? notif.updatedAt <= (req.user.lastNotificationViewedAt || 0)
                : (notif.isRead || notif.updatedAt <= (req.user.lastNotificationViewedAt || 0)),
            isGlobal: notif.isGlobal,
            createdAt: notif.updatedAt,
            updatedAt: notif.updatedAt
        }));

        // Combine all and sort by createdAt descending (newest first)
        const allNotifications = [
            ...hostingNotifs,
            ...eventNotifs,
            ...agencyNotifs,
            ...influencerNotifs,
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
        let { userId, email, title, message, type, isGlobal } = req.body;

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
        await User.findByIdAndUpdate(req.user._id, {
            lastNotificationViewedAt: Date.now()
        });

        res.status(200).json({
            success: true,
            message: 'Last viewed time updated'
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
        const lastViewedAt = req.user.lastNotificationViewedAt || 0;

        // Fetch counts from all collections where updatedAt > lastViewedAt
        const [
            hostingCount,
            eventCount,
            agencyCount,
            influencerCount,
            generalCount
        ] = await Promise.all([
            HostingApplication.countDocuments({ userId, updatedAt: { $gt: lastViewedAt } }),
            EventApplication.countDocuments({ userId, updatedAt: { $gt: lastViewedAt } }),
            AgencyApplication.countDocuments({ userId, updatedAt: { $gt: lastViewedAt } }),
            InfluencerApplication.countDocuments({ userId, updatedAt: { $gt: lastViewedAt } }),
            Notification.countDocuments({ 
                $or: [
                    { userId, isRead: false, updatedAt: { $gt: lastViewedAt } },
                    { isGlobal: true, updatedAt: { $gt: lastViewedAt } }
                ]
            })
        ]);

        const totalUnread = hostingCount + eventCount + agencyCount + influencerCount + generalCount;

        res.status(200).json({
            success: true,
            unreadCount: totalUnread
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

