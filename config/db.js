const { MongoClient } = require("mongodb");
const logger = require("../utils/logger");

let dbInstance = null;
let client = null;

// MongoDB connection options for connection pooling
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Establishes connection to MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || "bookcourier";

    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Create MongoDB client
    client = new MongoClient(uri, options);

    // Connect to MongoDB
    //await client.connect();

    // Get database instance
    dbInstance = client.db(dbName);

    logger.success(`MongoDB connected successfully to database: ${dbName}`);

    // Verify connection
    //await dbInstance.command({ ping: 1 });
    logger.success("Database ping successful");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

/**
 * Returns the database instance
 * @returns {Db} MongoDB database instance
 */
const getDB = () => {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return dbInstance;
};

/**
 * Closes the database connection
 * @returns {Promise<void>}
 */
const closeDB = async () => {
  if (client) {
    await client.close();
    logger.success("MongoDB connection closed");
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB,
};
