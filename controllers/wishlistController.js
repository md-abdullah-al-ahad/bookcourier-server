const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");

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
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const userId = req.user._id;

    // Check if book exists
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if already in wishlist
    const wishlistsCollection = getCollection(COLLECTIONS.WISHLISTS);
    const existingItem = await wishlistsCollection.findOne({
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Book is already in your wishlist",
      });
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
      return res.status(500).json({
        success: false,
        message: "Failed to add book to wishlist",
      });
    }

    res.status(201).json({
      success: true,
      message: "Book added to wishlist successfully",
      data: {
        _id: result.insertedId,
        ...wishlistDocument,
      },
    });
  } catch (error) {
    console.error("❌ Error adding to wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add book to wishlist",
      error: error.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const userId = req.user._id;

    // Delete from wishlist
    const wishlistsCollection = getCollection(COLLECTIONS.WISHLISTS);
    const result = await wishlistsCollection.deleteOne({
      user: new ObjectId(userId),
      book: new ObjectId(bookId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found in wishlist",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book removed from wishlist successfully",
    });
  } catch (error) {
    console.error("❌ Error removing from wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove book from wishlist",
      error: error.message,
    });
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

    res.status(200).json({
      success: true,
      count: wishlist.length,
      data: wishlist,
    });
  } catch (error) {
    console.error("❌ Error getting wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wishlist",
      error: error.message,
    });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
};
