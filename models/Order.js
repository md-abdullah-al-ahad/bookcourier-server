const { ObjectId } = require("mongodb");

/**
 * Order Model
 */
class Order {
  constructor(data) {
    this.book = new ObjectId(data.book);
    this.bookName = data.bookName;
    this.user = new ObjectId(data.user);
    this.userName = data.userName;
    this.userEmail = data.userEmail;
    this.phoneNumber = data.phoneNumber;
    this.address = data.address;
    this.price = parseFloat(data.price);
    this.orderStatus = data.orderStatus || "pending"; // pending, shipped, delivered, cancelled
    this.paymentStatus = data.paymentStatus || "unpaid"; // unpaid, paid
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static validate(data) {
    const errors = [];

    if (!data.book) {
      errors.push("Book ID is required");
    }

    if (!data.phoneNumber || data.phoneNumber.trim() === "") {
      errors.push("Phone number is required");
    }

    if (!data.address || data.address.trim() === "") {
      errors.push("Address is required");
    }

    if (
      !data.price ||
      isNaN(parseFloat(data.price)) ||
      parseFloat(data.price) <= 0
    ) {
      errors.push("Valid price is required");
    }

    return errors;
  }
}

module.exports = Order;
