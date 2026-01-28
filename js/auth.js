// js/auth.js
// ==================================
// Central Appwrite Auth Controller
// Phase 1–2: Logic only (NO UI / NO DOM)
// ==================================

import { account } from "./appwrite.js";

/**
 * Internal auth state
 */
let currentUser = null;
const subscribers = new Set();

/**
 * Notify all subscribers of auth state change
 */
function notify() {
  subscribers.forEach(cb => cb(currentUser));
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback) {
  subscribers.add(callback);
  callback(currentUser); // immediate sync
  return () => subscribers.delete(callback);
}

/**
 * Restore session on page load
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
 * 🔥 FIXED: Login with email + password
 * (correct method for window.Appwrite SDK)
 */
export async function login(email, password) {
  // IMPORTANT: correct API for this SDK
  await account.createSession("email", email, password);
  currentUser = await account.get();
  notify();
  return currentUser;
}

/**
 * Logout current user
 */
export async function logout() {
  await account.deleteSession("current");
  currentUser = null;
  notify();
}

/**
 * Get current user synchronously
 */
export function getCurrentUser() {
  return currentUser;
}
