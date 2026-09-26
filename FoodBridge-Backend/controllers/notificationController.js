const Notification = require("../models/Notification");

// =========================
// GET MY NOTIFICATIONS
// =========================

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.userId
        })
            .populate("relatedDonation", "foodName quantity quantityUnit")
            .populate("relatedRequest", "requestedQuantity status")
            .populate("relatedPickup", "status")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error(
            "Get Notifications Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET UNREAD COUNT
// =========================

const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            unreadCount: count
        });

    } catch (error) {
        console.error(
            "Unread Count Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// MARK ONE AS READ
// =========================

const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.isRead = true;

        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error(
            "Mark Notification Read Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// MARK ALL AS READ
// =========================

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user.userId,
                isRead: false
            },
            {
                isRead: true
            }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error(
            "Mark All Notifications Read Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// CREATE NOTIFICATION
// =========================

const createNotification = async ({
    recipient,
    type,
    title,
    message,
    relatedDonation,
    relatedRequest,
    relatedPickup
}) => {
    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            relatedDonation,
            relatedRequest,
            relatedPickup
        });

        return notification;

    } catch (error) {
        console.error(
            "Create Notification Error:",
            error.message
        );

        return null;
    }
};


module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification
};