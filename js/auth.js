// js/auth.js
// ==================================
// Central Appwrite Auth Controller
// Phase 1: Logic only (NO UI / NO DOM)
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
 * @param {(user:Object|null)=>void} callback
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
 * Login with email + password
 */
export async function login(email, password) {
  await account.createEmailPasswordSession(email, password);
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
