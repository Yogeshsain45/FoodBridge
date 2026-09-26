const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "new_donation",
                "food_request",
                "request_approved",
                "request_rejected",
                "pickup_assigned",
                "pickup_accepted",
                "food_picked_up",
                "food_in_transit",
                "food_delivered",
                "general"
            ],
            default: "general"
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        relatedDonation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodDonation"
        },

        relatedRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodRequest"
        },

        relatedPickup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pickup"
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", notificationSchema);