const express = require("express");
const router = express.Router();
const SupervisorController = require("../controller/SupervisorController");

// Register Admin (default admin: admin@gmail.com / admin@123)
router.post("/supervisor_register", SupervisorController.registerSupervisor);

// Login Admin
// router.post("/login", adminController.loginAdmin);

module.exports = router;
