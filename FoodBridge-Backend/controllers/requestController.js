const FoodRequest = require("../models/FoodRequest");
const FoodDonation = require("../models/FoodDonation");
const Pickup = require("../models/Pickup");

const {
    createNotification
} = require("./notificationController");


// =========================
// CREATE FOOD REQUEST
// Receiver only
// =========================

const createRequest = async (req, res) => {
    try {
        const {
            donationId,
            requestedQuantity,
            message
        } = req.body;

        if (!donationId || !requestedQuantity) {
            return res.status(400).json({
                success: false,
                message: "Donation ID and requested quantity are required"
            });
        }

        if (req.user.role !== "receiver") {
            return res.status(403).json({
                success: false,
                message: "Only receivers can request food"
            });
        }

        const donation = await FoodDonation.findById(donationId);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Food donation not found"
            });
        }

        if (donation.status !== "available") {
            return res.status(400).json({
                success: false,
                message: "This food donation is no longer available"
            });
        }

        if (requestedQuantity > donation.quantity) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available food"
            });
        }

        if (donation.donor.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot request your own donation"
            });
        }

        const existingRequest = await FoodRequest.findOne({
            donation: donationId,
            receiver: req.user.userId,
            status: "pending"
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending request for this donation"
            });
        }

        const request = await FoodRequest.create({
            donation: donationId,
            receiver: req.user.userId,
            requestedQuantity,
            message
        });

        await createNotification({
            recipient: donation.donor,
            type: "food_request",
            title: "New Food Request",
            message: `Someone requested ${requestedQuantity} ${donation.quantityUnit} of ${donation.foodName}.`,
            relatedDonation: donation._id,
            relatedRequest: request._id
        });

        res.status(201).json({
            success: true,
            message: "Food request created successfully",
            request
        });

    } catch (error) {
        console.error("Create Request Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET MY REQUESTS
// Receiver only
// =========================

const getMyRequests = async (req, res) => {
    try {
        const requests = await FoodRequest.find({
            receiver: req.user.userId
        })
            .populate({
                path: "donation",
                populate: {
                    path: "donor",
                    select: "name email phone"
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error("Get My Requests Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// GET REQUESTS FOR MY DONATIONS
// Donor only
// =========================

const getDonationRequests = async (req, res) => {
    try {
        if (req.user.role !== "donor") {
            return res.status(403).json({
                success: false,
                message: "Only donors can view donation requests"
            });
        }

        const myDonations = await FoodDonation.find({
            donor: req.user.userId
        }).select("_id");

        const donationIds = myDonations.map(
            donation => donation._id
        );

        const requests = await FoodRequest.find({
            donation: { $in: donationIds }
        })
            .populate("receiver", "name email phone")
            .populate(
                "donation",
                "foodName quantity quantityUnit pickupLocation status"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error(
            "Get Donation Requests Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// APPROVE REQUEST
// Donor only
// =========================

const approveRequest = async (req, res) => {
    try {
        const request = await FoodRequest.findById(req.params.id)
            .populate("donation")
            .populate("receiver", "name email phone location latitude longitude");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

        if (
            request.donation.donor.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only approve requests for your donations"
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This request has already been processed"
            });
        }

        // Approve request
        request.status = "approved";
        await request.save();

        // Update donation status
        await FoodDonation.findByIdAndUpdate(
            request.donation._id,
            {
                status: "accepted"
            }
        );

        // Automatically create pickup
        // Volunteer remains unassigned
        console.log("CREATING PICKUP FOR REQUEST:", request._id);
        const pickup = await Pickup.create({
            request: request._id,
            donation: request.donation._id,
            volunteer: null,
            pickupLocation: request.donation.pickupLocation,
            deliveryLocation: request.receiver?.location || "Receiver location",
            pickupLatitude: request.donation.pickupLatitude ?? null,
            pickupLongitude: request.donation.pickupLongitude ?? null,
            deliveryLatitude: request.receiver?.latitude ?? null,
            deliveryLongitude: request.receiver?.longitude ?? null,
            status: "assigned"
        });

        console.log("PICKUP CREATED:", pickup._id);

        // Reject other pending requests
        await FoodRequest.updateMany(
            {
                donation: request.donation._id,
                _id: { $ne: request._id },
                status: "pending"
            },
            {
                status: "rejected"
            }
        );

        // Notify receiver
        await createNotification({
            recipient: request.receiver,
            type: "request_approved",
            title: "Food Request Approved",
            message: `Your request for ${request.requestedQuantity} ${request.donation.quantityUnit} of ${request.donation.foodName} has been approved.`,
            relatedDonation: request.donation._id,
            relatedRequest: request._id
        });

        res.status(200).json({
            success: true,
            message: "Food request approved successfully",
            request,
            pickup
        });

    } catch (error) {
        console.error(
            "Approve Request Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// REJECT REQUEST
// Donor only
// =========================

const rejectRequest = async (req, res) => {
    try {
        const request = await FoodRequest.findById(req.params.id)
            .populate("donation")
            .populate("receiver", "name email phone location latitude longitude");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

        if (
            request.donation.donor.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only reject requests for your donations"
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This request has already been processed"
            });
        }

        request.status = "rejected";
        await request.save();

        // Notify receiver
        await createNotification({
            recipient: request.receiver,
            type: "request_rejected",
            title: "Food Request Rejected",
            message: `Your request for ${request.requestedQuantity} ${request.donation.quantityUnit} of ${request.donation.foodName} was rejected.`,
            relatedDonation: request.donation._id,
            relatedRequest: request._id
        });

        res.status(200).json({
            success: true,
            message: "Food request rejected successfully",
            request
        });

    } catch (error) {
        console.error(
            "Reject Request Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// CANCEL MY REQUEST
// Receiver only
// =========================

const cancelRequest = async (req, res) => {
    try {
        const request = await FoodRequest.findById(req.params.id)
            .populate("donation")
            .populate("receiver", "name email phone location latitude longitude");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

        if (
            request.receiver.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own request"
            });
        }

        if (
            request.status !== "pending" &&
            request.status !== "approved"
        ) {
            return res.status(400).json({
                success: false,
                message: "This request cannot be cancelled"
            });
        }

        request.status = "cancelled";
        await request.save();

        if (request.status === "cancelled") {
            await Pickup.updateMany(
                { request: request._id, status: { $nin: ["delivered", "cancelled"] } },
                { $set: { status: "cancelled" } }
            );
            const activeRequests = await FoodRequest.countDocuments({
                donation: request.donation._id,
                status: { $in: ["pending", "approved"] },
                _id: { $ne: request._id }
            });
            if (!activeRequests) {
                await FoodDonation.findByIdAndUpdate(request.donation._id, { status: "available" });
            }
        }

        // Notify donor
        await createNotification({
            recipient: request.donation.donor,
            type: "general",
            title: "Food Request Cancelled",
            message: `A request for ${request.requestedQuantity} ${request.donation.quantityUnit} of ${request.donation.foodName} has been cancelled.`,
            relatedDonation: request.donation._id,
            relatedRequest: request._id
        });

        res.status(200).json({
            success: true,
            message: "Food request cancelled successfully",
            request
        });

    } catch (error) {
        console.error(
            "Cancel Request Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =========================
// EXPORTS
// =========================

module.exports = {
    createRequest,
    getMyRequests,
    getDonationRequests,
    approveRequest,
    rejectRequest,
    cancelRequest
};
