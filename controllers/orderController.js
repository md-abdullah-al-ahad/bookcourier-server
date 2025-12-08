const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");

/**
 * Place a new order for a book
 * @route POST /api/orders
 * @access Protected (authenticated user)
 */
const placeOrder = async (req, res) => {
  try {
    const { userName, userEmail, phoneNumber, address, bookId } = req.body;

    // Validate required fields
    const requiredFields = [
      "userName",
      "userEmail",
      "phoneNumber",
      "address",
      "bookId",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate phone number (basic validation)
    if (phoneNumber.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be at least 10 digits",
      });
    }

    // Validate bookId format
    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID format",
      });
    }

    // Find book and verify it exists and is published
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.status !== "published") {
      return res.status(400).json({
        success: false,
        message:
          "This book is not available for order. Only published books can be ordered.",
      });
    }

    // Create order document
    const orderDocument = {
      user: new ObjectId(req.user._id),
      book: new ObjectId(bookId),
      librarian: book.librarian,
      userName: userName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      orderStatus: "pending",
      paymentStatus: "unpaid",
      totalAmount: book.price,
      orderDate: new Date(),
    };

    // Insert order into database
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);
    const result = await ordersCollection.insertOne(orderDocument);

    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: "Failed to place order",
      });
    }

    // Return created order
    const createdOrder = {
      _id: result.insertedId,
      ...orderDocument,
    };

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: createdOrder,
    });
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
};

module.exports = {
  placeOrder,
};
