const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Get current user profile
 * @route GET /api/users/profile
 * @access Protected
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const usersCollection = getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, user, "User profile retrieved successfully");
  } catch (error) {
    console.error("❌ Error getting user profile:", error);
    return errorResponse(res, "Failed to get user profile", 500, error.message);
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Protected
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, photoURL } = req.body;

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        res,
        "No fields to update. Provide name or photoURL.",
        400
      );
    }

    updateData.updatedAt = new Date();

    const usersCollection = getCollection(COLLECTIONS.USERS);
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return errorResponse(res, "User not found", 404);
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    return successResponse(res, updatedUser, "Profile updated successfully");
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    return errorResponse(
      res,
      "Failed to update user profile",
      500,
      error.message
    );
  }
};

/**
 * Get all users (Admin only)
 * @route GET /api/users/all
 * @access Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const usersCollection = getCollection(COLLECTIONS.USERS);

    // Optional: exclude admin users from list
    const excludeAdmin = req.query.excludeAdmin === "true";
    const query = excludeAdmin ? { role: { $ne: "admin" } } : {};

    const users = await usersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(
      res,
      { users, count: users.length },
      "Users retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Error getting all users:", error);
    return errorResponse(res, "Failed to get users", 500, error.message);
  }
};

/**
 * Update user role (Admin only)
 * @route PATCH /api/users/:userId/role
 * @access Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ["user", "librarian", "admin"];
    if (!role || !validRoles.includes(role)) {
      return errorResponse(
        res,
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        400
      );
    }

    // Validate userId format
    if (!ObjectId.isValid(userId)) {
      return errorResponse(res, "Invalid user ID format", 400);
    }

    const usersCollection = getCollection(COLLECTIONS.USERS);
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(
      res,
      null,
      `User role updated to '${role}' successfully`
    );
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    return errorResponse(res, "Failed to update user role", 500, error.message);
  }
};

/**
 * Get user statistics
 * @route GET /api/users/stats
 * @access Protected
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const ordersCollection = getCollection(COLLECTIONS.ORDERS);

    // Aggregate user statistics
    const stats = await ordersCollection
      .aggregate([
        {
          $match: {
            user: new ObjectId(userId),
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    // If no orders found, return zero stats
    const userStats =
      stats.length > 0
        ? stats[0]
        : { totalOrders: 0, totalSpent: 0, pendingOrders: 0 };

    // Remove the _id field
    delete userStats._id;

    return successResponse(
      res,
      userStats,
      "User statistics retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Error getting user stats:", error);
    return errorResponse(
      res,
      "Failed to get user statistics",
      500,
      error.message
    );
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  getUserStats,
};
