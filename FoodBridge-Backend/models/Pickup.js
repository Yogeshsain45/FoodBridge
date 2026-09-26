const mongoose = require("mongoose");
const crypto = require("crypto");

const pickupSchema = new mongoose.Schema(
    {
        request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodRequest",
            required: true
        },

        donation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodDonation",
            required: true
        },

        volunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        pickupLocation: {
            type: String,
            required: true,
            trim: true
        },

        deliveryLocation: {
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

        deliveryLatitude: {
            type: Number,
            min: -90,
            max: 90,
            default: null
        },

        deliveryLongitude: {
            type: Number,
            min: -180,
            max: 180,
            default: null
        },

        pickupTime: {
            type: Date
        },

        deliveredAt: {
            type: Date
        },

        status: {
            type: String,
            enum: [
                "assigned",
                "accepted",
                "picked_up",
                "in_transit",
                "delivered",
                "cancelled"
            ],
            default: "assigned"
        },

        // 6-digit delivery OTP
        deliveryOTP: {
            type: String,
            match: /^[0-9]{6}$/
        },

        otpVerified: {
            type: Boolean,
            default: false
        },

        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);


// =========================
// GENERATE DELIVERY OTP
// =========================

pickupSchema.pre("validate", function () {

    if (this.isNew && !this.deliveryOTP) {

        this.deliveryOTP = crypto.randomInt(100000, 1000000).toString();

    }

});


module.exports = mongoose.model("Pickup", pickupSchema);
