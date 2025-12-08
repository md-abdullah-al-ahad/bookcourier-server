const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { checkLibrarian, checkAdmin } = require("../middleware/checkRole");
const {
  addBook,
  getAllBooks,
  getBookById,
  getLibrarianBooks,
  getAllBooksForAdmin,
  updateBook,
  deleteBook,
  toggleBookStatus,
} = require("../controllers/bookController");

/**
 * @route   POST /api/books/add
 * @desc    Add a new book to the library
 * @access  Librarian/Admin only
 */
router.post("/add", verifyToken, checkLibrarian, addBook);

/**
 * @route   GET /api/books
 * @desc    Get all published books with pagination, search, and sorting
 * @access  Public
 * @query   page, limit, search, sort (newest, price_asc, price_desc, name_asc, name_desc)
 */
router.get("/", getAllBooks);

/**
 * @route   GET /api/books/librarian/my-books
 * @desc    Get all books added by logged-in librarian
 * @access  Librarian/Admin only
 */
router.get(
  "/librarian/my-books",
  verifyToken,
  checkLibrarian,
  getLibrarianBooks
);

/**
 * @route   GET /api/books/admin/all
 * @desc    Get all books regardless of status (with librarian info)
 * @access  Admin only
 */
router.get("/admin/all", verifyToken, checkAdmin, getAllBooksForAdmin);

/**
 * @route   GET /api/books/:id
 * @desc    Get single book by ID with librarian details
 * @access  Public
 */
router.get("/:id", getBookById);

/**
 * @route   PUT /api/books/:id
 * @desc    Update book (librarian can update their own books)
 * @access  Librarian/Admin only
 */
router.put("/:id", verifyToken, checkLibrarian, updateBook);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book and all related data
 * @access  Admin only
 */
router.delete("/:id", verifyToken, checkAdmin, deleteBook);

/**
 * @route   PATCH /api/books/:id/status
 * @desc    Toggle book status between published and unpublished
 * @access  Librarian/Admin only
 */
router.patch("/:id/status", verifyToken, checkLibrarian, toggleBookStatus);

module.exports = router;
