const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { checkUser } = require("../middleware/checkRole");
const {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
} = require("../controllers/wishlistController");

/**
 * @route   POST /api/wishlist
 * @desc    Add book to user's wishlist
 * @access  Protected (authenticated user)
 */
router.post("/", verifyToken, checkUser, addToWishlist);

/**
 * @route   DELETE /api/wishlist/:bookId
 * @desc    Remove book from wishlist
 * @access  Protected (authenticated user)
 */
router.delete("/:bookId", verifyToken, checkUser, removeFromWishlist);

/**
 * @route   GET /api/wishlist
 * @desc    Get all wishlist items for user
 * @access  Protected (authenticated user)
 */
router.get("/", verifyToken, checkUser, getUserWishlist);

module.exports = router;
