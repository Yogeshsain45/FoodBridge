const express = require("express");

const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET MY NOTIFICATIONS
// =========================

router.get(
    "/",
    protect,
    getMyNotifications
);

// =========================
// GET UNREAD COUNT
// =========================

router.get(
    "/unread-count",
    protect,
    getUnreadCount
);

// =========================
// MARK ONE AS READ
// =========================

router.patch(
    "/:id/read",
    protect,
    markAsRead
);

// =========================
// MARK ALL AS READ
// =========================

router.patch(
    "/read-all",
    protect,
    markAllAsRead
);

module.exports = router;