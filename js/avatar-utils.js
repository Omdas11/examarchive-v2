// Phase 9.2.8 - Fixed timing issues with ES modules
// js/avatar-utils.js
// ===============================
// SHARED AVATAR UTILITIES
// ===============================

/**
 * Wait for Supabase client to be initialized
 * @param {number} timeout - Max time to wait in ms (default 5000)
 * @returns {Promise<Object|null>} Supabase client or null on timeout
 */
async function waitForSupabaseAvatar(timeout = 5000) {
  if (window.__supabase__) {
    return window.__supabase__;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const readyHandler = () => {
      if (window.__supabase__) {
        resolve(window.__supabase__);
      }
    };
    document.addEventListener('app:ready', readyHandler, { once: true });
    
    const interval = setInterval(() => {
      if (window.__supabase__) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        resolve(window.__supabase__);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        console.warn('[AVATAR-UTILS] Timeout waiting for Supabase client');
        resolve(null);
      }
    }, 50);
  });
}

/**
 * Generate a color from a string (for letter avatars)
 */
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/**
 * Validate and sanitize avatar URL
 */
function sanitizeAvatarUrl(url) {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return url;
  } catch (e) {
    return null;
  }
}

/**
 * Update avatar element with user data
 */
function updateAvatarElement(avatarEl, user) {
  if (!avatarEl) return;

  const fullName = user?.user_metadata?.full_name;
  const email = user?.email;
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (user) {
    const initial = fullName ? fullName[0].toUpperCase() : email ? email[0].toUpperCase() : "U";
    avatarEl.setAttribute("data-initials", initial);
    
    const sanitizedUrl = sanitizeAvatarUrl(avatarUrl);
    if (sanitizedUrl) {
      avatarEl.setAttribute("data-avatar", sanitizedUrl);
      avatarEl.style.backgroundImage = `url("${sanitizedUrl}")`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
    } else {
      avatarEl.removeAttribute("data-avatar");
      avatarEl.style.backgroundImage = "none";
      avatarEl.style.backgroundColor = stringToColor(fullName || email || "User");
    }
  } else {
    avatarEl.setAttribute("data-initials", "?");
    avatarEl.removeAttribute("data-avatar");
    avatarEl.style.backgroundImage = "none";
    avatarEl.style.backgroundColor = "#888";
  }
}

/**
 * Shared logout handler
 */
async function handleLogout() {
  console.log("[avatar-utils] 🚪 Signing out...");
  const supabase = await waitForSupabaseAvatar();
  if (!supabase) {
    console.error("[avatar-utils] ❌ Cannot sign out - Supabase not ready");
    return;
  }
  await supabase.auth.signOut();
  location.reload();
}

/**
 * Shared sign-in handler
 */
async function handleSignIn() {
  console.log("[avatar-utils] 🔐 Signing in with Google...");
  const supabase = await waitForSupabaseAvatar();
  if (!supabase) {
    console.error("[avatar-utils] ❌ Cannot sign in - Supabase not ready");
    alert("Please wait for the page to fully load and try again.");
    return;
  }
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });
  
  if (error) {
    console.error("[avatar-utils] ❌ Sign in error:", error.message);
  }
}

/**
 * Shared switch account handler
 */
async function handleSwitchAccount() {
  console.log("[avatar-utils] 🔄 Switching account...");
  const supabase = await waitForSupabaseAvatar();
  if (!supabase) {
    console.error("[avatar-utils] ❌ Cannot switch account - Supabase not ready");
    return;
  }
  
  // Sign out first to ensure user can select different account
  await supabase.auth.signOut();
  
  // Then trigger OAuth flow
  await handleSignIn();
}

// Expose to window for global access
window.AvatarUtils = {
  stringToColor,
  sanitizeAvatarUrl,
  updateAvatarElement,
  handleLogout,
  handleSignIn,
  handleSwitchAccount
};
