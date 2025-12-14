const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB, getDB } = require("./config/db");
const { initializeFirebaseAdmin } = require("./config/firebase-admin");
const { createIndexes } = require("./utils/dbHelpers");
const requestLogger = require("./middleware/requestLogger");
const logger = require("./utils/logger");
const {
  helmetConfig,
  generalLimiter,
  mongoSanitizeConfig,
} = require("./middleware/security");
require("dotenv").config();

// Import Routes
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

/**
 * CORS Configuration
 * Cross-Origin Resource Sharing settings to allow requests from specific origins
 */

// List of allowed origins (can be extended for multiple client URLs)
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:5173", // Vite default dev server
  "http://localhost:5174",
  "https://bookcourier-client-xi.vercel.app", // Production frontend
];

const corsOptions = {
  /**
   * origin: Configures the Access-Control-Allow-Origin header
   * Function checks if the requesting origin is in the allowedOrigins list
   * Allows requests without origin (e.g., mobile apps, Postman, curl)
   */
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      // Origin is in the allowed list
      callback(null, true);
    } else {
      // Origin is not allowed
      callback(new Error("Not allowed by CORS"));
    }
  },

  /**
   * credentials: Configures the Access-Control-Allow-Credentials header
   * Set to true to allow cookies, authorization headers, and TLS client certificates
   */
  credentials: true,

  /**
   * methods: Configures the Access-Control-Allow-Methods header
   * Specifies which HTTP methods are allowed when accessing the resource
   */
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  /**
   * allowedHeaders: Configures the Access-Control-Allow-Headers header
   * Specifies which headers can be used in the actual request
   */
  allowedHeaders: ["Content-Type", "Authorization"],

  /**
   * exposedHeaders: Configures the Access-Control-Expose-Headers header
   * Specifies which headers are safe to expose to the client
   */
  exposedHeaders: ["Content-Length", "X-Request-Id"],

  /**
   * optionsSuccessStatus: Status code to send for successful OPTIONS requests
   * Some legacy browsers (IE11, various SmartTVs) choke on 204
   */
  optionsSuccessStatus: 200,

  /**
   * maxAge: Configures the Access-Control-Max-Age header
   * Indicates how long the results of a preflight request can be cached (in seconds)
   */
  maxAge: 86400, // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly (OPTIONS method)
app.options("*", cors(corsOptions));

// Security Middleware
app.use(helmetConfig); // Helmet for security headers
app.use(mongoSanitizeConfig); // Prevent NoSQL injection

// Body parsing middleware (with size limits for security)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Apply rate limiting to all routes
app.use(generalLimiter);

// Request Logger Middleware (logs all incoming requests)
app.use(requestLogger);

// Make database accessible to routes
app.use((req, res, next) => {
  req.db = getDB;
  next();
});

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to BookCourier API",
    status: "Server is running successfully",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);

// Server
const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create database indexes
    await createIndexes();

    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    // Start Express server only in non-Vercel environment
    if (process.env.VERCEL !== "1") {
      app.listen(PORT, () => {
        logger.server(`BookCourier server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    logger.error("Failed to start server:", error);
    // Don't exit in production/Vercel
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

startServer();

// Export app for Vercel serverless functions
module.exports = app;
