const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Add a new book to the library
 * @route POST /api/books/add
 * @access Librarian/Admin only
 */
const addBook = async (req, res) => {
  try {
    const { name, author, image, price, status, category, description } =
      req.body;

    // Validate required fields
    const requiredFields = [
      "name",
      "author",
      "image",
      "price",
      "status",
      "category",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate price is a number
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    // Validate status
    const validStatuses = ["available", "unavailable", "out-of-stock"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Get librarian ID from authenticated user
    const librarianId = req.user._id;

    // Create book document
    const bookDocument = {
      name: name.trim(),
      author: author.trim(),
      image: image.trim(),
      price: parseFloat(price),
      status,
      category: category.trim(),
      description: description ? description.trim() : "",
      librarian: new ObjectId(librarianId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert book into database
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const result = await booksCollection.insertOne(bookDocument);

    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: "Failed to add book to database",
      });
    }

    // Return created book
    const createdBook = {
      _id: result.insertedId,
      ...bookDocument,
    };

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: createdBook,
    });
  } catch (error) {
    console.error("❌ Error adding book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add book",
      error: error.message,
    });
  }
};

/**
 * Get all published books (public view)
 * @route GET /api/books
 * @access Public
 */
const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", sort = "newest" } = req.query;

    const booksCollection = getCollection(COLLECTIONS.BOOKS);

    // Build query
    const query = { status: "published" };

    // Add search by name (case-insensitive)
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "name_asc":
        sortOption = { name: 1 };
        break;
      case "name_desc":
        sortOption = { name: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const totalCount = await booksCollection.countDocuments(query);

    // Get books with pagination and sorting
    const books = await booksCollection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: {
        books,
        totalCount,
        page: pageNum,
        totalPages,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("❌ Error getting books:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get books",
      error: error.message,
    });
  }
};

/**
 * Get single book by ID with librarian details
 * @route GET /api/books/:id
 * @access Public
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const booksCollection = getCollection(COLLECTIONS.BOOKS);

    // Use aggregate to populate librarian info
    const books = await booksCollection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: "librarian",
            foreignField: "_id",
            as: "librarianDetails",
          },
        },
        {
          $unwind: {
            path: "$librarianDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: 1,
            author: 1,
            image: 1,
            price: 1,
            status: 1,
            category: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            librarian: {
              _id: "$librarianDetails._id",
              name: "$librarianDetails.name",
              email: "$librarianDetails.email",
              photoURL: "$librarianDetails.photoURL",
            },
          },
        },
      ])
      .toArray();

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      data: books[0],
    });
  } catch (error) {
    console.error("❌ Error getting book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get book details",
      error: error.message,
    });
  }
};

/**
 * Get all books added by logged-in librarian
 * @route GET /api/books/librarian/my-books
 * @access Librarian/Admin only
 */
const getLibrarianBooks = async (req, res) => {
  try {
    const librarianId = req.user._id;

    const booksCollection = getCollection(COLLECTIONS.BOOKS);

    // Get all books by this librarian (published + unpublished)
    const books = await booksCollection
      .find({ librarian: new ObjectId(librarianId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("❌ Error getting librarian books:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get librarian books",
      error: error.message,
    });
  }
};

/**
 * Get all books for admin (regardless of status)
 * @route GET /api/books/admin/all
 * @access Admin only
 */
const getAllBooksForAdmin = async (req, res) => {
  try {
    const booksCollection = getCollection(COLLECTIONS.BOOKS);

    // Use aggregate to populate librarian info
    const books = await booksCollection
      .aggregate([
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: "librarian",
            foreignField: "_id",
            as: "librarianDetails",
          },
        },
        {
          $unwind: {
            path: "$librarianDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: 1,
            author: 1,
            image: 1,
            price: 1,
            status: 1,
            category: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            librarian: {
              _id: "$librarianDetails._id",
              name: "$librarianDetails.name",
              email: "$librarianDetails.email",
              photoURL: "$librarianDetails.photoURL",
              role: "$librarianDetails.role",
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("❌ Error getting all books for admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get books",
      error: error.message,
    });
  }
};

/**
 * Update book (librarian can update their own books)
 * @route PUT /api/books/:id
 * @access Librarian/Admin only
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, author, image, price, status, category, description } =
      req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const booksCollection = getCollection(COLLECTIONS.BOOKS);

    // Find book and verify ownership
    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Verify librarian ownership (unless user is admin)
    const isOwner = book.librarian.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own books",
      });
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (author) updateData.author = author.trim();
    if (image) updateData.image = image.trim();
    if (price !== undefined) {
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid positive number",
        });
      }
      updateData.price = parseFloat(price);
    }
    if (status) {
      const validStatuses = [
        "available",
        "unavailable",
        "out-of-stock",
        "published",
        "unpublished",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }
      updateData.status = status;
    }
    if (category) updateData.category = category.trim();
    if (description !== undefined) updateData.description = description.trim();

    updateData.updatedAt = new Date();

    // Update book
    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Get updated book
    const updatedBook = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("❌ Error updating book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update book",
      error: error.message,
    });
  }
};

/**
 * Delete book and cascade delete related data (admin only)
 * @route DELETE /api/books/:id
 * @access Admin only
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const bookId = new ObjectId(id);

    // Check if book exists
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const book = await booksCollection.findOne({ _id: bookId });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Delete the book
    const deleteResult = await booksCollection.deleteOne({ _id: bookId });

    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete book",
      });
    }

    // Cascade delete: Remove all orders for this book
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);
    await ordersCollection.deleteMany({ book: bookId });

    // Cascade delete: Remove all wishlists for this book
    const wishlistsCollection = getCollection(COLLECTIONS.WISHLISTS);
    await wishlistsCollection.deleteMany({ book: bookId });

    // Cascade delete: Remove all reviews for this book
    const reviewsCollection = getCollection(COLLECTIONS.REVIEWS);
    await reviewsCollection.deleteMany({ book: bookId });

    res.status(200).json({
      success: true,
      message: "Book and all related data deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete book",
      error: error.message,
    });
  }
};

/**
 * Toggle book status between published and unpublished
 * @route PATCH /api/books/:id/status
 * @access Librarian/Admin only
 */
const toggleBookStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    const booksCollection = getCollection(COLLECTIONS.BOOKS);

    // Find book and verify ownership
    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Verify librarian ownership (unless user is admin)
    const isOwner = book.librarian.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only toggle status of your own books",
      });
    }

    // Toggle status
    const newStatus = book.status === "published" ? "unpublished" : "published";

    // Update book status
    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Book status changed to '${newStatus}' successfully`,
      data: {
        status: newStatus,
      },
    });
  } catch (error) {
    console.error("❌ Error toggling book status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle book status",
      error: error.message,
    });
  }
};

module.exports = {
  addBook,
  getAllBooks,
  getBookById,
  getLibrarianBooks,
  getAllBooksForAdmin,
  updateBook,
  deleteBook,
  toggleBookStatus,
};
