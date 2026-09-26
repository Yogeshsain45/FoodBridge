const FoodDonation = require("../models/FoodDonation");
const FoodRequest = require("../models/FoodRequest");
const Pickup = require("../models/Pickup");
const User = require("../models/User");

// =========================
// CREATE FOOD DONATION
// =========================

const createDonation = async (req, res) => {
    try {
        const {
            foodName,
            foodType,
            quantity,
            quantityUnit,
            description,
            imageData,
            pickupLocation,
            pickupLatitude,
            pickupLongitude,
            preparedAt,
            expiryAt
        } = req.body;

        // Reject oversized/invalid image payloads instead of silently replacing them.
        if (imageData && (typeof imageData !== "string" || imageData.length > 1500000 || !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(imageData))) {
            return res.status(400).json({ success: false, message: "Food image is invalid or too large. Please upload a smaller JPG/PNG/WEBP image." });
        }

        // Required fields
        if (
            !foodName ||
            !quantity ||
            !pickupLocation ||
            !preparedAt ||
            !expiryAt
        ) {
            return res.status(400).json({
                success: false,
                message: "Food name, quantity, pickup location, prepared time and expiry time are required"
            });
        }

        // Validate numeric quantity and time window
        const numericQuantity = Number(quantity);
        const preparedDate = new Date(preparedAt);
        const expiryDate = new Date(expiryAt);
        if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be a positive number" });
        }
        if (Number.isNaN(preparedDate.getTime()) || Number.isNaN(expiryDate.getTime()) || expiryDate <= preparedDate) {
            return res.status(400).json({ success: false, message: "Expiry time must be after prepared time" });
        }

        // Only donor can create donation
        if (req.user.role !== "donor") {
            return res.status(403).json({
                success: false,
                message: "Only donors can post food donations"
            });
        }

        // Use the location entered for this donation. If coordinates were not
        // supplied, safely fall back to the donor's saved real location.
        const donor = await User.findById(req.user.userId).select("location latitude longitude");
        const bodyLat = Number(pickupLatitude);
        const bodyLng = Number(pickupLongitude);
        const donorLat = Number(donor?.latitude);
        const donorLng = Number(donor?.longitude);
        const finalLatitude = Number.isFinite(bodyLat) && bodyLat >= -90 && bodyLat <= 90
            ? bodyLat
            : (Number.isFinite(donorLat) && donorLat >= -90 && donorLat <= 90 ? donorLat : null);
        const finalLongitude = Number.isFinite(bodyLng) && bodyLng >= -180 && bodyLng <= 180
            ? bodyLng
            : (Number.isFinite(donorLng) && donorLng >= -180 && donorLng <= 180 ? donorLng : null);

        // Create donation
        const donation = await FoodDonation.create({
            donor: req.user.userId,
            foodName,
            foodType,
            quantity: numericQuantity,
            quantityUnit,
            description,
            imageData: imageData || "",
            pickupLocation: pickupLocation || donor?.location || "",
            pickupLatitude: finalLatitude,
            pickupLongitude: finalLongitude,
            preparedAt: preparedDate,
            expiryAt: expiryDate
        });

        res.status(201).json({
            success: true,
            message: "Food donation created successfully",
            donation
        });

    } catch (error) {
        console.error("Create Donation Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET ALL AVAILABLE FOOD
// =========================

const getAllDonations = async (req, res) => {
    try {
        const donations = await FoodDonation.find({
            status: "available",
            expiryAt: { $gt: new Date() }
        })
            .populate("donor", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {
        console.error("Get Donations Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET MY DONATIONS
// =========================

const getMyDonations = async (req, res) => {
    try {
        const donations = await FoodDonation.find({
            donor: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {
        console.error("Get My Donations Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET SINGLE DONATION
// =========================

const getDonationById = async (req, res) => {
    try {
        const donation = await FoodDonation.findById(req.params.id)
            .populate("donor", "name email phone");

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Food donation not found"
            });
        }

        res.status(200).json({
            success: true,
            donation
        });

    } catch (error) {
        console.error("Get Donation Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// CANCEL MY DONATION
// =========================

const cancelDonation = async (req, res) => {
    try {
        const donation = await FoodDonation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Food donation not found"
            });
        }

        // Check ownership
        if (donation.donor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own donation"
            });
        }

        if (
            donation.status !== "available" &&
            donation.status !== "requested"
        ) {
            return res.status(400).json({
                success: false,
                message: "This donation cannot be cancelled"
            });
        }

        donation.status = "cancelled";

        await donation.save();

        // Keep related workflow records consistent.
        await FoodRequest.updateMany(
            { donation: donation._id, status: { $in: ["pending", "approved"] } },
            { $set: { status: "cancelled" } }
        );
        await Pickup.updateMany(
            { donation: donation._id, status: { $nin: ["delivered", "cancelled"] } },
            { $set: { status: "cancelled" } }
        );

        res.status(200).json({
            success: true,
            message: "Food donation cancelled successfully",
            donation
        });

    } catch (error) {
        console.error("Cancel Donation Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    createDonation,
    getAllDonations,
    getMyDonations,
    getDonationById,
    cancelDonation
};