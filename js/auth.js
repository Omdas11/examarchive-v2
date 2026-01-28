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
 * 🔥 MUST be called after OAuth redirect
 */
export async function restoreSession() {
  try {
    currentUser = await account.get();
  } catch (err) {
    currentUser = null;
  }
  notify();
  return currentUser;
}

/**
 * 🔐 Login with OAuth provider
 */
export function loginWithProvider(provider) {
  const redirect = window.location.origin;

  // IMPORTANT: do not await — this redirects immediately
  account.createOAuth2Session(
    provider,
    redirect,
    redirect
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
 * Sync getter
 */
export function getCurrentUser() {
  return currentUser;
}
