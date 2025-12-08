const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { checkUser } = require("../middleware/checkRole");
const {
  createPayment,
  getUserPayments,
} = require("../controllers/paymentController");

/**
 * @route   POST /api/payments
 * @desc    Create payment record after successful payment
 * @access  Protected (authenticated user)
 */
router.post("/", verifyToken, checkUser, createPayment);

/**
 * @route   GET /api/payments/my-invoices
 * @desc    Get all payments/invoices for logged-in user
 * @access  Protected (authenticated user)
 */
router.get("/my-invoices", verifyToken, checkUser, getUserPayments);

module.exports = router;
