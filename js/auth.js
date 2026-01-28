// js/auth.js
// ==================================
// Appwrite Auth Controller (OAuth)
// FINAL – Session-safe, UI-safe
// Supports: Google, GitHub, Microsoft
// ==================================
alert("AUTH.JS LOADED FROM PR13");

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

// ===============================
// 🔥 DIRECT DOM SYNC (NO BRIDGES)
// ===============================
function syncAuthToDOM(user) {
  document.querySelectorAll("[data-auth-only]").forEach(el => {
    const mode = el.getAttribute("data-auth-only");
    el.hidden = mode === "user" ? !user : !!user;
  });

  const avatarMini = document.querySelector(".avatar-mini");
  if (avatarMini && user) {
    const name = user.name || user.email || "U";
    avatarMini.textContent = name[0].toUpperCase();
  }
}

// Force sync AFTER session restore
onAuthChange(user => {
  syncAuthToDOM(user);
});

// Re-sync when partials load (in case auth resolved before DOM existed)
document.addEventListener("header:loaded", () => {
  syncAuthToDOM(currentUser);
});

document.addEventListener("avatar:loaded", () => {
  syncAuthToDOM(currentUser);
});

document.addEventListener("profile-panel:loaded", () => {
  syncAuthToDOM(currentUser);
});
