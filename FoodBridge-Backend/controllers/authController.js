const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// =========================
// EMAIL CONFIGURATION
// =========================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// =========================
// SIGNUP
// =========================

const signup = async (req, res) => {
    try {

        const {
            name,
            email,
            password,
            phone,
            role,

            // Restaurant
            organization,
            businessType,
            location,
            latitude,
            longitude,

            // NGO
            registrationNumber,
            serviceArea,

            // Volunteer
            availability,
            volunteerSkill,

            // Admin
            adminId,
            department,
            accessCode
        } = req.body;


        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }


        const allowedRoles = ["donor", "receiver", "volunteer"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid signup role. Admin accounts must be provisioned separately."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }


        // =========================
        // HASH PASSWORD
        // =========================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // =========================
        // GENERATE OTP
        // =========================

        const otp = crypto.randomInt(100000, 1000000).toString();


        const otpExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );


        // =========================
        // CREATE USER
        // =========================

        const user = await User.create({

            name: name.trim(),

            email: email.toLowerCase().trim(),

            password: hashedPassword,

            phone: phone || "",

            role: role || "receiver",


            // Restaurant details
            organization: organization || "",
            businessType: businessType || "",
            location: location || "",
            latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
            longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,


            // NGO details
            registrationNumber:
                registrationNumber || "",

            serviceArea:
                serviceArea || "",


            // Volunteer details
            availability:
                availability || "",

            volunteerSkill:
                volunteerSkill || "",


            // Admin details
            adminId:
                adminId || "",

            department:
                department || "",

            accessCode:
                accessCode || "",


            // OTP
            isVerified: false,
            otp: otp,
            otpExpires: otpExpires,
            otpAttempts: 0
        });


        // =========================
        // SEND OTP EMAIL
        // =========================

        await transporter.sendMail({

            from:
                `"FoodBridge Team" <${process.env.EMAIL_USER}>`,

            to: user.email,

            subject:
                "FoodBridge - Email Verification OTP",

            html: `

                <div style="
                    font-family: Arial, sans-serif;
                    padding: 25px;
                ">

                    <h2>
                        Welcome to FoodBridge 🌱
                    </h2>


                    <p>
                        Hello
                        <strong>${user.name}</strong>,
                    </p>


                    <p>
                        Thank you for registering
                        with FoodBridge.
                    </p>


                    <p>
                        Please use the OTP below
                        to verify your email.
                    </p>


                    <h1 style="
                        letter-spacing: 8px;
                    ">
                        ${otp}
                    </h1>


                    <p>
                        This OTP will expire in
                        <strong>10 minutes</strong>.
                    </p>


                    <p>
                        If you did not create this
                        account, you can safely
                        ignore this email.
                    </p>


                    <p>
                        Regards,<br>
                        <strong>
                            FoodBridge Team
                        </strong>
                    </p>

                </div>

            `
        });


        // =========================
        // RESPONSE
        // =========================

        return res.status(201).json({

            success: true,

            message:
                "Signup successful. OTP sent to your email.",

            email: user.email

        });


    } catch (error) {

        console.error(
            "Signup Error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message: "Server error"

        });
    }
};


// =========================
// VERIFY OTP
// =========================

