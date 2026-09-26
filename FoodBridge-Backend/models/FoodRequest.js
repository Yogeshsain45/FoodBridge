const mongoose = require("mongoose");

const foodRequestSchema = new mongoose.Schema(
    {
        donation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodDonation",
            required: true
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        requestedQuantity: {
            type: Number,
            required: true,
            min: 1
        },

        message: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "cancelled",
                "completed"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("FoodRequest", foodRequestSchema);