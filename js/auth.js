// js/auth.js
// ==================================
// Appwrite Auth Controller (GLOBAL)
// Google OAuth only (for now)
// ==================================

import { account } from "./appwrite.js";

let currentUser = null;
const subscribers = new Set();

function notify() {
  subscribers.forEach(cb => cb(currentUser));
}

// -------------------------------
// Public API
// -------------------------------
async function restoreSession() {
  try {
    currentUser = await account.get();
  } catch {
    currentUser = null;
  }
  notify();
  return currentUser;
}

function onAuthChange(cb) {
  subscribers.add(cb);
  cb(currentUser);
  return () => subscribers.delete(cb);
}

function loginWithGoogle() {
  const redirect = window.location.origin;
  account.createOAuth2Session(
    "google",
    redirect,
    redirect
  );
}

async function logout() {
  await account.deleteSession("current");
  currentUser = null;
  notify();
}

function getCurrentUser() {
  return currentUser;
}

// -------------------------------
// 🔥 EXPOSE GLOBALLY (THIS WAS MISSING)
// -------------------------------
window.AppwriteAuth = {
  restoreSession,
  onAuthChange,
  loginWithGoogle,
  logout,
  getCurrentUser
};

// -------------------------------
// Auto-restore immediately
// -------------------------------
restoreSession();
