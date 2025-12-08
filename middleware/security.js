const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

/**
 * Configure Helmet for security headers
 * Protects against common web vulnerabilities
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Firebase
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Rate limiter for general API requests
 * Limits: 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for order creation
 * Limits: 10 orders per hour per IP
 */
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    message: "Too many order requests, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * MongoDB query sanitization
 * Prevents NoSQL injection attacks by removing $ and . from user input
 */
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: "_", // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`⚠️  Sanitized key: ${key} in request from ${req.ip}`);
    }
  },
});

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  orderLimiter,
  mongoSanitizeConfig,
};
