const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");
const { successResponse, errorResponse } = require("../utils/response");

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
      return errorResponse(res, "Book ID and rating are required", 400);
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(bookId)) {
      return errorResponse(res, "Invalid book ID format", 400);
    }

    // Validate rating (1-5)
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return errorResponse(res, "Rating must be a number between 1 and 5", 400);
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
      return errorResponse(
        res,
        "You must order and receive this book before reviewing it. Only delivered orders can be reviewed.",
        403
      );
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
        return errorResponse(res, "Failed to update review", 500);
      }

      message = "Review updated successfully";
    } else {
      // Create new review
      result = await reviewsCollection.insertOne(reviewData);

      if (!result.acknowledged) {
        return errorResponse(res, "Failed to add review", 500);
      }

      message = "Review added successfully";
    }

    return successResponse(
      res,
      existingReview
        ? { ...existingReview, rating: ratingNum, comment: comment || "" }
        : { _id: result.insertedId, ...reviewData },
      message,
      existingReview ? 200 : 201
    );
  } catch (error) {
    console.error("❌ Error adding review:", error);
    return errorResponse(res, "Failed to add review", 500, error.message);
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
      return errorResponse(res, "Invalid book ID format", 400);
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

    return successResponse(
      res,
      {
        reviews,
        count: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      "Book reviews retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Error getting book reviews:", error);
    return errorResponse(res, "Failed to get book reviews", 500, error.message);
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

    return successResponse(
      res,
      { reviews, count: reviews.length },
      "User reviews retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Error getting user reviews:", error);
    return errorResponse(res, "Failed to get user reviews", 500, error.message);
  }
};

module.exports = {
  addReview,
  getBookReviews,
  getUserReviews,
};
