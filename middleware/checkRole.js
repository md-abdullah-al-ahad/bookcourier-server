/**
 * Role-based authorization middleware
 * These middlewares should be used after verifyToken middleware
 */

/**
 * Flexible role checker - supports multiple roles
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. Please login first.",
        });
      }

      const { role } = req.user;

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      // User has required role
      next();
    } catch (error) {
      console.error("❌ Role check error:", error);
      return res.status(500).json({
        success: false,
        message: "Error checking user role",
        error: error.message,
      });
    }
  };
};

/**
 * Check if user is a librarian or admin
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const checkLibrarian = (req, res, next) => {
  return checkRole("librarian", "admin")(req, res, next);
};

/**
 * Check if user is an admin
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const checkAdmin = (req, res, next) => {
  return checkRole("admin")(req, res, next);
};

/**
 * Check if user is authenticated (any role)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const checkUser = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // User is authenticated
    next();
  } catch (error) {
    console.error("❌ Authentication check error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying authentication",
      error: error.message,
    });
  }
};

module.exports = {
  checkRole,
  checkLibrarian,
  checkAdmin,
  checkUser,
};
