const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/dbHelpers');
const COLLECTIONS = require('../config/collections');

/**
 * Add a new book to the library
 * @route POST /api/books/add
 * @access Librarian/Admin only
 */
const addBook = async (req, res) => {
  try {
    const { name, author, image, price, status, category, description } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'author', 'image', 'price', 'status', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate price is a number
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number'
      });
    }

    // Validate status
    const validStatuses = ['available', 'unavailable', 'out-of-stock'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
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
      description: description ? description.trim() : '',
      librarian: new ObjectId(librarianId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert book into database
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const result = await booksCollection.insertOne(bookDocument);

    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add book to database'
      });
    }

    // Return created book
    const createdBook = {
      _id: result.insertedId,
      ...bookDocument
    };

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: createdBook
    });

  } catch (error) {
    console.error('❌ Error adding book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add book',
      error: error.message
    });
  }
};

module.exports = {
  addBook
};
