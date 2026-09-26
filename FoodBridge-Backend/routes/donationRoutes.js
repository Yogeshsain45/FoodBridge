const express = require("express");

const {
    createDonation,
    getAllDonations,
    getMyDonations,
    getDonationById,
    cancelDonation
} = require("../controllers/donationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================
// CREATE FOOD DONATION
// Donor only
// =========================

router.post(
    "/",
    protect,
    authorize("donor"),
    createDonation
);

// =========================
// GET ALL AVAILABLE FOOD
// Receiver only
// =========================

router.get(
    "/",
    protect,
    authorize("receiver"),
    getAllDonations
);

// =========================
// GET MY DONATIONS
// Donor only
// =========================

router.get(
    "/my",
    protect,
    authorize("donor"),
    getMyDonations
);

// =========================
// GET SINGLE DONATION
// Logged-in users
// =========================

router.get(
    "/:id",
    protect,
    getDonationById
);

// =========================
// CANCEL DONATION
// Donor only
// =========================

router.patch(
    "/:id/cancel",
    protect,
    authorize("donor"),
    cancelDonation
);

module.exports = router;