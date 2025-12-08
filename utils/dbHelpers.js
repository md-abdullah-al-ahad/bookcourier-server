const { getDB } = require("../config/db");
const COLLECTIONS = require("../config/collections");

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

module.exports = {
  getCollection,
  createIndexes,
};