const verifyOTP = async (req, res) => {

    try {

        const {
            email,
            otp
        } = req.body;


        if (!email || !otp) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required"

            });
        }


        const user = await User.findOne({

            email:
                email.toLowerCase().trim()

        });


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });
        }


        // Already verified
        if (user.isVerified) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is already verified"

            });
        }


        // OTP expired
        if (
            !user.otpExpires ||
            user.otpExpires < new Date()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "OTP has expired"

            });
        }


        // Wrong OTP / brute-force protection
        if (user.otp !== otp) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;

            if (user.otpAttempts >= 5) {
                user.otp = undefined;
                user.otpExpires = undefined;
                await user.save();
                return res.status(429).json({
                    success: false,
                    message: "Too many incorrect OTP attempts. Please request a new OTP."
                });
            }

            await user.save();
            return res.status(400).json({
                success: false,
                message: "Please enter correct OTP",
                attemptsRemaining: 5 - user.otpAttempts
            });
        }


        // =========================
        // VERIFY ACCOUNT
        // =========================

        user.isVerified = true;

        user.otp = undefined;

        user.otpExpires = undefined;


        await user.save();


        // =========================
        // CREATE LOGIN TOKEN
        // =========================

        const token = jwt.sign(

            {
                userId: user._id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );


        // =========================
        // SEND USER + TOKEN
        // =========================

        return res.status(200).json({

            success: true,

            message:
                "Account created successfully!",

            token: token,


            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone || "",

                role: user.role,


                // Restaurant
                organization:
                    user.organization || "",

                businessType:
                    user.businessType || "",

                location:
                    user.location || "",

                latitude: user.latitude ?? null,
                longitude: user.longitude ?? null,


                // NGO
                registrationNumber:
                    user.registrationNumber || "",

                serviceArea:
                    user.serviceArea || "",


                // Volunteer
                availability:
                    user.availability || "",

                volunteerSkill:
                    user.volunteerSkill || "",


                // Admin
                adminId:
                    user.adminId || "",

                department:
                    user.department || "",


                isVerified:
                    user.isVerified

            }

        });


    } catch (error) {

        console.error(
            "OTP Verification Error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message: "Server error"

        });
    }
};


// =========================
// LOGIN
// =========================

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required"

            });
        }


        const user = await User.findOne({

            email:
                email.toLowerCase().trim()

        });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });
        }


        // Email verification check
        if (!user.isVerified) {

            return res.status(403).json({

                success: false,

                message:
                    "Please verify your email before login"

            });
        }


        // Password check
        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isPasswordCorrect) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });
        }


        // =========================
        // CREATE LOGIN TOKEN
        // =========================

        const token = jwt.sign(

            {
                userId: user._id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );


        // =========================
        // LOGIN RESPONSE
        // =========================

        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            token: token,


            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone:
                    user.phone || "",

                role:
                    user.role,


                // Restaurant
                organization:
                    user.organization || "",

                businessType:
                    user.businessType || "",

                location:
                    user.location || "",

                latitude: user.latitude ?? null,
                longitude: user.longitude ?? null,


                // NGO
                registrationNumber:
                    user.registrationNumber || "",

                serviceArea:
                    user.serviceArea || "",


                // Volunteer
                availability:
                    user.availability || "",

                volunteerSkill:
                    user.volunteerSkill || "",


                // Admin
                adminId:
                    user.adminId || "",

                department:
                    user.department || ""

            }

        });


    } catch (error) {

        console.error(
            "Login Error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message: "Server error"

        });
    }
};


// =========================
// RESEND OTP
// =========================

const resendOTP = async (req, res) => {

    try {

        const {
            email
        } = req.body;


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required"

            });
        }


        const user = await User.findOne({

            email:
                email.toLowerCase().trim()

        });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });
        }


        // Already verified
        if (user.isVerified) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is already verified"

            });
        }


        // =========================
        // NEW OTP
        // =========================

        const otp = crypto.randomInt(100000, 1000000).toString();


        const otpExpires = new Date(

            Date.now() +
            10 * 60 * 1000

        );


        user.otp = otp;

        user.otpExpires = otpExpires;
        user.otpAttempts = 0;


        await user.save();


        // =========================
        // SEND NEW OTP
        // =========================

        await transporter.sendMail({

            from:
                `"FoodBridge Team" <${process.env.EMAIL_USER}>`,

            to: user.email,

            subject:
                "FoodBridge - New Verification OTP",

            html: `

                <div style="
                    font-family: Arial, sans-serif;
                    padding: 25px;
                ">

                    <h2>
                        FoodBridge 🌱
                    </h2>


                    <p>
                        Your new email
                        verification OTP is:
                    </p>


                    <h1 style="
                        letter-spacing: 8px;
                    ">
                        ${otp}
                    </h1>


                    <p>
                        This OTP will expire in
                        <strong>10 minutes</strong>.
                    </p>


                    <p>
                        Regards,<br>
                        <strong>
                            FoodBridge Team
                        </strong>
                    </p>

                </div>

            `
        });


        return res.status(200).json({

            success: true,

            message:
                "New OTP sent successfully",

            email: user.email

        });


    } catch (error) {

        console.error(
            "Resend OTP Error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message: "Server error"

        });
    }
};


// =========================
// EXPORT
// =========================

module.exports = {

    signup,

    verifyOTP,

    resendOTP,

    login

};