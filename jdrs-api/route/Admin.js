const express = require("express");
const router = express.Router();
const adminController = require("../controller/AdminController");

// Register Admin (default admin: admin@gmail.com / admin@123)
router.post("/register", adminController.registerAdmin);

// Login Admin
router.post("/login", adminController.loginAdmin);

router.post("/logout", adminController.logoutAdmin);


module.exports = router;
