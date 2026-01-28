// js/auth.js
import { client, account } from "./appwrite.js";

/**
 * Global auth state
 */
let currentUser = null;
const listeners = new Set();

/**
 * Notify subscribers when auth state changes
 */
function notify() {
  listeners.forEach(cb => cb(currentUser));
}

/**
 * Subscribe to auth changes
 */
export function onAuthChange(callback) {
  listeners.add(callback);
  callback(currentUser); // immediate sync
  return () => listeners.delete(callback);
}

/**
 * Restore session on page load
 */
export async function restoreSession() {
  try {
    currentUser = await account.get();
    notify();
    return currentUser;
  } catch (err) {
    currentUser = null;
    notify();
    return null;
  }
}

/**
 * Login
 */
export async function login(email, password) {
  await account.createEmailPasswordSession(email, password);
  currentUser = await account.get();
  notify();
  return currentUser;
}

/**
 * Logout
 */
export async function logout() {
  await account.deleteSession("current");
  currentUser = null;
  notify();
}

/**
 * Get current user (sync)
 */
export function getCurrentUser() {
  return currentUser;
}
