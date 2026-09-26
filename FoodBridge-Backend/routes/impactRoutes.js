const express = require("express");

const {
    getMyImpact,
    getPlatformImpact
} = require("../controllers/impactController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET MY IMPACT
// =========================

router.get(
    "/my",
    protect,
    getMyImpact
);

// =========================
// GET PLATFORM IMPACT
// =========================

router.get(
    "/platform",
    protect,
    getPlatformImpact
);

module.exports = router;