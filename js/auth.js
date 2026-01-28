// js/auth.js
// ==================================
// Appwrite Auth Controller (OAuth)
// Supports: Google, GitHub, Microsoft
// ==================================

import { account } from "./appwrite.js";

let currentUser = null;
const subscribers = new Set();

function notify() {
  subscribers.forEach(cb => cb(currentUser));
}

/**
 * Subscribe to auth changes
 */
export function onAuthChange(cb) {
  subscribers.add(cb);
  cb(currentUser);
  return () => subscribers.delete(cb);
}

/**
 * Restore session on load
 */
export async function restoreSession() {
  try {
    currentUser = await account.get();
  } catch {
    currentUser = null;
  }
  notify();
  return currentUser;
}

/**
 * 🔐 Login with OAuth provider
 * @param {"google"|"github"|"microsoft"} provider
 */
export function loginWithProvider(provider) {
  const redirect = window.location.origin;

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
  await account.deleteSession("current");
  currentUser = null;
  notify();
}

export function getCurrentUser() {
  return currentUser;
}
