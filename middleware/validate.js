const { body, validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  return ObjectId.isValid(value);
};

// Validation chain for book input
const validateBookInput = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Book name is required")
    .isLength({ min: 3 })
    .withMessage("Book name must be at least 3 characters long"),

  body("author")
    .trim()
    .notEmpty()
    .withMessage("Author name is required")
    .isLength({ min: 2 })
    .withMessage("Author name must be at least 2 characters long"),

  body("image")
    .trim()
    .notEmpty()
    .withMessage("Image URL is required")
    .isURL()
    .withMessage("Image must be a valid URL"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a numeric value")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),

  body("status")
    .optional()
    .isIn(["published", "unpublished"])
    .withMessage('Status must be either "published" or "unpublished"'),
];

// Validation chain for order input
const validateOrderInput = [
  body("userName")
    .trim()
    .notEmpty()
    .withMessage("User name is required")
    .isLength({ min: 3 })
    .withMessage("User name must be at least 3 characters long"),

  body("userEmail")
    .trim()
    .notEmpty()
    .withMessage("User email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage("Phone number must be in a valid format")
    .isLength({ min: 10 })
    .withMessage("Phone number must be at least 10 characters long"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 10 })
    .withMessage("Address must be at least 10 characters long"),

  body("bookId")
    .trim()
    .notEmpty()
    .withMessage("Book ID is required")
    .custom(isValidObjectId)
    .withMessage("Book ID must be a valid MongoDB ObjectId"),
];

// Validation chain for review
const validateReview = [
  body("bookId")
    .trim()
    .notEmpty()
    .withMessage("Book ID is required")
    .custom(isValidObjectId)
    .withMessage("Book ID must be a valid MongoDB ObjectId"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment must not exceed 500 characters"),
];

// Validation chain for user update
const validateUserUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),

  body("photoURL")
    .optional()
    .trim()
    .isURL()
    .withMessage("Photo URL must be a valid URL"),
];

module.exports = {
  validateBookInput,
  validateOrderInput,
  validateReview,
  validateUserUpdate,
  handleValidationErrors,
};
