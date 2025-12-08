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

/**
 * Get all orders for logged-in user
 * @route GET /api/orders/my-orders
 * @access Protected (authenticated user)
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Use aggregate to populate book details
    const orders = await ordersCollection
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
            userName: 1,
            userEmail: 1,
            phoneNumber: 1,
            address: 1,
            orderStatus: 1,
            paymentStatus: 1,
            totalAmount: 1,
            orderDate: 1,
            book: {
              _id: "$bookDetails._id",
              name: "$bookDetails.name",
              author: "$bookDetails.author",
              image: "$bookDetails.image",
              price: "$bookDetails.price",
              category: "$bookDetails.category",
            },
          },
        },
        { $sort: { orderDate: -1 } },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error getting user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    });
  }
};

/**
 * Get all orders for books added by logged-in librarian
 * @route GET /api/orders/librarian/orders
 * @access Librarian/Admin only
 */
const getLibrarianOrders = async (req, res) => {
  try {
    const librarianId = req.user._id;

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Use aggregate to populate book and user details
    const orders = await ordersCollection
      .aggregate([
        { $match: { librarian: new ObjectId(librarianId) } },
        {
          $lookup: {
            from: COLLECTIONS.BOOKS,
            localField: "book",
            foreignField: "_id",
            as: "bookDetails",
          },
        },
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
            path: "$bookDetails",
            preserveNullAndEmptyArrays: true,
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
            userName: 1,
            userEmail: 1,
            phoneNumber: 1,
            address: 1,
            orderStatus: 1,
            paymentStatus: 1,
            totalAmount: 1,
            orderDate: 1,
            book: {
              _id: "$bookDetails._id",
              name: "$bookDetails.name",
              author: "$bookDetails.author",
              image: "$bookDetails.image",
              price: "$bookDetails.price",
              category: "$bookDetails.category",
            },
            user: {
              _id: "$userDetails._id",
              name: "$userDetails.name",
              email: "$userDetails.email",
              photoURL: "$userDetails.photoURL",
            },
          },
        },
        { $sort: { orderDate: -1 } },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error getting librarian orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get librarian orders",
      error: error.message,
    });
  }
};

/**
 * Get all orders (admin only)
 * @route GET /api/orders/admin/all
 * @access Admin only
 */
const getAllOrders = async (req, res) => {
  try {
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Use aggregate to populate book, user, and librarian details
    const orders = await ordersCollection
      .aggregate([
        {
          $lookup: {
            from: COLLECTIONS.BOOKS,
            localField: "book",
            foreignField: "_id",
            as: "bookDetails",
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
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
            path: "$bookDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
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
            userName: 1,
            userEmail: 1,
            phoneNumber: 1,
            address: 1,
            orderStatus: 1,
            paymentStatus: 1,
            totalAmount: 1,
            orderDate: 1,
            book: {
              _id: "$bookDetails._id",
              name: "$bookDetails.name",
              author: "$bookDetails.author",
              image: "$bookDetails.image",
              price: "$bookDetails.price",
              category: "$bookDetails.category",
            },
            user: {
              _id: "$userDetails._id",
              name: "$userDetails.name",
              email: "$userDetails.email",
              photoURL: "$userDetails.photoURL",
            },
            librarian: {
              _id: "$librarianDetails._id",
              name: "$librarianDetails.name",
              email: "$librarianDetails.email",
              role: "$librarianDetails.role",
            },
          },
        },
        { $sort: { orderDate: -1 } },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error getting all orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    });
  }
};

/**
 * Get single order by ID
 * @route GET /api/orders/:id
 * @access Protected (order owner, librarian, or admin)
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Use aggregate to populate book details
    const orders = await ordersCollection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: COLLECTIONS.BOOKS,
            localField: "book",
            foreignField: "_id",
            as: "bookDetails",
          },
        },
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
            path: "$bookDetails",
            preserveNullAndEmptyArrays: true,
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
            user: 1,
            userName: 1,
            userEmail: 1,
            phoneNumber: 1,
            address: 1,
            orderStatus: 1,
            paymentStatus: 1,
            totalAmount: 1,
            orderDate: 1,
            librarian: 1,
            book: {
              _id: "$bookDetails._id",
              name: "$bookDetails.name",
              author: "$bookDetails.author",
              image: "$bookDetails.image",
              price: "$bookDetails.price",
              category: "$bookDetails.category",
              description: "$bookDetails.description",
            },
            librarianInfo: {
              _id: "$librarianDetails._id",
              name: "$librarianDetails.name",
              email: "$librarianDetails.email",
            },
          },
        },
      ])
      .toArray();

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];

    // Verify user ownership or admin/librarian access
    const isOwner = order.user.toString() === req.user._id.toString();
    const isLibrarian = order.librarian.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isLibrarian && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this order",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("❌ Error getting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get order details",
      error: error.message,
    });
  }
};

/**
 * Cancel order (user can cancel if status is pending)
 * @route PATCH /api/orders/:id/cancel
 * @access Protected (order owner)
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify user ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders",
      });
    }

    // Check if order status is pending
    if (order.orderStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.orderStatus}'. Only pending orders can be cancelled.`,
      });
    }

    // Update order status to cancelled
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          orderStatus: "cancelled",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

/**
 * Update order status (librarian can change status)
 * @route PATCH /api/orders/:id/status
 * @access Librarian/Admin only
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Validate new status
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify librarian ownership (unless admin)
    const isLibrarian = order.librarian.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isLibrarian && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only update orders for your own books",
      });
    }

    // Validate status transitions
    const currentStatus = order.orderStatus;

    // Define valid transitions
    const validTransitions = {
      pending: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. Cannot change from '${currentStatus}' to '${newStatus}'. Valid transitions: ${
          validTransitions[currentStatus].join(", ") || "none"
        }`,
      });
    }

    // Update order status
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          orderStatus: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Get updated order
    const updatedOrder = await ordersCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to '${newStatus}' successfully`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

/**
 * Update payment status
 * @route PATCH /api/orders/:id/payment
 * @access Protected (order owner)
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify user ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update payment for your own orders",
      });
    }

    // Check if already paid
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment has already been completed for this order",
      });
    }

    // Update payment status to paid
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          paymentStatus: "paid",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
  getLibrarianOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  updatePaymentStatus,
};
