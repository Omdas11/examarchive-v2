// js/appwrite.js
// ===============================
// Appwrite SDK Configuration ONLY
// ===============================

// ⚠️ This file MUST NOT contain auth logic or UI logic

const APPWRITE_ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6978b0e3000761212146";

// Ensure Appwrite SDK is loaded
if (!window.Appwrite) {
  throw new Error("❌ Appwrite SDK not loaded. Include Appwrite CDN before this file.");
}

const { Client, Account, Databases } = window.Appwrite;

// Initialize client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Core services
const account = new Account(client);
const databases = new Databases(client);

// 🔒 Export ONLY low-level SDK objects
export { client, account, databases };
