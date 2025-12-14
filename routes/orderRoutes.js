const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
  checkUser,
  checkLibrarian,
  checkAdmin,
} = require("../middleware/checkRole");
const { orderLimiter } = require("../middleware/security");
const {
  placeOrder,
  getUserOrders,
  getLibrarianOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getLibrarianStats,
  getAdminStats,
  canReviewBook,
} = require("../controllers/orderController");

/**
 * @route   POST /api/orders
 * @desc    Place a new order for a book
 * @access  Protected (authenticated user)
 */
router.post("/", orderLimiter, verifyToken, checkUser, placeOrder);

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
 * @route   GET /api/orders/librarian/stats
 * @desc    Get statistics for logged-in librarian (books, orders, revenue)
 * @access  Librarian/Admin only
 */
router.get("/librarian/stats", verifyToken, checkLibrarian, getLibrarianStats);

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (admin only)
 * @access  Admin only
 */
router.get("/admin/all", verifyToken, checkAdmin, getAllOrders);

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Get comprehensive admin statistics
 * @access  Admin only
 */
router.get("/admin/stats", verifyToken, checkAdmin, getAdminStats);

/**
 * @route   GET /api/orders/can-review/:bookId
 * @desc    Check if user can review a book (must have ordered it)
 * @access  Protected (authenticated user)
 */
router.get("/can-review/:bookId", verifyToken, checkUser, canReviewBook);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Protected (order owner, librarian, or admin)
 */
router.get("/:id", verifyToken, checkUser, getOrderById);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order (user can cancel if status is pending)
 * @access  Protected (order owner)
 */
router.patch("/:id/cancel", verifyToken, checkUser, cancelOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (librarian can change status)
 * @access  Librarian/Admin only
 */
router.patch("/:id/status", verifyToken, checkLibrarian, updateOrderStatus);

/**
 * @route   PATCH /api/orders/:id/payment
 * @desc    Update payment status after payment
 * @access  Protected (order owner)
 */
router.patch("/:id/payment", verifyToken, checkUser, updatePaymentStatus);

module.exports = router;
