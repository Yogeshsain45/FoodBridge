const express = require("express");

const {
    createPickup,
    getPickupById,
    getMyPickups,
    getAvailablePickups,
    getReceiverPickups,
    acceptPickup,
    markPickedUp,
    markInTransit,
    completeDelivery
} = require("../controllers/pickupController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================
// GET AVAILABLE PICKUPS
// =========================

router.get(
    "/available",
    protect,
    authorize("volunteer"),
    getAvailablePickups
);

// =========================
// GET MY PICKUPS
// =========================

router.get(
    "/my",
    protect,
    authorize("volunteer"),
    getMyPickups
);

// =========================
// GET MY DELIVERY TRACKING (NGO / RECEIVER)
// =========================

router.get(
    "/receiver",
    protect,
    authorize("receiver"),
    getReceiverPickups
);

// =========================
// GET SINGLE PICKUP / MAP DATA
// =========================

router.get(
    "/:id",
    protect,
    getPickupById
);

// =========================
// CREATE PICKUP
// =========================

router.post(
    "/",
    protect,
    authorize("volunteer"),
    createPickup
);

// =========================
// ACCEPT PICKUP
// =========================

router.patch(
    "/:id/accept",
    protect,
    authorize("volunteer"),
    acceptPickup
);

// =========================
// MARK PICKED UP
// =========================

router.patch(
    "/:id/picked-up",
    protect,
    authorize("volunteer"),
    markPickedUp
);

// =========================
// MARK IN TRANSIT
// =========================

router.patch(
    "/:id/in-transit",
    protect,
    authorize("volunteer"),
    markInTransit
);

// =========================
// COMPLETE DELIVERY
// =========================

router.patch(
    "/:id/deliver",
    protect,
    authorize("volunteer"),
    completeDelivery
);

module.exports = router;