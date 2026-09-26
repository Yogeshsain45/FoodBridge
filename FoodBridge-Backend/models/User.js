const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // Basic account details
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        role: {
            type: String,
            enum: ["donor", "receiver", "volunteer", "admin"],
            default: "receiver"
        },

        // =========================
        // ROLE SPECIFIC DETAILS
        // =========================

        // Restaurant
        organization: {
            type: String,
            trim: true,
            default: ""
        },

        businessType: {
            type: String,
            trim: true,
            default: ""
        },

        location: {
            type: String,
            trim: true,
            default: ""
        },

        // Saved map coordinates for restaurant / NGO / volunteer location
        latitude: {
            type: Number,
            min: -90,
            max: 90,
            default: null
        },

        longitude: {
            type: Number,
            min: -180,
            max: 180,
            default: null
        },

        // NGO
        registrationNumber: {
            type: String,
            trim: true,
            default: ""
        },

        serviceArea: {
            type: String,
            trim: true,
            default: ""
        },

        // Volunteer
        availability: {
            type: String,
            trim: true,
            default: ""
        },

        volunteerSkill: {
            type: String,
            trim: true,
            default: ""
        },

        // Admin
        adminId: {
            type: String,
            trim: true,
            default: ""
        },

        department: {
            type: String,
            trim: true,
            default: ""
        },

        accessCode: {
            type: String,
            trim: true,
            default: ""
        },

        // =========================
        // OTP
        // =========================

        isVerified: {
            type: Boolean,
            default: false
        },

        otp: {
            type: String
        },

        otpExpires: {
            type: Date
        },

        otpAttempts: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);