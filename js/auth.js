// js/auth.js
// ==================================
// Appwrite Auth Controller (OAuth)
// FINAL – Session-safe, UI-safe
// Supports: Google, GitHub, Microsoft
// ==================================

import { account } from "./appwrite.js";

let currentUser = null;
const subscribers = new Set();

/* -----------------------------
   Internal helpers
------------------------------ */
function notify() {
  subscribers.forEach(cb => cb(currentUser));
}

async function fetchUser() {
  try {
    currentUser = await account.get();
  } catch {
    currentUser = null;
  }
  notify();
  return currentUser;
}

/* -----------------------------
   Public API
------------------------------ */

/**
 * Subscribe to auth changes
 */
export function onAuthChange(callback) {
  subscribers.add(callback);
  callback(currentUser);
  return () => subscribers.delete(callback);
}

/**
 * Restore session (OAuth redirect safe)
 */
export async function restoreSession() {
  return await fetchUser();
}

/**
 * OAuth login
 * @param {"google"|"github"|"microsoft"} provider
 */
export function loginWithProvider(provider) {
  const redirect = window.location.origin + window.location.pathname;

  account.createOAuth2Session(
    provider,
    redirect, // success
    redirect  // failure
  );
}

/**
 * Logout
 */
export async function logout() {
  try {
    await account.deleteSession("current");
  } catch {}
  currentUser = null;
  notify();
}

/**
 * Get current user synchronously
 */
export function getCurrentUser() {
  return currentUser;
}

/* -----------------------------
   🔥 AUTO-RUN ON LOAD
------------------------------ */

// Restore session immediately after OAuth redirect
fetchUser();

// Expose global bridge for non-module scripts
window.AppwriteAuth = {
  loginWithProvider,
  logout,
  restoreSession,
  getCurrentUser,
  onAuthChange
};
