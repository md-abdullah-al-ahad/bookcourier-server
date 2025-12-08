const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
  checkUser,
  checkLibrarian,
  checkAdmin,
} = require("../middleware/checkRole");
const {
  placeOrder,
  getUserOrders,
  getLibrarianOrders,
  getAllOrders,
  getOrderById,
} = require("../controllers/orderController");

/**
 * @route   POST /api/orders
 * @desc    Place a new order for a book
 * @access  Protected (authenticated user)
 */
router.post("/", verifyToken, checkUser, placeOrder);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get all orders for logged-in user
 * @access  Protected (authenticated user)
 */
router.get("/my-orders", verifyToken, checkUser, getUserOrders);

/**
 * @route   GET /api/orders/librarian/orders
 * @desc    Get all orders for books added by logged-in librarian
 * @access  Librarian/Admin only
 */
router.get(
  "/librarian/orders",
  verifyToken,
  checkLibrarian,
  getLibrarianOrders
);

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (admin only)
 * @access  Admin only
 */
router.get("/admin/all", verifyToken, checkAdmin, getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Protected (order owner, librarian, or admin)
 */
router.get("/:id", verifyToken, checkUser, getOrderById);

module.exports = router;
