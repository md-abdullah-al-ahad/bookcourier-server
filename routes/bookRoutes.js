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

module.exports = router;
