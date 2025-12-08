const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Add book to user's wishlist
 * @route POST /api/wishlist
 * @access Protected (authenticated user)
 */
const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.body;

    // Validate bookId
    if (!bookId) {
      return errorResponse(res, "Book ID is required", 400);
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(bookId)) {
      return errorResponse(res, "Invalid book ID format", 400);
    }

    const userId = req.user._id;

    // Check if book exists
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return errorResponse(res, "Book not found", 404);
    }

    // Check if already in wishlist
    const wishlistsCollection = getCollection(COLLECTIONS.WISHLISTS);
    const existingItem = await wishlistsCollection.findOne({
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
    });

    if (existingItem) {
      return errorResponse(res, "Book is already in your wishlist", 400);
    }

    // Create wishlist document
    const wishlistDocument = {
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
      addedAt: new Date(),
    };

    // Insert into wishlist
    const result = await wishlistsCollection.insertOne(wishlistDocument);

    if (!result.acknowledged) {
      return errorResponse(res, "Failed to add book to wishlist", 500);
    }

    return successResponse(
      res,
      {
        _id: result.insertedId,
        ...wishlistDocument,
      },
      "Book added to wishlist successfully",
      201
    );
  } catch (error) {
    console.error("❌ Error adding to wishlist:", error);
    return errorResponse(
      res,
      "Failed to add book to wishlist",
      500,
      error.message
    );
  }
};

/**
 * Remove book from wishlist
 * @route DELETE /api/wishlist/:bookId
 * @access Protected (authenticated user)
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Validate ObjectId format
    if (!ObjectId.isValid(bookId)) {
      return errorResponse(res, "Invalid book ID format", 400);
    }

    const userId = req.user._id;

    // Delete from wishlist
    const wishlistsCollection = getCollection(COLLECTIONS.WISHLISTS);
    const result = await wishlistsCollection.deleteOne({
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
    });

    if (result.deletedCount === 0) {
      return errorResponse(res, "Book not found in wishlist", 404);
    }

    return successResponse(
      res,
      null,
      "Book removed from wishlist successfully"
    );
  } catch (error) {
    console.error("❌ Error removing from wishlist:", error);
    return errorResponse(
      res,
      "Failed to remove book from wishlist",
      500,
      error.message
    );
  }
};

/**
 * Get all wishlist items for user
 * @route GET /api/wishlist
 * @access Protected (authenticated user)
 */
const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlistsCollection = getCollection(COLLECTIONS.WISHLISTS);

    // Use aggregate to populate book details
    const wishlist = await wishlistsCollection
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
            addedAt: 1,
            book: {
              _id: "$bookDetails._id",
              name: "$bookDetails.name",
              author: "$bookDetails.author",
              image: "$bookDetails.image",
              price: "$bookDetails.price",
              status: "$bookDetails.status",
              category: "$bookDetails.category",
              description: "$bookDetails.description",
            },
          },
        },
        { $sort: { addedAt: -1 } },
      ])
      .toArray();

    return successResponse(
      res,
      { wishlist, count: wishlist.length },
      "User wishlist retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Error getting wishlist:", error);
    return errorResponse(res, "Failed to get wishlist", 500, error.message);
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
};
