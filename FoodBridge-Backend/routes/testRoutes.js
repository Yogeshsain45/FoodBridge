const express = require("express");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/protected", protect, (req, res) => {
    res.json({
        success: true,
        message: "Protected route accessed successfully 🔐",
        user: req.user
    });
});

module.exports = router;