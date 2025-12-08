const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");
const { successResponse, errorResponse } = require("../utils/response");

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
      return errorResponse(
        res,
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return errorResponse(res, "Invalid email format", 400);
    }

    // Validate phone number (basic validation)
    if (phoneNumber.length < 10) {
      return errorResponse(res, "Phone number must be at least 10 digits", 400);
    }

    // Validate bookId format
    if (!ObjectId.isValid(bookId)) {
      return errorResponse(res, "Invalid book ID format", 400);
    }

    // Find book and verify it exists and is published
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return errorResponse(res, "Book not found", 404);
    }

    if (book.status !== "published") {
      return errorResponse(
        res,
        "This book is not available for order. Only published books can be ordered.",
        400
      );
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
      return errorResponse(res, "Failed to place order", 500);
    }

    // Return created order
    const createdOrder = {
      _id: result.insertedId,
      ...orderDocument,
    };

    return successResponse(res, createdOrder, "Order placed successfully", 201);
  } catch (error) {
    console.error("❌ Error placing order:", error);
    return errorResponse(res, "Failed to place order", 500, error.message);
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

    return successResponse(res, { count: orders.length, orders });
  } catch (error) {
    console.error("❌ Error getting user orders:", error);
    return errorResponse(res, "Failed to get orders", 500, error.message);
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

    return successResponse(res, { count: orders.length, orders });
  } catch (error) {
    console.error("❌ Error getting librarian orders:", error);
    return errorResponse(
      res,
      "Failed to get librarian orders",
      500,
      error.message
    );
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

    return successResponse(res, { count: orders.length, orders });
  } catch (error) {
    console.error("❌ Error getting all orders:", error);
    return errorResponse(res, "Failed to get orders", 500, error.message);
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
      return errorResponse(res, "Invalid order ID format", 400);
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
      return errorResponse(res, "Order not found", 404);
    }

    const order = orders[0];

    // Verify user ownership or admin/librarian access
    const isOwner = order.user.toString() === req.user._id.toString();
    const isLibrarian = order.librarian.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isLibrarian && !isAdmin) {
      return errorResponse(
        res,
        "You do not have permission to view this order",
        403
      );
    }

    return successResponse(res, order, "Order details retrieved successfully");
  } catch (error) {
    console.error("❌ Error getting order:", error);
    return errorResponse(
      res,
      "Failed to get order details",
      500,
      error.message
    );
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
      return errorResponse(res, "Invalid order ID format", 400);
    }

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Verify user ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, "You can only cancel your own orders", 403);
    }

    // Check if order status is pending
    if (order.orderStatus !== "pending") {
      return errorResponse(
        res,
        `Cannot cancel order with status '${order.orderStatus}'. Only pending orders can be cancelled.`,
        400
      );
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
      return errorResponse(res, "Order not found", 404);
    }

    return successResponse(res, null, "Order cancelled successfully");
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    return errorResponse(res, "Failed to cancel order", 500, error.message);
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
      return errorResponse(res, "Invalid order ID format", 400);
    }

    // Validate new status
    if (!newStatus) {
      return errorResponse(res, "Status is required", 400);
    }

    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return errorResponse(
        res,
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Verify librarian ownership (unless admin)
    const isLibrarian = order.librarian.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isLibrarian && !isAdmin) {
      return errorResponse(
        res,
        "You can only update orders for your own books",
        403
      );
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
      return errorResponse(
        res,
        `Invalid status transition. Cannot change from '${currentStatus}' to '${newStatus}'. Valid transitions: ${
          validTransitions[currentStatus].join(", ") || "none"
        }`,
        400
      );
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
      return errorResponse(res, "Order not found", 404);
    }

    // Get updated order
    const updatedOrder = await ordersCollection.findOne({
      _id: new ObjectId(id),
    });

    return successResponse(
      res,
      updatedOrder,
      `Order status updated to '${newStatus}' successfully`
    );
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return errorResponse(
      res,
      "Failed to update order status",
      500,
      error.message
    );
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
      return errorResponse(res, "Invalid order ID format", 400);
    }

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Verify user ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "You can only update payment for your own orders",
        403
      );
    }

    // Check if already paid
    if (order.paymentStatus === "paid") {
      return errorResponse(
        res,
        "Payment has already been completed for this order",
        400
      );
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
      return errorResponse(res, "Order not found", 404);
    }

    return successResponse(res, null, "Payment status updated successfully");
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    return errorResponse(
      res,
      "Failed to update payment status",
      500,
      error.message
    );
  }
};

/**
 * Get librarian statistics
 * @route GET /api/orders/librarian/stats
 * @access Librarian only
 */
const getLibrarianStats = async (req, res) => {
  try {
    const librarianId = req.user._id;

    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Count total books added by librarian
    const totalBooks = await booksCollection.countDocuments({
      librarian: new ObjectId(librarianId),
    });

    // Aggregate orders for librarian's books
    const orderStats = await ordersCollection
      .aggregate([
        {
          $match: {
            librarian: new ObjectId(librarianId),
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ])
      .toArray();

    const stats =
      orderStats.length > 0
        ? orderStats[0]
        : { totalOrders: 0, totalRevenue: 0 };

    return successResponse(res, {
      totalBooks,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
    });
  } catch (error) {
    console.error("❌ Error getting librarian stats:", error);
    return errorResponse(
      res,
      "Failed to get librarian statistics",
      500,
      error.message
    );
  }
};

/**
 * Get admin statistics
 * @route GET /api/orders/admin/stats
 * @access Admin only
 */
const getAdminStats = async (req, res) => {
  try {
    const usersCollection = getCollection(COLLECTIONS.USERS);
    const booksCollection = getCollection(COLLECTIONS.BOOKS);
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Count total users
    const totalUsers = await usersCollection.countDocuments();

    // Count total books
    const totalBooks = await booksCollection.countDocuments();

    // Count total orders
    const totalOrders = await ordersCollection.countDocuments();

    // Aggregate revenue and orders by status
    const revenueStats = await ordersCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ])
      .toArray();

    const totalRevenue =
      revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // Group orders by status
    const ordersByStatus = await ordersCollection
      .aggregate([
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Convert ordersByStatus array to object
    const statusBreakdown = {};
    ordersByStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    return successResponse(res, {
      totalUsers,
      totalBooks,
      totalOrders,
      totalRevenue,
      ordersByStatus: statusBreakdown,
    });
  } catch (error) {
    console.error("❌ Error getting admin stats:", error);
    return errorResponse(
      res,
      "Failed to get admin statistics",
      500,
      error.message
    );
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
  getLibrarianStats,
  getAdminStats,
};
