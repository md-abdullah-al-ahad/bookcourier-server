const admin = require("firebase-admin");
const path = require("path");
const logger = require("../utils/logger");

let firebaseAdmin = null;

/**
 * Initialize Firebase Admin SDK
 * Supports both environment variable and file-based service account
 * @returns {admin.app.App} Firebase Admin instance
 */
const initializeFirebaseAdmin = () => {
  try {
    // Check if already initialized
    if (firebaseAdmin) {
      return firebaseAdmin;
    }

    let serviceAccount;

    // Try to get service account from environment variable (Vercel deployment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        logger.info("Using Firebase service account from environment variable");
      } catch (parseError) {
        logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", parseError);
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON format");
      }
    }
    // Try to get service account from base64 encoded environment variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const decoded = Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
          "base64"
        ).toString("utf-8");
        serviceAccount = JSON.parse(decoded);
        logger.info(
          "Using Firebase service account from base64 environment variable"
        );
      } catch (parseError) {
        logger.error(
          "Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:",
          parseError
        );
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 format");
      }
    }
    // Fall back to file (local development)
    else {
      try {
        const serviceAccountPath = path.join(
          __dirname,
          "..",
          "serviceAccountKey.json"
        );
        serviceAccount = require(serviceAccountPath);
        logger.info("Using Firebase service account from file");
      } catch (fileError) {
        logger.error("Firebase service account not found");
        throw new Error(
          "Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT environment variable or add serviceAccountKey.json file."
        );
      }
    }

    // Initialize Firebase Admin with service account
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    logger.success("Firebase Admin initialized successfully");
    logger.info(`Project ID: ${serviceAccount.project_id}`);

    return firebaseAdmin;
  } catch (error) {
    logger.error("Firebase Admin initialization error:", error);
    throw error;
  }
};

/**
 * Get Firebase Admin instance
 * @returns {admin.app.App} Firebase Admin instance
 */
const getFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
};

/**
 * Get Firebase Auth instance
 * @returns {admin.auth.Auth} Firebase Auth instance
 */
const getAuth = () => {
  return getFirebaseAdmin().auth();
};

module.exports = {
  initializeFirebaseAdmin,
  getFirebaseAdmin,
  getAuth,
  admin,
};
