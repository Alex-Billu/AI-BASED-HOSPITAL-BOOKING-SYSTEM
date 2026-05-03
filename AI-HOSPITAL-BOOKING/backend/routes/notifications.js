const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route GET /api/notifications - Get user notifications
router.get('/', protect, async (req, res) => {
    try {
        const query = { $or: [{ recipientId: req.user._id }] };
        if (req.user.hospitalId) query.$or.push({ hospitalId: req.user.hospitalId });

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { isRead: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
