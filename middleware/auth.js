const { getAuth } = require("../config/firebase-admin");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");
const logger = require("../utils/logger");

/**
 * Verify Firebase JWT token and authenticate user
 * Automatically creates user in database if not exists
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "No token provided. Authorization header must be in format: Bearer <token>",
      });
    }

    // Get token from header
    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // Verify Firebase token
    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      // Handle specific Firebase token errors
      if (error.code === "auth/id-token-expired") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again.",
        });
      }

      if (error.code === "auth/argument-error") {
        return res.status(401).json({
          success: false,
          message: "Invalid token format",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid token. Authentication failed.",
        error: error.message,
      });
    }

    // Extract user information from decoded token
    const { uid, email, name, picture } = decodedToken;

    if (!uid || !email) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload. Missing required fields.",
      });
    }

    // Check if user exists in database
    const usersCollection = getCollection(COLLECTIONS.USERS);
    let user = await usersCollection.findOne({ uid });

    // If user doesn't exist, create new user document
    if (!user) {
      const newUser = {
        uid,
        name: name || decodedToken.displayName || email.split("@")[0],
        email,
        photoURL: picture || decodedToken.picture || null,
        role: "user",
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);

      if (result.acknowledged) {
        user = { ...newUser, _id: result.insertedId };
        logger.success(`New user created: ${email}`);
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to create user in database",
        });
      }
    }

    // Attach user to request object
    req.user = user;

    // Continue to next middleware
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
};
