const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { checkAdmin, checkUser } = require("../middleware/checkRole");
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  getUserStats,
} = require("../controllers/userController");

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Protected (any authenticated user)
 */
router.get("/profile", verifyToken, checkUser, getUserProfile);

/**
 * @route   GET /api/users/stats
 * @desc    Get current user statistics (orders, spending, etc.)
 * @access  Protected (any authenticated user)
 */
router.get("/stats", verifyToken, checkUser, getUserStats);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Protected (any authenticated user)
 */
router.put("/profile", verifyToken, checkUser, updateUserProfile);

/**
 * @route   GET /api/users/all
 * @desc    Get all users
 * @access  Admin only
 * @query   excludeAdmin=true (optional) - exclude admin users from list
 */
router.get("/all", verifyToken, checkAdmin, getAllUsers);

/**
 * @route   PATCH /api/users/:userId/role
 * @desc    Update user role
 * @access  Admin only
 */
router.patch("/:userId/role", verifyToken, checkAdmin, updateUserRole);

module.exports = router;
