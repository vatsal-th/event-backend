const express = require('express');
const router = express.Router();
const {
    getUserNotifications,
    markNotificationAsRead,
    createNotification,
    updateLastViewedTime,
    getUnreadCount,
    getAllNotificationsForAdmin,
    updateNotification,
    deleteNotification
} = require('../controllers/notificationController');
const { protect, authorizeAdmin } = require('../middlewares/authMiddleware');

// Get all manual notifications for Admin (management)
router.get('/admin/all', protect, authorizeAdmin, getAllNotificationsForAdmin);
router.put('/admin/:id', protect, authorizeAdmin, updateNotification);
router.delete('/admin/:id', protect, authorizeAdmin, deleteNotification);

// Get all notifications for logged-in user (applications + general)
router.get('/', protect, getUserNotifications);

// Get unread count
router.get('/unread-count', protect, getUnreadCount);

// Update last viewed time
router.patch('/viewed', protect, updateLastViewedTime);

// Mark a general notification as read
router.put('/:id/read', protect, markNotificationAsRead);

// Create a general notification (admin/internal use)
router.post('/', protect, authorizeAdmin, createNotification);

module.exports = router;
