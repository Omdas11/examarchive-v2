// ===============================
// Appwrite Client Configuration
// ===============================
const APPWRITE_ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6978b0e3000761212146";

// Determine the correct redirect URL based on hostname
const PRODUCTION_URL = "https://omdas11.github.io/examarchive-v2";
const getRedirectURL = () => {
  const hostname = window.location.hostname;
  
  // Use production URL for GitHub Pages
  if (hostname === "omdas11.github.io") {
    return PRODUCTION_URL;
  }
  
  // Use current origin for local dev and examarchive.dev
  return window.location.origin;
};

// Initialize Appwrite SDK
if (!window.Appwrite) {
  console.error("❌ Appwrite SDK not loaded. Please ensure the CDN script is loaded first.");
  throw new Error("Appwrite SDK not available");
}

const { Client, Account, Databases } = window.Appwrite;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

console.log("✅ Appwrite client initialized successfully");

// ===============================
// Authentication Methods
// ===============================

/**
 * Login with GitHub OAuth
 * @returns {Promise<void>}
 */
async function loginWithGitHub() {
  try {
    const redirectURL = getRedirectURL();
    
    // Redirect to GitHub OAuth
    account.createOAuth2Session(
      'github',
      redirectURL + '/', // Success redirect
      redirectURL + '/login.html' // Failure redirect
    );
  } catch (error) {
    console.error("GitHub login error:", error);
    throw error;
  }
}

/**
 * Logout current user
 * @returns {Promise<void>}
 */
async function logout() {
  setAuthCache(null, {});
  applyAuthState(null, {});
  try {
    await account.deleteSession('current');
    console.log("✅ User logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    // User not authenticated
    return null;
  }
}

/**
 * Get user preferences
 * @returns {Promise<Object>}
 */
async function getUserPrefs() {
  try {
    const prefs = await account.getPrefs();
    return prefs || {};
  } catch (error) {
    console.error("Error getting user prefs:", error);
    return {};
  }
}

/**
 * Update user preferences
 * @param {Object} prefs - Preferences object to update
 * @returns {Promise<Object>}
 */
async function updateUserPrefs(prefs) {
  try {
    const updated = await account.updatePrefs(prefs);
    return updated;
  } catch (error) {
    console.error("Error updating user prefs:", error);
    throw error;
  }
}

// ===============================
// Helper Functions
// ===============================

/**
 * Generate initials from name or email
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {string} Initials (e.g., "OD" or "O")
 */
function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  
  if (email) {
    return email[0].toUpperCase();
  }
  
  return "?";
}

/**
 * Generate stable color from user ID
 * @param {string} userId - User's unique ID
 * @returns {Object} Color palette object
 */
