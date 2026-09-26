const express = require("express");

const {
    getAllUsers,
    getAllDonations,
    getAllRequests,
    getAllPickups,
    getPlatformOverview,
    getAdminDashboard
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Dedicated admin dashboard snapshot
router.get(
    "/dashboard",
    protect,
    adminOnly,
    getAdminDashboard
);

// Platform Overview
router.get(
    "/overview",
    protect,
    adminOnly,
    getPlatformOverview
);

// All Users
router.get(
    "/users",
    protect,
    adminOnly,
    getAllUsers
);

// All Donations
router.get(
    "/donations",
    protect,
    adminOnly,
    getAllDonations
);

// All Requests
router.get(
    "/requests",
    protect,
    adminOnly,
    getAllRequests
);

// All Pickups
router.get(
    "/pickups",
    protect,
    adminOnly,
    getAllPickups
);

module.exports = router;