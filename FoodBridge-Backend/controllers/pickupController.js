const Pickup = require("../models/Pickup");
const FoodRequest = require("../models/FoodRequest");
const FoodDonation = require("../models/FoodDonation");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const {
    createNotification
} = require("./notificationController");

// =========================
// EMAIL TRANSPORTER
// =========================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// =========================
// CREATE PICKUP
// =========================

const createPickup = async (req, res) => {
    try {
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        if (req.user.role !== "volunteer") {
            return res.status(403).json({
                success: false,
                message: "Only volunteers can create pickups"
            });
        }

        const request = await FoodRequest.findById(requestId)
            .populate("donation")
            .populate("receiver", "name email phone location latitude longitude");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

        if (request.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Only approved requests can be picked up"
            });
        }

        const existingPickup = await Pickup.findOne({
            request: requestId,
            status: {
                $nin: ["cancelled", "delivered"]
            }
        });

        if (existingPickup) {
            return res.status(400).json({
                success: false,
                message: "Pickup already exists for this request"
            });
        }

        const donation = request.donation;

        const pickup = await Pickup.create({
            request: request._id,
            donation: donation._id,
            volunteer: req.user.userId,
            pickupLocation: donation.pickupLocation,
            deliveryLocation: request.receiver?.location || "Receiver location",
            pickupLatitude: donation.pickupLatitude ?? null,
            pickupLongitude: donation.pickupLongitude ?? null,
            deliveryLatitude: request.receiver?.latitude ?? null,
            deliveryLongitude: request.receiver?.longitude ?? null,
            status: "assigned"
        });

        // =========================
        // EMAIL OTP TO RECEIVER
        // =========================

        if (request.receiver && request.receiver.email) {
            try {
                await transporter.sendMail({
                    from: `"FoodBridge Team" <${process.env.EMAIL_USER}>`,
                    to: request.receiver.email,
                    subject: "FoodBridge Delivery OTP 🔐",
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>FoodBridge Delivery Verification</h2>

                            <p>Hello ${request.receiver.name || "User"},</p>

                            <p>
                                Your food delivery is being processed through FoodBridge.
                            </p>

                            <p>
                                Please share this OTP with the volunteer
                                only when your food is delivered.
                            </p>

                            <h1 style="letter-spacing: 8px;">
                                ${pickup.deliveryOTP}
                            </h1>

                            <p>
                                <strong>Do not share this OTP before receiving the food.</strong>
                            </p>

                            <p>Thank you for using FoodBridge ❤️</p>
                        </div>
                    `
                });

                console.log(
                    `Delivery OTP email sent to ${request.receiver.email}`
                );

            } catch (emailError) {
                console.error(
                    "OTP Email Error:",
                    emailError.message
                );
            }
        }

        // 🔔 Notify receiver
        await createNotification({
            recipient: request.receiver._id,
            type: "pickup_assigned",
            title: "Volunteer Assigned 🚚",
            message: `A volunteer has been assigned to deliver your ${donation.foodName}.`,
            relatedDonation: donation._id,
            relatedRequest: request._id,
            relatedPickup: pickup._id
        });

        res.status(201).json({
            success: true,
            message: "Pickup created successfully",
            pickup
        });

    } catch (error) {
        console.error(
            "Create Pickup Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET MY PICKUPS
// =========================

const getMyPickups = async (req, res) => {
    try {
        const pickups = await Pickup.find({
            volunteer: req.user.userId
        })
            .populate(
                "donation",
                "foodName quantity quantityUnit pickupLocation pickupLatitude pickupLongitude donor"
            )
            .populate({
                path: "request",
                select: "requestedQuantity message status receiver",
                populate: { path: "receiver", select: "name organization location latitude longitude" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pickups.length,
            pickups
        });

    } catch (error) {
        console.error(
            "Get My Pickups Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET AVAILABLE PICKUPS
// =========================

const getAvailablePickups = async (req, res) => {
    try {
        const pickups = await Pickup.find({
            status: "assigned"
        })
            .populate(
                "donation",
                "foodName quantity quantityUnit pickupLocation pickupLatitude pickupLongitude donor"
            )
            .populate({
                path: "request",
                select: "requestedQuantity message receiver",
                populate: { path: "receiver", select: "name organization location latitude longitude" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pickups.length,
            pickups
        });

    } catch (error) {
        console.error(
            "Get Available Pickups Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET RECEIVER / NGO PICKUPS
// =========================

const getReceiverPickups = async (req, res) => {
    try {
        if (req.user.role !== "receiver") {
            return res.status(403).json({
                success: false,
                message: "Only receivers can view their delivery tracking"
            });
        }

        const pickups = await Pickup.find()
            .populate(
                "donation",
                "foodName quantity quantityUnit pickupLocation pickupLatitude pickupLongitude donor"
            )
            .populate({
                path: "request",
                select: "requestedQuantity message status receiver",
                populate: { path: "receiver", select: "name organization location latitude longitude" }
            })
            .sort({ createdAt: -1 });

        const mine = pickups.filter(p =>
            p.request && p.request.receiver &&
            String(p.request.receiver._id) === String(req.user.userId)
        );

        res.status(200).json({
            success: true,
            count: mine.length,
            pickups: mine
        });
    } catch (error) {
        console.error("Get Receiver Pickups Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// ACCEPT PICKUP
// =========================

const acceptPickup = async (req, res) => {
    try {
        const pickup = await Pickup.findOneAndUpdate(
            { _id: req.params.id, status: "assigned" },
            { $set: { volunteer: req.user.userId, status: "accepted" } },
            { new: true }
        )
            .populate("donation")
            .populate("request");

        if (!pickup) {
            return res.status(400).json({
                success: false,
                message: "This pickup is no longer available"
            });
        }

        await createNotification({
            recipient: pickup.request.receiver,
            type: "pickup_accepted",
            title: "Pickup Accepted 🚚",
            message: `A volunteer has accepted your ${pickup.donation.foodName} delivery.`,
            relatedDonation: pickup.donation._id,
            relatedRequest: pickup.request._id,
            relatedPickup: pickup._id
        });

        res.status(200).json({
            success: true,
            message: "Pickup accepted successfully",
            pickup
        });

    } catch (error) {
        console.error("Accept Pickup Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// =========================
// MARK FOOD AS PICKED UP
// =========================

const markPickedUp = async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id)
            .populate("donation")
            .populate("request");

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: "Pickup not found"
            });
        }

        if (
            pickup.volunteer.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own pickup"
            });
        }

        if (pickup.status !== "accepted") {
            return res.status(400).json({
                success: false,
                message: "Pickup must be accepted first"
            });
        }

        pickup.status = "picked_up";
        pickup.pickupTime = new Date();

        await pickup.save();

        await FoodDonation.findByIdAndUpdate(
            pickup.donation._id,
            {
                status: "picked_up"
            }
        );

        // 🔔 Notify receiver
        await createNotification({
            recipient: pickup.request.receiver,
            type: "food_picked_up",
            title: "Food Picked Up 📦",
            message: `Your ${pickup.donation.foodName} has been picked up and is on the way.`,
            relatedDonation: pickup.donation._id,
            relatedRequest: pickup.request._id,
            relatedPickup: pickup._id
        });

        res.status(200).json({
            success: true,
            message: "Food marked as picked up",
            pickup
        });

    } catch (error) {
        console.error(
            "Mark Picked Up Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// MARK IN TRANSIT
// =========================

const markInTransit = async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id)
            .populate("donation")
            .populate("request");

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: "Pickup not found"
            });
        }

        if (
            pickup.volunteer.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own pickup"
            });
        }

        if (pickup.status !== "picked_up") {
            return res.status(400).json({
                success: false,
                message: "Food must be picked up first"
            });
        }

        pickup.status = "in_transit";

        await pickup.save();

        // 🔔 Notify receiver
        await createNotification({
            recipient: pickup.request.receiver,
            type: "food_in_transit",
            title: "Food Is On The Way 🚚",
            message: `Your ${pickup.donation.foodName} is now in transit.`,
            relatedDonation: pickup.donation._id,
            relatedRequest: pickup.request._id,
            relatedPickup: pickup._id
        });

        // 🔔 Notify volunteer
        await createNotification({
            recipient: pickup.volunteer,
            type: "food_in_transit",
            title: "Delivery In Transit 🚚",
            message: `Your ${pickup.donation.foodName} delivery is now marked as in transit.`,
            relatedDonation: pickup.donation._id,
            relatedRequest: pickup.request._id,
            relatedPickup: pickup._id
        });

        res.status(200).json({
            success: true,
            message: "Pickup marked as in transit",
            pickup
        });

    } catch (error) {
        console.error(
            "Mark In Transit Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// COMPLETE DELIVERY
// =========================

const completeDelivery = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Delivery OTP is required"
            });
        }

        const pickup = await Pickup.findById(req.params.id)
            .populate("donation")
            .populate("request");

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: "Pickup not found"
            });
        }

        if (
            pickup.volunteer.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only complete your own pickup"
            });
        }

        if (
            pickup.status !== "in_transit" &&
            pickup.status !== "picked_up"
        ) {
            return res.status(400).json({
                success: false,
                message: "Pickup is not ready for delivery"
            });
        }

        if (!pickup.deliveryOTP) {
            return res.status(400).json({
                success: false,
                message: "Delivery OTP has not been generated"
            });
        }

        if (pickup.deliveryOTP !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery OTP"
            });
        }

        pickup.status = "delivered";
        pickup.deliveredAt = new Date();
        pickup.otpVerified = true;

        await pickup.save();

        await FoodDonation.findByIdAndUpdate(
            pickup.donation._id,
            {
                status: "delivered"
            }
        );

        await FoodRequest.findByIdAndUpdate(
            pickup.request._id,
            {
                status: "completed"
            }
        );

        // 🔔 Notify receiver
        await createNotification({
            recipient: pickup.request.receiver,
            type: "food_delivered",
            title: "Food Delivered 🎉",
            message: `Your ${pickup.donation.foodName} has been delivered successfully.`,
            relatedDonation: pickup.donation._id,
            relatedRequest: pickup.request._id,
            relatedPickup: pickup._id
        });

        // 🔔 Notify donor
        await createNotification({
            recipient: pickup.donation.donor,
            type: "food_delivered",
            title: "Food Donation Delivered 🎉",
            message: `Your ${pickup.donation.foodName} donation has been delivered successfully.`,
            relatedDonation: pickup.donation._id,
            relatedRequest: pickup.request._id,
            relatedPickup: pickup._id
        });

        res.status(200).json({
            success: true,
            message: "Food delivered successfully",
            pickup
        });

    } catch (error) {
        console.error(
            "Complete Delivery Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getPickupById = async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id)
            .populate("donation", "foodName quantity quantityUnit pickupLocation pickupLatitude pickupLongitude donor")
            .populate({
                path: "request",
                select: "requestedQuantity status receiver",
                populate: { path: "receiver", select: "name organization location latitude longitude" }
            })
            .populate("volunteer", "name phone");

        if (!pickup) {
            return res.status(404).json({ success: false, message: "Pickup not found" });
        }

        const userId = req.user.userId;
        const isAssignedVolunteer =
            req.user.role === "volunteer" &&
            pickup.volunteer &&
            pickup.volunteer._id.toString() === userId;

        // Any logged-in volunteer may view an unassigned pickup so they can
        // inspect the real restaurant/NGO locations before accepting it.
        const isAvailableForVolunteer =
            req.user.role === "volunteer" &&
            pickup.status === "assigned" &&
            !pickup.volunteer;

        const isReceiver =
            pickup.request &&
            pickup.request.receiver &&
            pickup.request.receiver._id.toString() === userId;

        const isDonor =
            pickup.donation &&
            pickup.donation.donor &&
            pickup.donation.donor.toString &&
            pickup.donation.donor.toString() === userId;

        const allowed =
            isAssignedVolunteer ||
            isAvailableForVolunteer ||
            isReceiver ||
            isDonor ||
            req.user.role === "admin";

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this pickup"
            });
        }

        res.status(200).json({ success: true, pickup });
    } catch (error) {
        console.error("Get Pickup Error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    createPickup,
    getPickupById,
    getMyPickups,
    getAvailablePickups,
    getReceiverPickups,
    acceptPickup,
    markPickedUp,
    markInTransit,
    completeDelivery
};