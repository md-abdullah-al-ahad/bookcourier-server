const { ObjectId } = require("mongodb");

/**
 * Wishlist Model
 */
class Wishlist {
  constructor(data) {
    this.user = new ObjectId(data.user);
    this.book = new ObjectId(data.book);
    this.createdAt = data.createdAt || new Date();
  }

  static validate(data) {
    const errors = [];

    if (!data.user) {
      errors.push("User ID is required");
    }

    if (!data.book) {
      errors.push("Book ID is required");
    }

    return errors;
  }
}

module.exports = Wishlist;
