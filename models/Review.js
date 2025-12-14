const { ObjectId } = require("mongodb");

/**
 * Review Model
 */
class Review {
  constructor(data) {
    this.book = new ObjectId(data.book);
    this.user = new ObjectId(data.user);
    this.userName = data.userName;
    this.userPhoto = data.userPhoto || null;
    this.rating = parseInt(data.rating); // 1-5
    this.comment = data.comment || "";
    this.createdAt = data.createdAt || new Date();
  }

  static validate(data) {
    const errors = [];

    if (!data.book) {
      errors.push("Book ID is required");
    }

    if (!data.user) {
      errors.push("User ID is required");
    }

    if (!data.rating || ![1, 2, 3, 4, 5].includes(parseInt(data.rating))) {
      errors.push("Rating must be between 1 and 5");
    }

    return errors;
  }
}

module.exports = Review;
