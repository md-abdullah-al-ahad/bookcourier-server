/**
 * Request Logger Middleware
 * Logs incoming HTTP requests with timestamp, method, path, IP, user info, and response time
 */

// ANSI color codes for colorful console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

/**
 * Get color based on HTTP method
 */
const getMethodColor = (method) => {
  switch (method) {
    case "GET":
      return colors.green;
    case "POST":
      return colors.cyan;
    case "PUT":
    case "PATCH":
      return colors.yellow;
    case "DELETE":
      return colors.red;
    default:
      return colors.white;
  }
};

/**
 * Get color based on status code
 */
const getStatusColor = (statusCode) => {
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  if (statusCode >= 200) return colors.green;
  return colors.white;
};

/**
 * Format timestamp
 */
const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

/**
 * Sanitize request body to exclude sensitive data
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;

  const sanitized = { ...body };
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "authorization",
  ];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "***REDACTED***";
    }
  });

  return sanitized;
};

/**
 * Request Logger Middleware
 */
const requestLogger = (req, res, next) => {
  // Capture request start time
  const startTime = Date.now();

  // Extract request information
  const method = req.method;
  const path = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress || "Unknown";
  const userAgent = req.get("user-agent") || "Unknown";
  const timestamp = formatTimestamp();

  // Get user email if authenticated
  const userEmail = req.user?.email || "Anonymous";

  // Log incoming request
  const methodColor = getMethodColor(method);
  console.log(
    `\n${colors.dim}[${timestamp}]${colors.reset} ` +
      `${methodColor}${colors.bright}${method.padEnd(7)}${colors.reset} ` +
      `${colors.blue}${path}${colors.reset}`
  );
  console.log(
    `${colors.dim}├─ IP:${colors.reset} ${ip} ${colors.dim}│${colors.reset} ` +
      `${colors.dim}User:${colors.reset} ${colors.magenta}${userEmail}${colors.reset}`
  );

  // Optionally log request body (exclude GET requests)
  if (method !== "GET" && req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeBody(req.body);
    console.log(
      `${colors.dim}├─ Body:${colors.reset} ${colors.cyan}${JSON.stringify(
        sanitizedBody
      )}${colors.reset}`
    );
  }

  // Intercept response to log response time and status
  const originalSend = res.send;
  res.send = function (data) {
    // Calculate response time
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Get status code
    const statusCode = res.statusCode;
    const statusColor = getStatusColor(statusCode);

    // Log response
    console.log(
      `${colors.dim}└─ Status:${colors.reset} ${statusColor}${statusCode}${colors.reset} ${colors.dim}│${colors.reset} ` +
        `${colors.dim}Time:${colors.reset} ${colors.yellow}${responseTime}ms${colors.reset}`
    );

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
