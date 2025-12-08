const { getDB } = require("../config/db");
const COLLECTIONS = require("../config/collections");
const { ObjectId } = require("mongodb");

/**
 * Get a MongoDB collection
 * @param {string} collectionName - Name of the collection
 * @returns {Collection} MongoDB collection instance
 */
const getCollection = (collectionName) => {
  try {
    const db = getDB();
    return db.collection(collectionName);
  } catch (error) {
    console.error(
      `Error accessing collection ${collectionName}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Create necessary indexes on all collections
 * This ensures optimal query performance and data integrity
 * @returns {Promise<void>}
 */
const createIndexes = async () => {
  try {
    const db = getDB();
    console.log("📋 Creating database indexes...");

    // Users collection indexes
    await db
      .collection(COLLECTIONS.USERS)
      .createIndex({ email: 1 }, { unique: true, name: "email_unique" });
    console.log("✅ Users indexes created: email (unique)");

    // Books collection indexes
    await db
      .collection(COLLECTIONS.BOOKS)
      .createIndex({ librarian: 1 }, { name: "librarian_index" });
    await db
      .collection(COLLECTIONS.BOOKS)
      .createIndex({ status: 1 }, { name: "status_index" });
    console.log("✅ Books indexes created: librarian, status");

    // Orders collection indexes
    await db
      .collection(COLLECTIONS.ORDERS)
      .createIndex({ user: 1 }, { name: "user_index" });
    await db
      .collection(COLLECTIONS.ORDERS)
      .createIndex({ orderStatus: 1 }, { name: "orderStatus_index" });
    await db
      .collection(COLLECTIONS.ORDERS)
      .createIndex({ book: 1 }, { name: "book_index" });
    console.log("✅ Orders indexes created: user, orderStatus, book");

    // Payments collection indexes
    await db
      .collection(COLLECTIONS.PAYMENTS)
      .createIndex({ user: 1 }, { name: "user_index" });
    await db
      .collection(COLLECTIONS.PAYMENTS)
      .createIndex(
        { paymentId: 1 },
        { unique: true, name: "paymentId_unique" }
      );
    console.log("✅ Payments indexes created: user, paymentId (unique)");

    // Wishlists collection indexes
    await db
      .collection(COLLECTIONS.WISHLISTS)
      .createIndex(
        { user: 1, book: 1 },
        { unique: true, name: "user_book_unique" }
      );
    console.log("✅ Wishlists indexes created: user+book (unique compound)");

    // Reviews collection indexes
    await db
      .collection(COLLECTIONS.REVIEWS)
      .createIndex(
        { user: 1, book: 1 },
        { unique: true, name: "user_book_unique" }
      );
    console.log("✅ Reviews indexes created: user+book (unique compound)");

    console.log("🎉 All database indexes created successfully!");
  } catch (error) {
    // Don't fail if indexes already exist
    if (error.code === 11000 || error.codeName === "IndexOptionsConflict") {
      console.log("ℹ️  Indexes already exist, skipping creation");
    } else {
      console.error("❌ Error creating indexes:", error.message);
      throw error;
    }
  }
};

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
const validateObjectId = (id) => {
  if (!id) return false;
  return ObjectId.isValid(id);
};

/**
 * Convert string to MongoDB ObjectId
 * @param {string} id - ID string to convert
 * @returns {ObjectId|null} ObjectId instance or null if invalid
 */
const toObjectId = (id) => {
  if (!validateObjectId(id)) return null;
  try {
    return new ObjectId(id);
  } catch (error) {
    return null;
  }
};

/**
 * Remove undefined and null values from query object
 * Useful for building MongoDB queries with optional filters
 * @param {Object} query - Query object to sanitize
 * @returns {Object} Sanitized query object
 */
const sanitizeQuery = (query) => {
  const sanitized = {};
  for (const key in query) {
    if (query[key] !== undefined && query[key] !== null) {
      sanitized[key] = query[key];
    }
  }
  return sanitized;
};

/**
 * Calculate pagination values
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Pagination object with skip, limit, and page
 */
const paginationHelper = (page = 1, limit = 10) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    limit: limitNum,
    page: pageNum,
  };
};

/**
 * Build MongoDB sort object from sort parameter string
 * @param {string} sortParam - Sort parameter (e.g., 'name', '-price', 'createdAt')
 * @returns {Object} MongoDB sort object
 * @example
 * buildSortObject('name') // { name: 1 }
 * buildSortObject('-price') // { price: -1 }
 * buildSortObject('createdAt,-name') // { createdAt: 1, name: -1 }
 */
const buildSortObject = (sortParam = "-createdAt") => {
  const sortObject = {};

  if (!sortParam) {
    return { createdAt: -1 }; // Default sort
  }

  const sortFields = sortParam.split(",");

  sortFields.forEach((field) => {
    const trimmedField = field.trim();
    if (trimmedField.startsWith("-")) {
      // Descending order
      sortObject[trimmedField.substring(1)] = -1;
    } else {
      // Ascending order
      sortObject[trimmedField] = 1;
    }
  });

  return sortObject;
};

module.exports = {
  getCollection,
  createIndexes,
  validateObjectId,
  toObjectId,
  sanitizeQuery,
  paginationHelper,
  buildSortObject,
};
