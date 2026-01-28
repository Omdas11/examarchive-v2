// js/appwrite.js
// ============================================
// Appwrite SDK Bootstrap (SINGLE SOURCE)
// ============================================

// Ensure Appwrite SDK is available
if (!window.Appwrite) {
  throw new Error("Appwrite SDK not loaded. Check CDN script order.");
}

const {
  Client,
  Account,
  Databases
} = window.Appwrite;

// ===============================
// Appwrite Config
// ===============================
const APPWRITE_ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6978b0e3000761212146";

// ===============================
// Client init (singleton)
// ===============================
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// ===============================
// Services
// ===============================
const account = new Account(client);
const databases = new Databases(client);

// ===============================
// Expose for debugging (safe)
// ===============================
window.__appwrite = {
  client,
  account
};

// ===============================
// Module exports
// ===============================
export {
  client,
  account,
  databases
};
