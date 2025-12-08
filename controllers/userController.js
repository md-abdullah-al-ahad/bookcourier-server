const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/dbHelpers");
const COLLECTIONS = require("../config/collections");

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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "No fields to update. Provide name or photoURL.",
      });
    }

    updateData.updatedAt = new Date();

    const usersCollection = getCollection(COLLECTIONS.USERS);
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user profile",
      error: error.message,
    });
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

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("❌ Error getting all users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
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
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Validate userId format
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to '${role}' successfully`,
    });
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
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

    res.status(200).json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error("❌ Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  getUserStats,
};
