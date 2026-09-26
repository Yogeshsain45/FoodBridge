const express = require("express");

const {
    getDashboard,
    getDonorDashboard,
    getReceiverDashboard,
    getVolunteerDashboard
} = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================
// GENERAL DASHBOARD
// =========================

router.get(
    "/",
    protect,
    getDashboard
);

// =========================
// DONOR DASHBOARD
// =========================

router.get(
    "/donor",
    protect,
    authorize("donor"),
    getDonorDashboard
);

// =========================
// RECEIVER DASHBOARD
// =========================

router.get(
    "/receiver",
    protect,
    authorize("receiver"),
    getReceiverDashboard
);

// =========================
// VOLUNTEER DASHBOARD
// =========================

router.get(
    "/volunteer",
    protect,
    authorize("volunteer"),
    getVolunteerDashboard
);

module.exports = router;