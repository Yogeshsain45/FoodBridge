const mongoose = require("mongoose");

const foodDonationSchema = new mongoose.Schema(
    {
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        foodName: {
            type: String,
            required: true,
            trim: true
        },

        foodType: {
            type: String,
            enum: [
                "veg",
                "non-veg",
                "vegan",
                "other"
            ],
            default: "veg"
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        quantityUnit: {
            type: String,
            enum: [
                "meals",
                "kg",
                "litres",
                "packets"
            ],
            default: "meals"
        },

        description: {
            type: String,
            trim: true
        },

        // Uploaded food photo stored as a compressed data URL so the exact
        // restaurant photo is returned to every dashboard/NGO/volunteer.
        imageData: {
            type: String,
            default: "",
            maxlength: 1500000
        },

        pickupLocation: {
            type: String,
            required: true,
            trim: true
        },

        pickupLatitude: {
            type: Number,
            min: -90,
            max: 90,
            default: null
        },

        pickupLongitude: {
            type: Number,
            min: -180,
            max: 180,
            default: null
        },

        preparedAt: {
            type: Date,
            required: true
        },

        expiryAt: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "available",
                "requested",
                "accepted",
                "picked_up",
                "delivered",
                "cancelled",
                "expired"
            ],
            default: "available"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "FoodDonation",
    foodDonationSchema
);