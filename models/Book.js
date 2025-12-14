const { ObjectId } = require("mongodb");

/**
 * Book Model
 */
class Book {
  constructor(data) {
    this.name = data.name;
    this.image = data.image;
    this.author = data.author;
    this.category = data.category || "General";
    this.description = data.description || "";
    this.price = parseFloat(data.price);
    this.quantity = parseInt(data.quantity) || 0;
    this.status = data.status || "published"; // 'published' or 'unpublished'
    this.librarian = data.librarian; // ObjectId of librarian who added the book
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static validate(data) {
    const errors = [];

    if (!data.name || data.name.trim() === "") {
      errors.push("Book name is required");
    }

    if (!data.author || data.author.trim() === "") {
      errors.push("Author name is required");
    }

    if (
      !data.price ||
      isNaN(parseFloat(data.price)) ||
      parseFloat(data.price) <= 0
    ) {
      errors.push("Valid price is required");
    }

    if (!data.librarian) {
      errors.push("Librarian ID is required");
    }

    if (data.status && !["published", "unpublished"].includes(data.status)) {
      errors.push('Status must be either "published" or "unpublished"');
    }

    return errors;
  }
}

module.exports = Book;
