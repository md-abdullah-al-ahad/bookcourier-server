const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB, getDB } = require("./config/db");
const { initializeFirebaseAdmin } = require("./config/firebase-admin");
const { createIndexes } = require("./utils/dbHelpers");
require("dotenv").config();

// Import Routes
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 BookCourier server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
