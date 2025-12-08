const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Create payment record after successful payment
 * @route POST /api/payments
 * @access Protected (authenticated user)
 */
const createPayment = async (req, res) => {
  try {
    const { orderId, paymentId, amount, paymentMethod, transactionId } =
      req.body;

    // Validate required fields
    const requiredFields = ["orderId", "paymentId", "amount", "paymentMethod"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return errorResponse(
        res,
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    // Validate orderId format
    if (!ObjectId.isValid(orderId)) {
      return errorResponse(res, "Invalid order ID format", 400);
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return errorResponse(res, "Amount must be a valid positive number", 400);
    }

    // Verify order exists and belongs to user
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);
    const order = await ordersCollection.findOne({
      _id: new ObjectId(orderId),
    });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Verify user ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "You can only create payment for your own orders",
        403
      );
    }

    // Check if order is already paid
    if (order.paymentStatus === "paid") {
      return errorResponse(
        res,
        "Payment has already been completed for this order",
        400
      );
    }

    // Check if amount matches order total
    if (parseFloat(amount) !== order.totalAmount) {
      return errorResponse(
        res,
        `Payment amount (${amount}) does not match order total (${order.totalAmount})`,
        400
      );
    }

    // Check if paymentId is unique
    const paymentsCollection = getCollection(COLLECTIONS.PAYMENTS);
    const existingPayment = await paymentsCollection.findOne({ paymentId });

    if (existingPayment) {
      return errorResponse(
        res,
        "Payment ID already exists. Duplicate payment detected.",
        400
      );
    }

    // Create payment document
    const paymentDocument = {
      user: new ObjectId(req.user._id),
      order: new ObjectId(orderId),
      paymentId: paymentId.trim(),
      amount: parseFloat(amount),
      paymentDate: new Date(),
      paymentMethod: paymentMethod.trim(),
      transactionId: transactionId ? transactionId.trim() : null,
    };

    // Insert payment into database
    const result = await paymentsCollection.insertOne(paymentDocument);

    if (!result.acknowledged) {
      return errorResponse(res, "Failed to create payment record", 500);
    }

    // Update order's paymentStatus to 'paid'
    const updateResult = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: "paid",
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      // Rollback: Delete the payment if order update fails
      await paymentsCollection.deleteOne({ _id: result.insertedId });

      return errorResponse(res, "Failed to update order payment status", 500);
    }

    // Return created payment
    const createdPayment = {
      _id: result.insertedId,
      ...paymentDocument,
    };

    return successResponse(
      res,
      createdPayment,
      "Payment created successfully",
      201
    );
  } catch (error) {
    console.error("❌ Error creating payment:", error);
    return errorResponse(res, "Failed to create payment", 500, error.message);
  }
};

/**
 * Get all payments/invoices for logged-in user
 * @route GET /api/payments/my-invoices
 * @access Protected (authenticated user)
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    const paymentsCollection = getCollection(COLLECTIONS.PAYMENTS);

    // Use aggregate to populate order and book details
    const payments = await paymentsCollection
      .aggregate([
        { $match: { user: new ObjectId(userId) } },
        {
          $lookup: {
            from: COLLECTIONS.ORDERS,
            localField: "order",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
        {
          $unwind: {
            path: "$orderDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.BOOKS,
            localField: "orderDetails.book",
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
            paymentId: 1,
            amount: 1,
            paymentDate: 1,
            paymentMethod: 1,
            transactionId: 1,
            order: {
              _id: "$orderDetails._id",
              userName: "$orderDetails.userName",
              userEmail: "$orderDetails.userEmail",
              phoneNumber: "$orderDetails.phoneNumber",
              address: "$orderDetails.address",
              orderStatus: "$orderDetails.orderStatus",
              orderDate: "$orderDetails.orderDate",
              totalAmount: "$orderDetails.totalAmount",
            },
            book: {
              _id: "$bookDetails._id",
              name: "$bookDetails.name",
              author: "$bookDetails.author",
              image: "$bookDetails.image",
              category: "$bookDetails.category",
            },
          },
        },
        { $sort: { paymentDate: -1 } },
      ])
      .toArray();

    return successResponse(
      res,
      { payments, count: payments.length },
      "User payments retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Error getting user payments:", error);
    return errorResponse(
      res,
      "Failed to get payment records",
      500,
      error.message
    );
  }
};

module.exports = {
  createPayment,
  getUserPayments,
};
