const express = require("express");

const {
   register,
   login,
   getMe,
   forgotPassword,
   resetPassword
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get current authenticated user
router.get("/me", authMiddleware, getMe);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password/:token", resetPassword);

module.exports = router;