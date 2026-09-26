const express = require("express");
const { provisionMainAdmin, resetAdminPassword } = require("../controllers/adminSetupController");

const router = express.Router();

// Private setup endpoint. Not shown in public signup/login UI.
router.post("/provision-main", provisionMainAdmin);
router.post("/reset-password", resetAdminPassword);

module.exports = router;
