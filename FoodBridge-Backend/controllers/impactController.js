const Impact = require("../models/Impact");
const FoodDonation = require("../models/FoodDonation");
const FoodRequest = require("../models/FoodRequest");
const Pickup = require("../models/Pickup");

// =========================
// GET MY IMPACT
// =========================

const getMyImpact = async (req, res) => {
    try {
        const userId = req.user.userId;

        let impact = await Impact.findOne({
            user: userId
        });

        // Agar impact record nahi hai
        if (!impact) {
            impact = await Impact.create({
                user: userId
            });
        }

        // Donor ke liye donations
        const donations = await FoodDonation.find({
            donor: userId
        });

        const totalDonations = donations.length;

        const totalMealsDonated = donations.reduce(
            (total, donation) => {
                if (donation.quantityUnit === "meals") {
                    return total + donation.quantity;
                }

                return total;
            },
            0
        );

        const totalFoodKg = donations.reduce(
            (total, donation) => {
                if (donation.quantityUnit === "kg") {
                    return total + donation.quantity;
                }

                return total;
            },
            0
        );

        // Completed deliveries
        const completedDeliveries = await Pickup.countDocuments({
            volunteer: userId,
            status: "delivered"
        });

        // Receiver ke completed requests
        const completedRequests = await FoodRequest.countDocuments({
            receiver: userId,
            status: "completed"
        });

        // Role ke according impact calculate
        if (req.user.role === "donor") {
            impact.totalDonations = totalDonations;
            impact.totalMealsDonated = totalMealsDonated;
            impact.totalFoodKg = totalFoodKg;
        }

        if (req.user.role === "volunteer") {
            impact.totalDeliveries = completedDeliveries;
        }

        if (req.user.role === "receiver") {
            impact.totalPeopleHelped = completedRequests;
        }

        // Food saved calculation
        impact.totalFoodSavedKg = totalFoodKg;

        // Approximate CO2 reduction
        impact.estimatedCO2ReducedKg =
            impact.totalFoodSavedKg * 2.5;

        await impact.save();

        res.status(200).json({
            success: true,
            impact
        });

    } catch (error) {
        console.error(
            "Get Impact Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET PLATFORM IMPACT
// =========================

const getPlatformImpact = async (req, res) => {
    try {
        const donations = await FoodDonation.find();

        const totalDonations = donations.length;

        const totalMealsDonated = donations.reduce(
            (total, donation) => {
                if (donation.quantityUnit === "meals") {
                    return total + donation.quantity;
                }

                return total;
            },
            0
        );

        const totalFoodKg = donations.reduce(
            (total, donation) => {
                if (donation.quantityUnit === "kg") {
                    return total + donation.quantity;
                }

                return total;
            },
            0
        );

        const totalDeliveries = await Pickup.countDocuments({
            status: "delivered"
        });

        const totalPeopleHelped = await FoodRequest.countDocuments({
            status: "completed"
        });

        const estimatedCO2ReducedKg =
            totalFoodKg * 2.5;

        res.status(200).json({
            success: true,
            impact: {
                totalDonations,
                totalMealsDonated,
                totalFoodKg,
                totalDeliveries,
                totalPeopleHelped,
                totalFoodSavedKg: totalFoodKg,
                estimatedCO2ReducedKg
            }
        });

    } catch (error) {
        console.error(
            "Platform Impact Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    getMyImpact,
    getPlatformImpact
};