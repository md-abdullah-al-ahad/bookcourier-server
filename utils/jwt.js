const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, email, role) => {
  try {
    const payload = {
      userId,
      email,
      role,
    };

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Generate token with 7 days expiration
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    return token;
  } catch (error) {
    console.error("❌ Error generating JWT token:", error);
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyJwtToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Verify and decode token
    const decoded = jwt.verify(token, secret);

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    } else {
      throw error;
    }
  }
};

module.exports = {
  generateToken,
  verifyJwtToken,
};
