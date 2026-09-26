const express = require("express");

const router = express.Router();

const {
    signup,
    verifyOTP,
    resendOTP,
    login
} = require("../controllers/authController");

// Signup
router.post("/signup", signup);

// Verify Email OTP
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Login
router.post("/login", login);

module.exports = router;