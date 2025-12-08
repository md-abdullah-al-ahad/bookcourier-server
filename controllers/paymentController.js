const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");

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
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate orderId format
    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    // Verify order exists and belongs to user
    const ordersCollection = getCollection(COLLECTIONS.ORDERS);
    const order = await ordersCollection.findOne({
      _id: new ObjectId(orderId),
    });

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
        message: "You can only create payment for your own orders",
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment has already been completed for this order",
      });
    }

    // Check if amount matches order total
    if (parseFloat(amount) !== order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) does not match order total (${order.totalAmount})`,
      });
    }

    // Check if paymentId is unique
    const paymentsCollection = getCollection(COLLECTIONS.PAYMENTS);
    const existingPayment = await paymentsCollection.findOne({ paymentId });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment ID already exists. Duplicate payment detected.",
      });
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
      return res.status(500).json({
        success: false,
        message: "Failed to create payment record",
      });
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

      return res.status(500).json({
        success: false,
        message: "Failed to update order payment status",
      });
    }

    // Return created payment
    const createdPayment = {
      _id: result.insertedId,
      ...paymentDocument,
    };

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: createdPayment,
    });
  } catch (error) {
    console.error("❌ Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
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

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("❌ Error getting user payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment records",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getUserPayments,
};
