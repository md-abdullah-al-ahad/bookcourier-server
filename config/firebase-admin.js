const admin = require("firebase-admin");
const path = require("path");

let firebaseAdmin = null;

/**
 * Initialize Firebase Admin SDK
 * @returns {admin.app.App} Firebase Admin instance
 */
const initializeFirebaseAdmin = () => {
  try {
    // Check if already initialized
    if (firebaseAdmin) {
      return firebaseAdmin;
    }

    // Path to service account key file
    // NOTE: Store serviceAccountKey.json in server root (already added to .gitignore)
    const serviceAccountPath = path.join(
      __dirname,
      "..",
      "serviceAccountKey.json"
    );
    const serviceAccount = require(serviceAccountPath);

    // Initialize Firebase Admin with service account
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("✅ Firebase Admin initialized successfully");
    console.log(`📦 Project ID: ${serviceAccount.project_id}`);

    return firebaseAdmin;
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error.message);

    // Provide helpful error messages
    if (error.code === "MODULE_NOT_FOUND") {
      console.error(
        "💡 Make sure serviceAccountKey.json exists in the server root directory"
      );
    }

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