function getAvatarColor(userId) {
  const palettes = [
    { bg: "#ecfeff", text: "#155e75", ring: "#16a34a" }, // cyan
    { bg: "#fef3c7", text: "#92400e", ring: "#f59e0b" }, // amber
    { bg: "#ede9fe", text: "#4c1d95", ring: "#8b5cf6" }, // violet
    { bg: "#dcfce7", text: "#14532d", ring: "#22c55e" }, // green
    { bg: "#ffe4e6", text: "#9f1239", ring: "#fb7185" }, // rose
    { bg: "#e0f2fe", text: "#075985", ring: "#38bdf8" }  // sky
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palettes[Math.abs(hash) % palettes.length];
}

/**
 * Update avatar display with user info
 * @param {Object} user - User object from Appwrite
 * @param {Object} prefs - User preferences
 */
function setAvatar(user, prefs = {}) {
  const initials = getInitials(user.name, user.email);
  const customAvatar = prefs.avatarUrl;
  const appwriteAvatar = null; // Appwrite doesn't provide direct avatar URL from account
  const avatarUrl = customAvatar || appwriteAvatar;
  const colorPalette = getAvatarColor(user.$id);

  // Apply CSS variables for avatar colors
  document.documentElement.style.setProperty("--avatar-bg", colorPalette.bg);
  document.documentElement.style.setProperty("--avatar-text", colorPalette.text);
  document.documentElement.style.setProperty("--avatar-ring", colorPalette.ring);

  // Update header avatar (mini)
  const avatarMini = document.querySelector(".avatar-mini");
  if (avatarMini) {
    if (avatarUrl) {
      avatarMini.innerHTML = `<img src="${avatarUrl}" alt="${user.name || 'User'}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      avatarMini.textContent = initials;
    }
  }

  // Update avatar popup circle
  const avatarCircle = document.querySelector(".avatar-circle");
  if (avatarCircle) {
    avatarCircle.setAttribute("data-initials", initials);
    avatarCircle.setAttribute("data-avatar", avatarUrl || "");
    if (avatarUrl) {
      avatarCircle.style.backgroundImage = `url(${avatarUrl})`;
      avatarCircle.style.backgroundSize = "cover";
      avatarCircle.style.backgroundPosition = "center";
    }
  }

  // Update profile panel avatar
  const avatarLarge = document.querySelector(".profile-avatar");
  if (avatarLarge) {
    avatarLarge.setAttribute("data-initials", initials);
    avatarLarge.setAttribute("data-avatar", avatarUrl || "");
    if (avatarUrl) {
      avatarLarge.style.backgroundImage = `url(${avatarUrl})`;
      avatarLarge.style.backgroundSize = "cover";
      avatarLarge.style.backgroundPosition = "center";
    }
  }

  // Update text fields
  const displayName = user.name || user.email;
  document.querySelectorAll('[data-field="name"]').forEach(el => {
    el.textContent = displayName;
  });

  document.querySelectorAll('[data-field="username"]').forEach(el => {
    el.textContent = user.email;
  });
}

/**
 * Apply authentication state to UI
 * @param {Object|null} user - Current user or null
 * @param {Object} prefs - User preferences
 */
function applyAuthState(user, prefs = {}) {
  const isLoggedIn = !!user;

  document.body.classList.toggle("logged-in", isLoggedIn);

  // Show/hide elements based on auth state
  document.querySelectorAll("[data-auth-only]").forEach(el => {
    const wants = el.getAttribute("data-auth-only");
    el.hidden = !(
      (wants === "user" && isLoggedIn) ||
      (wants === "guest" && !isLoggedIn)
    );
  });

  if (isLoggedIn) {
    setAvatar(user, prefs);
  }
}

// ===============================
// Initialization
// ===============================
const AUTH_INIT_TIMEOUT_MS = 2000;
const OAUTH_SESSION_RETRY_DELAY_MS = 250;
const OAUTH_SESSION_MAX_ATTEMPTS = 3;
const OAUTH_PARAM_KEYS = ["userId", "secret", "provider", "oauth", "code", "state", "error"];
let headerLoaded = false;
let profilePanelLoaded = false;
let authInitialized = false;
let authReady = false;
let cachedUser = null;
let cachedPrefs = {};
let oauthReturnHandled = false;

function setAuthCache(user, prefs = {}) {
  cachedUser = user;
  cachedPrefs = prefs;
}

function closeLoginModal() {
  const loginModal = document.getElementById("login-modal");
  if (loginModal) {
    loginModal.setAttribute("aria-hidden", "true");
  }
}

function hasOAuthReturnParams() {
  const params = new URLSearchParams(window.location.search);
  return OAUTH_PARAM_KEYS.some(key => params.has(key));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSessionReady() {
  for (let attempt = 0; attempt < OAUTH_SESSION_MAX_ATTEMPTS; attempt++) {
    try {
      const session = await account.getSession("current");
      if (session) return session;
    } catch (error) {
      // Session not ready yet
    }

    if (attempt < OAUTH_SESSION_MAX_ATTEMPTS - 1) {
      await delay(OAUTH_SESSION_RETRY_DELAY_MS);
    }
  }

  return null;
}

function markAuthReady() {
  if (authReady) return;
  authReady = true;
  document.dispatchEvent(new CustomEvent("auth:ready"));
}

function waitForAuthReady() {
  if (authReady) return Promise.resolve();
  return new Promise(resolve => {
    document.addEventListener("auth:ready", resolve, { once: true });
  });
}

async function initAuthState() {
  try {
    if (hasOAuthReturnParams()) {
      await waitForSessionReady();
    }

    const user = await getCurrentUser();
    const prefs = user ? await getUserPrefs() : {};
    setAuthCache(user, prefs);
    applyAuthState(user, prefs);
    
    // Close login modal if user just logged in
    if (user) {
      closeLoginModal();
    }
  } catch (error) {
    console.error("Auth init error:", error);
    setAuthCache(null, {});
    applyAuthState(null, {});
  } finally {
    markAuthReady();
  }
}

/**
 * Refresh auth state without page reload
 * @returns {Promise<void>}
 */
async function refreshAuthState() {
  try {
    const user = await getCurrentUser();
    const prefs = user ? await getUserPrefs() : {};
    setAuthCache(user, prefs);
    applyAuthState(user, prefs);
  } catch (error) {
    console.error("Auth refresh error:", error);
    setAuthCache(null, {});
    applyAuthState(null, {});
  }
}

async function handleOAuthRedirect() {
  if (oauthReturnHandled || !hasOAuthReturnParams()) return;
  oauthReturnHandled = true;

  const session = await waitForSessionReady();
  if (!session) return;

  await waitForAuthReady();
  await refreshAuthState();
  closeLoginModal();
}

// Check if profile panel portal exists on this page
const hasProfilePanel = !!document.getElementById("profile-panel-portal");

function tryInitAuth() {
  if (authInitialized) return;
  
  const canInit = headerLoaded && (!hasProfilePanel || profilePanelLoaded);
  if (canInit) {
    authInitialized = true;
    initAuthState();
  }
}

document.addEventListener("header:loaded", () => {
  headerLoaded = true;
  tryInitAuth();
});

document.addEventListener("profile-panel:loaded", () => {
  profilePanelLoaded = true;
  tryInitAuth();
});

// Fallback: if partials don't load within timeout, init anyway
setTimeout(() => {
  if (!authInitialized) {
    console.warn("Auth init fallback triggered after", AUTH_INIT_TIMEOUT_MS, "ms");
    authInitialized = true;
    initAuthState();
  }
}, AUTH_INIT_TIMEOUT_MS);

if (hasOAuthReturnParams()) {
  handleOAuthRedirect();
}

// Export for use in other scripts
window.AppwriteAuth = {
  loginWithGitHub,
  logout,
  getCurrentUser,
  getUserPrefs,
  updateUserPrefs,
  applyAuthState,
  refreshAuthState,
  getInitials,
  getAvatarColor
};
