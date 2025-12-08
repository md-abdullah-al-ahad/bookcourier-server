const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { checkUser } = require("../middleware/checkRole");
const { placeOrder } = require("../controllers/orderController");

/**
 * @route   POST /api/orders
 * @desc    Place a new order for a book
 * @access  Protected (authenticated user)
 */
router.post("/", verifyToken, checkUser, placeOrder);

module.exports = router;
