const mongoose = require("mongoose");

const impactSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        totalDonations: {
            type: Number,
            default: 0
        },

        totalMealsDonated: {
            type: Number,
            default: 0
        },

        totalFoodKg: {
            type: Number,
            default: 0
        },

        totalDeliveries: {
            type: Number,
            default: 0
        },

        totalPeopleHelped: {
            type: Number,
            default: 0
        },

        totalFoodSavedKg: {
            type: Number,
            default: 0
        },

        estimatedCO2ReducedKg: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Impact", impactSchema);