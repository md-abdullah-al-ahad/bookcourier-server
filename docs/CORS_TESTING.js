/**
 * CORS Testing Guide
 *
 * This file contains examples and instructions for testing CORS configuration
 */

// ============================================================================
// 1. Testing with cURL (Command Line)
// ============================================================================

/**
 * Test preflight request (OPTIONS)
 * This simulates what browsers do before making actual requests
 */
// curl -X OPTIONS http://localhost:5000/api/books \
//   -H "Origin: http://localhost:3000" \
//   -H "Access-Control-Request-Method: POST" \
//   -H "Access-Control-Request-Headers: Content-Type" \
//   -v

/**
 * Test GET request from allowed origin
 */
// curl -X GET http://localhost:5000/api/books \
//   -H "Origin: http://localhost:3000" \
//   -v

/**
 * Test POST request from allowed origin with credentials
 */
// curl -X POST http://localhost:5000/api/reviews \
//   -H "Origin: http://localhost:3000" \
//   -H "Content-Type: application/json" \
//   -H "Authorization: Bearer YOUR_TOKEN" \
//   -d '{"bookId":"123","rating":5}' \
//   -v

/**
 * Test request from disallowed origin (should fail)
 */
// curl -X GET http://localhost:5000/api/books \
//   -H "Origin: http://malicious-site.com" \
//   -v

// ============================================================================
// 2. Testing with JavaScript/Fetch (Browser Console)
// ============================================================================

/**
 * Test simple GET request
 * Open browser console on http://localhost:3000 and run:
 */
const testGet = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/books", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
    });
    const data = await response.json();
    console.log("✅ GET Request Success:", data);
  } catch (error) {
    console.error("❌ GET Request Failed:", error);
  }
};

/**
 * Test POST request with credentials
 */
const testPost = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_TOKEN",
      },
      credentials: "include",
      body: JSON.stringify({
        bookId: "507f1f77bcf86cd799439011",
        rating: 5,
        comment: "Great book!",
      }),
    });
    const data = await response.json();
    console.log("✅ POST Request Success:", data);
  } catch (error) {
    console.error("❌ POST Request Failed:", error);
  }
};

/**
 * Test from disallowed origin
 * Open browser console on a different origin (e.g., http://example.com) and run:
 */
const testDisallowedOrigin = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/books");
    console.log("This should not succeed");
  } catch (error) {
    console.error("✅ Correctly blocked by CORS:", error);
  }
};

// ============================================================================
// 3. Testing with Postman
// ============================================================================

/**
 * Steps to test with Postman:
 *
 * 1. Preflight Request Test:
 *    - Method: OPTIONS
 *    - URL: http://localhost:5000/api/books
 *    - Headers:
 *      - Origin: http://localhost:3000
 *      - Access-Control-Request-Method: POST
 *      - Access-Control-Request-Headers: Content-Type
 *
 *    Expected Response Headers:
 *      - Access-Control-Allow-Origin: http://localhost:3000
 *      - Access-Control-Allow-Credentials: true
 *      - Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
 *      - Access-Control-Allow-Headers: Content-Type,Authorization
 *
 * 2. GET Request Test:
 *    - Method: GET
 *    - URL: http://localhost:5000/api/books
 *    - Headers:
 *      - Origin: http://localhost:3000
 *
 *    Expected: Success with CORS headers in response
 *
 * 3. POST Request with Credentials:
 *    - Method: POST
 *    - URL: http://localhost:5000/api/reviews
 *    - Headers:
 *      - Origin: http://localhost:3000
 *      - Content-Type: application/json
 *      - Authorization: Bearer YOUR_TOKEN
 *    - Body (JSON):
 *      {
 *        "bookId": "507f1f77bcf86cd799439011",
 *        "rating": 5,
 *        "comment": "Test review"
 *      }
 *
 *    Expected: Success with proper CORS headers
 *
 * 4. Disallowed Origin Test:
 *    - Method: GET
 *    - URL: http://localhost:5000/api/books
 *    - Headers:
 *      - Origin: http://malicious-site.com
 *
 *    Expected: CORS error or no Access-Control-Allow-Origin header
 */

// ============================================================================
// 4. Expected CORS Response Headers
// ============================================================================

/**
 * For allowed origins, server should respond with:
 *
 * Access-Control-Allow-Origin: http://localhost:3000
 * Access-Control-Allow-Credentials: true
 * Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
 * Access-Control-Allow-Headers: Content-Type,Authorization
 * Access-Control-Expose-Headers: Content-Length,X-Request-Id
 * Access-Control-Max-Age: 86400
 */

// ============================================================================
// 5. Common CORS Issues and Solutions
// ============================================================================

/**
 * Issue 1: "No 'Access-Control-Allow-Origin' header is present"
 * Solution: Ensure origin is in allowedOrigins array
 *
 * Issue 2: "Credentials flag is 'true', but Access-Control-Allow-Credentials is not 'true'"
 * Solution: Set credentials: true in corsOptions (already configured)
 *
 * Issue 3: "Method [METHOD] is not allowed by Access-Control-Allow-Methods"
 * Solution: Add the method to methods array in corsOptions
 *
 * Issue 4: "Request header [HEADER] is not allowed by Access-Control-Allow-Headers"
 * Solution: Add the header to allowedHeaders array in corsOptions
 *
 * Issue 5: Preflight request fails
 * Solution: Ensure OPTIONS method is allowed and app.options('*', cors()) is set
 */

// ============================================================================
// 6. Production Considerations
// ============================================================================

/**
 * For production deployment:
 *
 * 1. Update allowedOrigins to include production URLs:
 *    const allowedOrigins = [
 *      process.env.CLIENT_URL,
 *      'https://yourdomain.com',
 *      'https://www.yourdomain.com',
 *    ];
 *
 * 2. Remove localhost URLs from production:
 *    if (process.env.NODE_ENV !== 'production') {
 *      allowedOrigins.push('http://localhost:3000');
 *      allowedOrigins.push('http://localhost:5173');
 *    }
 *
 * 3. Consider using environment variables:
 *    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || []
 *
 * 4. Enable CORS error logging in production for monitoring
 */

module.exports = {
  testGet,
  testPost,
  testDisallowedOrigin,
};
