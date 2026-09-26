const FoodDonation = require("../models/FoodDonation");

// =========================
// CHECK EXPIRED FOOD
// =========================

const checkExpiredDonations = async () => {
    try {
        const result = await FoodDonation.updateMany(
            {
                status: {
                    $in: ["available", "requested"]
                },
                expiryAt: {
                    $lte: new Date()
                }
            },
            {
                $set: {
                    status: "expired"
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(
                `${result.modifiedCount} food donation(s) marked as expired ⏰`
            );
        }

    } catch (error) {
        console.error(
            "Expiry Service Error:",
            error.message
        );
    }
};

module.exports = {
    checkExpiredDonations
};