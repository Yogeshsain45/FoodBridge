const User = require("../models/User");
const bcrypt = require("bcryptjs");

const MAIN_ADMIN_EMAIL = "janvixaarush@gmail.com";

// One-time provisioning endpoint for the single platform owner/admin.
// It is NOT part of public signup and requires ADMIN_SETUP_SECRET.
const provisionMainAdmin = async (req, res) => {
    try {
        const { email, password, setupSecret } = req.body;

        if (!process.env.ADMIN_SETUP_SECRET || setupSecret !== process.env.ADMIN_SETUP_SECRET) {
            return res.status(403).json({
                success: false,
                message: "Admin setup authorization required"
            });
        }

        if (String(email || "").toLowerCase().trim() !== MAIN_ADMIN_EMAIL) {
            return res.status(403).json({
                success: false,
                message: "Only the configured main admin email can be provisioned"
            });
        }

        if (!password || String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "A password of at least 6 characters is required"
            });
        }

        // Never allow this setup endpoint to create a second admin.
        const otherAdmin = await User.findOne({
            role: "admin",
            email: { $ne: MAIN_ADMIN_EMAIL }
        }).select("email");

        if (otherAdmin) {
            return res.status(409).json({
                success: false,
                message: "Another admin account already exists. Remove it from MongoDB before provisioning the main admin."
            });
        }

        const hashedPassword = await bcrypt.hash(String(password), 12);
        let admin = await User.findOne({ email: MAIN_ADMIN_EMAIL });

        if (admin) {
            admin.name = "FoodBridge Main Admin";
            admin.password = hashedPassword;
            admin.role = "admin";
            admin.isVerified = true;
            admin.otp = undefined;
            admin.otpExpires = undefined;
            admin.otpAttempts = 0;
            admin.adminId = "FOODBRIDGE-MAIN-ADMIN";
            admin.department = "Platform Administration";
            admin.accessCode = "";
        } else {
            admin = new User({
                name: "FoodBridge Main Admin",
                email: MAIN_ADMIN_EMAIL,
                password: hashedPassword,
                role: "admin",
                phone: "",
                isVerified: true,
                adminId: "FOODBRIDGE-MAIN-ADMIN",
                department: "Platform Administration",
                accessCode: ""
            });
        }

        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Main FoodBridge admin is ready. You can now log in as Admin.",
            admin: {
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isVerified: admin.isVerified
            }
        });
    } catch (error) {
        console.error("Provision Main Admin Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Backward-compatible password reset for an already provisioned admin.
const resetAdminPassword = async (req, res) => {
    try {
        const { email, newPassword, setupSecret } = req.body;

        if (!process.env.ADMIN_SETUP_SECRET || setupSecret !== process.env.ADMIN_SETUP_SECRET) {
            return res.status(403).json({ success: false, message: "Admin setup authorization required" });
        }
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: "Email and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const admin = await User.findOne({ email: email.toLowerCase().trim(), role: "admin" });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin account not found" });
        }

        admin.password = await bcrypt.hash(newPassword, 12);
        admin.isVerified = true;
        admin.otp = undefined;
        admin.otpExpires = undefined;
        admin.otpAttempts = 0;
        await admin.save();

        return res.status(200).json({ success: true, message: "Admin password reset successfully" });
    } catch (error) {
        console.error("Reset Admin Password Error:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { provisionMainAdmin, resetAdminPassword };
