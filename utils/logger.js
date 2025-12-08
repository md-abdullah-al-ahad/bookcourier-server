/**
 * Logger Utility
 * Provides conditional logging based on environment
 * Use this instead of console.log for development/debug messages
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Log informational messages
 * Only logs in development mode
 * @param {...any} args - Arguments to log
 */
const info = (...args) => {
  if (isDevelopment) {
    console.log("ℹ️ ", ...args);
  }
};

/**
 * Log success messages
 * Logs in all environments
 * @param {...any} args - Arguments to log
 */
const success = (...args) => {
  console.log("✅", ...args);
};

/**
 * Log warning messages
 * Logs in all environments
 * @param {...any} args - Arguments to log
 */
const warn = (...args) => {
  console.warn("⚠️ ", ...args);
};

/**
 * Log error messages
 * Logs in all environments with stack trace in development
 * @param {string} message - Error message
 * @param {Error} [error] - Error object (optional)
 */
const error = (message, error = null) => {
  console.error("❌", message);
  if (error && isDevelopment && error.stack) {
    console.error(error.stack);
  }
};

/**
 * Log debug messages
 * Only logs in development mode
 * @param {...any} args - Arguments to log
 */
const debug = (...args) => {
  if (isDevelopment) {
    console.log("🐛", ...args);
  }
};

/**
 * Log database operation messages
 * Only logs in development mode
 * @param {...any} args - Arguments to log
 */
const db = (...args) => {
  if (isDevelopment) {
    console.log("💾", ...args);
  }
};

/**
 * Log server/network messages
 * Logs in all environments
 * @param {...any} args - Arguments to log
 */
const server = (...args) => {
  console.log("🚀", ...args);
};

module.exports = {
  info,
  success,
  warn,
  error,
  debug,
  db,
  server,
  isDevelopment,
  isProduction,
};
