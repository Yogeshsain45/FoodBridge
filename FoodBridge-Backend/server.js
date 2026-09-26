const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// =========================
// ROUTES
// =========================

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const userRoutes = require("./routes/userRoutes");
const donationRoutes = require("./routes/donationRoutes");
const requestRoutes = require("./routes/requestRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const impactRoutes = require("./routes/impactRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminSetupRoutes = require("./routes/adminSetupRoutes");

// =========================
// SERVICES
// =========================

const {
    checkExpiredDonations
} = require("./services/expiryService");

// =========================
// DATABASE
// =========================

connectDB();

// =========================
// EXPRESS APP
// =========================

const app = express();

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from .env");
    process.exit(1);
}

// =========================
// MIDDLEWARE
// =========================

const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

// Local development commonly uses Live Server on 3000 or 5500.
// Keep these local origins allowed so a valid backend is not blocked by a
// stale FRONTEND_ORIGIN value from a previous setup.
const localDevOrigins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
];
const allowedOrigins = [...new Set([...configuredOrigins, ...localDevOrigins])];

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (curl/Postman) and configured/local dev origins.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS origin not allowed"));
    }
}));
app.use(express.json({ limit: "3mb" }));

// =========================
// API ROUTES
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/test", testRoutes);

app.use("/api/users", userRoutes);

app.use("/api/donations", donationRoutes);

app.use("/api/requests", requestRoutes);

app.use("/api/pickups", pickupRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/impact", impactRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/admin", adminRoutes);

// Private one-time admin provisioning/reset endpoints.
app.use("/api/admin-setup", adminSetupRoutes);

// =========================
// HOME ROUTE
// =========================

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, service: "FoodBridge Backend", status: "healthy" });
});

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FoodBridge Backend is running 🚀"
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "API route not found" });
});

// =========================
// FOOD EXPIRY SERVICE
// =========================

// Check expired donations every 5 minutes
setInterval(() => {
    checkExpiredDonations();
}, 5 * 60 * 1000);

// Check immediately when server starts
checkExpiredDonations();

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `FoodBridge Backend running on http://localhost:${PORT}`
    );
});