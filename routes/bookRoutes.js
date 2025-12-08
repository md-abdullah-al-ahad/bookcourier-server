const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { checkLibrarian } = require('../middleware/checkRole');
const { addBook } = require('../controllers/bookController');

/**
 * @route   POST /api/books/add
 * @desc    Add a new book to the library
 * @access  Librarian/Admin only
 */
router.post('/add', verifyToken, checkLibrarian, addBook);

module.exports = router;
