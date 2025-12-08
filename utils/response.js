/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} error - Optional error details
 */
const errorResponse = (
  res,
  message = "An error occurred",
  statusCode = 500,
  error = null
) => {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {*} data - Response data (array of items)
 * @param {number} page - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} totalCount - Total count of items
 * @param {string} message - Success message
 */
const paginatedResponse = (
  res,
  data,
  page,
  totalPages,
  totalCount,
  message = "Success"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      totalPages,
      totalCount,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
