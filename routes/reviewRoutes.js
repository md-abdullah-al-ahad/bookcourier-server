const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { checkUser } = require("../middleware/checkRole");
const {
  addReview,
  getBookReviews,
  getUserReviews,
} = require("../controllers/reviewController");

/**
 * @route   POST /api/reviews
 * @desc    Add or update review (user can review only if they ordered the book)
 * @access  Protected (authenticated user)
 */
router.post("/", verifyToken, checkUser, addReview);

/**
 * @route   GET /api/reviews/book/:bookId
 * @desc    Get all reviews for a specific book
 * @access  Public
 */
router.get("/book/:bookId", getBookReviews);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get all reviews by logged-in user
 * @access  Protected (authenticated user)
 */
router.get("/my-reviews", verifyToken, checkUser, getUserReviews);

module.exports = router;
