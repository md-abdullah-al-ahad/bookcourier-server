const { ObjectId } = require("mongodb");

/**
 * Payment Model
 */
class Payment {
  constructor(data) {
    this.order = new ObjectId(data.order);
    this.user = new ObjectId(data.user);
    this.amount = parseFloat(data.amount);
    this.transactionId = data.transactionId; // Stripe/Payment gateway transaction ID
    this.paymentMethod = data.paymentMethod || "stripe";
    this.paymentStatus = data.paymentStatus || "completed";
    this.createdAt = data.createdAt || new Date();
  }

  static validate(data) {
    const errors = [];

    if (!data.order) {
      errors.push("Order ID is required");
    }

    if (!data.user) {
      errors.push("User ID is required");
    }

    if (
      !data.amount ||
      isNaN(parseFloat(data.amount)) ||
      parseFloat(data.amount) <= 0
    ) {
      errors.push("Valid amount is required");
    }

    if (!data.transactionId || data.transactionId.trim() === "") {
      errors.push("Transaction ID is required");
    }

    return errors;
  }
}

module.exports = Payment;
