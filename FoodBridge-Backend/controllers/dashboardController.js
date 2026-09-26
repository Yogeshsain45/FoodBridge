const FoodDonation = require("../models/FoodDonation");
const FoodRequest = require("../models/FoodRequest");
const Pickup = require("../models/Pickup");

// =========================
// GET DONOR DASHBOARD
// =========================

const getDonorDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        const totalDonations = await FoodDonation.countDocuments({
            donor: userId
        });

        const availableFood = await FoodDonation.countDocuments({
            donor: userId,
            status: "available"
        });

        const deliveredFood = await FoodDonation.countDocuments({
            donor: userId,
            status: "delivered"
        });

        const donations = await FoodDonation.find({
            donor: userId
        }).select("quantity quantityUnit");

        const totalMeals = donations.reduce(
            (total, donation) => {
                if (donation.quantityUnit === "meals") {
                    return total + donation.quantity;
                }

                return total;
            },
            0
        );

        const pendingRequests = await FoodRequest.countDocuments({
            donation: {
                $in: (
                    await FoodDonation.find({
                        donor: userId
                    }).select("_id")
                ).map(donation => donation._id)
            },
            status: "pending"
        });

        res.status(200).json({
            success: true,
            dashboard: {
                totalDonations,
                availableFood,
                deliveredFood,
                totalMeals,
                pendingRequests
            }
        });

    } catch (error) {
        console.error(
            "Donor Dashboard Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET RECEIVER DASHBOARD
// =========================

const getReceiverDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        const totalRequests = await FoodRequest.countDocuments({
            receiver: userId
        });

        const pendingRequests = await FoodRequest.countDocuments({
            receiver: userId,
            status: "pending"
        });

        const approvedRequests = await FoodRequest.countDocuments({
            receiver: userId,
            status: "approved"
        });

        const completedRequests = await FoodRequest.countDocuments({
            receiver: userId,
            status: "completed"
        });

        res.status(200).json({
            success: true,
            dashboard: {
                totalRequests,
                pendingRequests,
                approvedRequests,
                completedRequests
            }
        });

    } catch (error) {
        console.error(
            "Receiver Dashboard Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET VOLUNTEER DASHBOARD
// =========================

const getVolunteerDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        const totalPickups = await Pickup.countDocuments({
            volunteer: userId
        });

        const assignedPickups = await Pickup.countDocuments({
            volunteer: userId,
            status: "assigned"
        });

        const activePickups = await Pickup.countDocuments({
            volunteer: userId,
            status: {
                $in: [
                    "accepted",
                    "picked_up",
                    "in_transit"
                ]
            }
        });

        const completedPickups = await Pickup.countDocuments({
            volunteer: userId,
            status: "delivered"
        });

        res.status(200).json({
            success: true,
            dashboard: {
                totalPickups,
                assignedPickups,
                activePickups,
                completedPickups
            }
        });

    } catch (error) {
        console.error(
            "Volunteer Dashboard Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET DASHBOARD
// Automatically based on role
// =========================

const getDashboard = async (req, res) => {
    try {
        if (req.user.role === "donor") {
            return getDonorDashboard(req, res);
        }

        if (req.user.role === "receiver") {
            return getReceiverDashboard(req, res);
        }

        if (req.user.role === "volunteer") {
            return getVolunteerDashboard(req, res);
        }

        return res.status(403).json({
            success: false,
            message: "Invalid user role"
        });

    } catch (error) {
        console.error(
            "Dashboard Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    getDashboard,
    getDonorDashboard,
    getReceiverDashboard,
    getVolunteerDashboard
};