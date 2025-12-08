const { ObjectId } = require("mongodb");
const { verifyJwtToken } = require("../utils/jwt");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");

/**
 * Verify JWT token and authenticate user
 * Alternative to Firebase authentication
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const verifyJwt = async (req, res, next) => {
  try {
    let token = null;

    // Check for token in cookies first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check for token in Authorization header
    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split("Bearer ")[1];
      }
    }

    // No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Authorization required.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyJwtToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid or expired token",
      });
    }

    // Extract userId from token
    const { userId } = decoded;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Validate userId format
    if (!ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID in token",
      });
    }

    // Find user in database
    const usersCollection = getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    // Attach user to request object
    req.user = user;

    // Continue to next middleware
    next();
  } catch (error) {
    console.error("❌ JWT Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
      error: error.message,
    });
  }
};

module.exports = {
  verifyJwt,
};
