const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");

/**
 * Add review (user can review only if they ordered the book)
 * @route POST /api/reviews
 * @access Protected (authenticated user)
 */
const addReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;

    // Validate required fields
    if (!bookId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Book ID and rating are required",
      });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    // Validate rating (1-5)
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    const userId = req.user._id;

    // Verify user has a delivered order for this book
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);
    const order = await ordersCollection.findOne({
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
      orderStatus: "delivered",
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message:
          "You must order and receive this book before reviewing it. Only delivered orders can be reviewed.",
      });
    }

    // Check if review already exists
    const reviewsCollection = getCollection(COLLECTIONS.REVIEWS);
    const existingReview = await reviewsCollection.findOne({
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
    });

    const reviewData = {
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
      order: order._id,
      rating: ratingNum,
      comment: comment ? comment.trim() : "",
      createdAt: new Date(),
    };

    let result;
    let message;

    if (existingReview) {
      // Update existing review
      result = await reviewsCollection.updateOne(
        {
          user: new ObjectId(userId),
          book: new ObjectId(bookId),
        },
        {
          $set: {
            rating: ratingNum,
            comment: comment ? comment.trim() : "",
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to update review",
        });
      }

      message = "Review updated successfully";
    } else {
      // Create new review
      result = await reviewsCollection.insertOne(reviewData);

      if (!result.acknowledged) {
        return res.status(500).json({
          success: false,
          message: "Failed to add review",
        });
      }

      message = "Review added successfully";
    }

    res.status(existingReview ? 200 : 201).json({
      success: true,
      message,
      data: existingReview
        ? { ...existingReview, rating: ratingNum, comment: comment || "" }
        : { _id: result.insertedId, ...reviewData },
    });
  } catch (error) {
    console.error("❌ Error adding review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: error.message,
    });
  }
};

/**
 * Get all reviews for a specific book
 * @route GET /api/reviews/book/:bookId
 * @access Public
 */
const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Validate ObjectId format
    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const reviewsCollection = getCollection(COLLECTIONS.REVIEWS);

    // Use aggregate to populate user details
    const reviews = await reviewsCollection
      .aggregate([
        { $match: { book: new ObjectId(bookId) } },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              _id: "$userDetails._id",
              name: "$userDetails.name",
              photoURL: "$userDetails.photoURL",
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      data: reviews,
    });
  } catch (error) {
    console.error("❌ Error getting book reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get book reviews",
      error: error.message,
    });
  }
};

/**
 * Get all reviews by logged-in user
 * @route GET /api/reviews/my-reviews
 * @access Protected (authenticated user)
 */
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviewsCollection = getCollection(COLLECTIONS.REVIEWS);

    // Use aggregate to populate book details
    const reviews = await reviewsCollection
      .aggregate([
        { $match: { user: new ObjectId(userId) } },
        {
          $lookup: {
            from: COLLECTIONS.BOOKS,
            localField: "book",
            foreignField: "_id",
            as: "bookDetails",
          },
        },
        {
          $unwind: {
            path: "$bookDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            updatedAt: 1,
            book: {
              _id: "$bookDetails._id",
              name: "$bookDetails.name",
              author: "$bookDetails.author",
              image: "$bookDetails.image",
              category: "$bookDetails.category",
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("❌ Error getting user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user reviews",
      error: error.message,
    });
  }
};

module.exports = {
  addReview,
  getBookReviews,
  getUserReviews,
};
