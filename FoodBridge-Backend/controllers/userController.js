const User = require("../models/User");

// =========================
// GET MY PROFILE
// =========================

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password -otp -otpExpires");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get Profile Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// UPDATE MY PROFILE
// =========================

const updateProfile = async (req, res) => {
    try {
        const {
            name,
            phone,
            organization,
            businessType,
            location,
            registrationNumber,
            serviceArea,
            availability,
            volunteerSkill,
            adminId,
            department,
            accessCode
        } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        if (organization !== undefined) {
            user.organization = organization;
        }

        if (businessType !== undefined) {
            user.businessType = businessType;
        }

        if (location !== undefined) {
            user.location = location;
        }

        if (registrationNumber !== undefined) {
            user.registrationNumber = registrationNumber;
        }

        if (serviceArea !== undefined) {
            user.serviceArea = serviceArea;
        }

        if (availability !== undefined) {
            user.availability = availability;
        }

        if (volunteerSkill !== undefined) {
            user.volunteerSkill = volunteerSkill;
        }

        if (adminId !== undefined) {
            user.adminId = adminId;
        }

        if (department !== undefined) {
            user.department = department;
        }

        if (accessCode !== undefined) {
            user.accessCode = accessCode;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                organization: user.organization,
                businessType: user.businessType,
                location: user.location,
                registrationNumber: user.registrationNumber,
                serviceArea: user.serviceArea,
                availability: user.availability,
                volunteerSkill: user.volunteerSkill,
                adminId: user.adminId,
                department: user.department,
                accessCode: user.accessCode
            }
        });

    } catch (error) {
        console.error("Update Profile Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// EXPORT CONTROLLERS
// =========================

module.exports = {
    getProfile,
    updateProfile
};