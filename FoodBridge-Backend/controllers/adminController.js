const User = require("../models/User");
const FoodDonation = require("../models/FoodDonation");
const FoodRequest = require("../models/FoodRequest");
const Pickup = require("../models/Pickup");

const userProjection = "-password -otp -otpExpires -otpAttempts";

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select(userProjection).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error("Admin Get Users Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAllDonations = async (req, res) => {
    try {
        const donations = await FoodDonation.find()
            .select("-imageData")
            .populate("donor", "name email phone role organization businessType location")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        console.error("Admin Get Donations Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAllRequests = async (req, res) => {
    try {
        const requests = await FoodRequest.find()
            .populate("receiver", "name email phone role organization serviceArea location")
            .populate({
                path: "donation",
                select: "foodName quantity quantityUnit pickupLocation status donor createdAt",
                populate: { path: "donor", select: "name email organization location" }
            })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: requests.length, requests });
    } catch (error) {
        console.error("Admin Get Requests Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAllPickups = async (req, res) => {
    try {
        const pickups = await Pickup.find()
            .populate("volunteer", "name email phone role location")
            .populate({
                path: "donation",
                select: "foodName quantity quantityUnit pickupLocation pickupLatitude pickupLongitude status donor createdAt",
                populate: { path: "donor", select: "name email organization location" }
            })
            .populate({
                path: "request",
                select: "requestedQuantity status receiver createdAt",
                populate: { path: "receiver", select: "name email organization serviceArea location" }
            })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: pickups.length, pickups });
    } catch (error) {
        console.error("Admin Get Pickups Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getPlatformOverview = async (req, res) => {
    try {
        const [totalUsers, totalDonors, totalReceivers, totalVolunteers, totalAdmins,
            totalDonations, availableDonations, requestedDonations, deliveredDonations,
            totalRequests, pendingRequests, approvedRequests, completedRequests,
            totalPickups, assignedPickups, acceptedPickups, inTransitPickups, completedPickups] = await Promise.all([
            User.countDocuments(), User.countDocuments({ role: "donor" }), User.countDocuments({ role: "receiver" }),
            User.countDocuments({ role: "volunteer" }), User.countDocuments({ role: "admin" }),
            FoodDonation.countDocuments(), FoodDonation.countDocuments({ status: "available" }),
            FoodDonation.countDocuments({ status: "requested" }), FoodDonation.countDocuments({ status: "delivered" }),
            FoodRequest.countDocuments(), FoodRequest.countDocuments({ status: "pending" }),
            FoodRequest.countDocuments({ status: "approved" }), FoodRequest.countDocuments({ status: "completed" }),
            Pickup.countDocuments(), Pickup.countDocuments({ status: "assigned" }), Pickup.countDocuments({ status: "accepted" }),
            Pickup.countDocuments({ status: "in_transit" }), Pickup.countDocuments({ status: "delivered" })
        ]);

        res.status(200).json({
            success: true,
            overview: {
                users: { total: totalUsers, donors: totalDonors, receivers: totalReceivers, volunteers: totalVolunteers, admins: totalAdmins },
                donations: { total: totalDonations, available: availableDonations, requested: requestedDonations, delivered: deliveredDonations },
                requests: { total: totalRequests, pending: pendingRequests, approved: approvedRequests, completed: completedRequests },
                pickups: { total: totalPickups, assigned: assignedPickups, accepted: acceptedPickups, inTransit: inTransitPickups, completed: completedPickups }
            }
        });
    } catch (error) {
        console.error("Admin Overview Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// One request gives the dedicated admin dashboard a complete MongoDB snapshot.
const getAdminDashboard = async (req, res) => {
    try {
        const [overviewResult, users, donations, requests, pickups] = await Promise.all([
            (async () => {
                let result;
                // Reuse the same aggregation/count logic without making an HTTP request.
                const [totalUsers, totalDonors, totalReceivers, totalVolunteers, totalAdmins,
                    totalDonations, availableDonations, requestedDonations, deliveredDonations,
                    totalRequests, pendingRequests, approvedRequests, completedRequests,
                    totalPickups, assignedPickups, acceptedPickups, inTransitPickups, completedPickups] = await Promise.all([
                    User.countDocuments(), User.countDocuments({ role: "donor" }), User.countDocuments({ role: "receiver" }),
                    User.countDocuments({ role: "volunteer" }), User.countDocuments({ role: "admin" }),
                    FoodDonation.countDocuments(), FoodDonation.countDocuments({ status: "available" }),
                    FoodDonation.countDocuments({ status: "requested" }), FoodDonation.countDocuments({ status: "delivered" }),
                    FoodRequest.countDocuments(), FoodRequest.countDocuments({ status: "pending" }),
                    FoodRequest.countDocuments({ status: "approved" }), FoodRequest.countDocuments({ status: "completed" }),
                    Pickup.countDocuments(), Pickup.countDocuments({ status: "assigned" }), Pickup.countDocuments({ status: "accepted" }),
                    Pickup.countDocuments({ status: "in_transit" }), Pickup.countDocuments({ status: "delivered" })
                ]);
                result = {
                    users: { total: totalUsers, donors: totalDonors, receivers: totalReceivers, volunteers: totalVolunteers, admins: totalAdmins },
                    donations: { total: totalDonations, available: availableDonations, requested: requestedDonations, delivered: deliveredDonations },
                    requests: { total: totalRequests, pending: pendingRequests, approved: approvedRequests, completed: completedRequests },
                    pickups: { total: totalPickups, assigned: assignedPickups, accepted: acceptedPickups, inTransit: inTransitPickups, completed: completedPickups }
                };
                return result;
            })(),
            User.find().select(userProjection).sort({ createdAt: -1 }).lean(),
            FoodDonation.find().select("-imageData").populate("donor", "name email phone role organization businessType location").sort({ createdAt: -1 }).lean(),
            FoodRequest.find()
                .populate("receiver", "name email phone role organization serviceArea location")
                .populate({ path: "donation", select: "foodName quantity quantityUnit pickupLocation status donor createdAt", populate: { path: "donor", select: "name email organization location" } })
                .sort({ createdAt: -1 }).lean(),
            Pickup.find()
                .populate("volunteer", "name email phone role location")
                .populate({ path: "donation", select: "foodName quantity quantityUnit pickupLocation pickupLatitude pickupLongitude status donor createdAt", populate: { path: "donor", select: "name email organization location" } })
                .populate({ path: "request", select: "requestedQuantity status receiver createdAt", populate: { path: "receiver", select: "name email organization serviceArea location" } })
                .sort({ createdAt: -1 }).lean()
        ]);

        res.status(200).json({ success: true, generatedAt: new Date(), overview: overviewResult, users, donations, requests, pickups });
    } catch (error) {
        console.error("Admin Dashboard Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getAllUsers, getAllDonations, getAllRequests, getAllPickups, getPlatformOverview, getAdminDashboard };
