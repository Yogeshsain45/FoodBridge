const express = require("express");

const {
    createRequest,
    getMyRequests,
    getDonationRequests,
    approveRequest,
    rejectRequest,
    cancelRequest
} = require("../controllers/requestController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================
// CREATE FOOD REQUEST
// Receiver only
// =========================

router.post(
    "/",
    protect,
    authorize("receiver"),
    createRequest
);

// =========================
// GET MY REQUESTS
// Receiver only
// =========================

router.get(
    "/my",
    protect,
    authorize("receiver"),
    getMyRequests
);

// =========================
// GET REQUESTS FOR MY DONATIONS
// Donor only
// =========================

router.get(
    "/donations",
    protect,
    authorize("donor"),
    getDonationRequests
);

// =========================
// APPROVE REQUEST
// Donor only
// =========================

router.patch(
    "/:id/approve",
    protect,
    authorize("donor"),
    approveRequest
);

// =========================
// REJECT REQUEST
// Donor only
// =========================

router.patch(
    "/:id/reject",
    protect,
    authorize("donor"),
    rejectRequest
);

// =========================
// CANCEL REQUEST
// Receiver only
// =========================

router.patch(
    "/:id/cancel",
    protect,
    authorize("receiver"),
    cancelRequest
);

module.exports = router;