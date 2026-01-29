// js/profile-panel.js
// ===============================
// PROFILE PANEL CONTROLLER (FIXED)
// ===============================

import { supabase } from "./supabase.js";

function debug(msg) {
  console.log("[profile-panel]", msg);
}

/* ===============================
   State tracking for both events
   =============================== */
let headerLoaded = false;
let profilePanelLoaded = false;
let clickHandlerAttached = false;

/* ===============================
   Initialize profile panel
   =============================== */
function initializeProfilePanel() {
  // Only run once both are ready
  if (!headerLoaded || !profilePanelLoaded || clickHandlerAttached) {
    return;
  }

  const panel = document.querySelector(".profile-panel");
  const backdrop = document.querySelector(".profile-panel-backdrop");
  const closeBtn = document.querySelector(".profile-panel-close");
  const logoutBtn = document.getElementById("profileLogoutBtn");
  const switchAccountBtn = document.getElementById("profileSwitchAccountBtn");

  if (!panel) {
    debug("❌ profile panel NOT found");
    return;
  }

  debug("✅ profile panel DOM ready, attaching handlers");

  function openPanel() {
    panel.classList.add("open");
    updateProfilePanel(); // Update user info when opening
    debug("🟢 profile panel opened");
  }

  function closePanel() {
    panel.classList.remove("open");
    debug("🔴 profile panel closed");
  }

  backdrop?.addEventListener("click", closePanel);
  closeBtn?.addEventListener("click", closePanel);

  // Close on any [data-close-profile] element
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-profile]")) {
      closePanel();
    }
  });

  // Logout handler
  logoutBtn?.addEventListener("click", async () => {
    debug("🚪 Signing out...");
    await supabase.auth.signOut();
    closePanel();
    location.reload();
  });

  // Switch account handler
  switchAccountBtn?.addEventListener("click", async () => {
    debug("🔄 Switching account...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      debug("❌ Switch account error: " + error.message);
    }
  });

  clickHandlerAttached = true;
  debug("✅ profile panel handlers attached");

  // Initial update
  updateProfilePanel();
}

/* ===============================
   Helper: Generate color from string
   =============================== */
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/* ===============================
   Update profile panel with user data
   =============================== */
async function updateProfilePanel() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

  const nameEl = document.querySelector(".profile-panel .profile-name");
  const usernameEl = document.querySelector(".profile-panel .profile-username");
  const avatarEl = document.getElementById("profileAvatar");

  if (!nameEl || !usernameEl) {
    return;
  }

  if (user) {
    // Priority: full_name from Gmail metadata, then email, then fallback
    const fullName = user.user_metadata?.full_name;
    const email = user.email;
    const avatarUrl = user.user_metadata?.avatar_url;

    if (fullName) {
      nameEl.textContent = fullName;
      usernameEl.textContent = email;
    } else if (email) {
      nameEl.textContent = email;
      usernameEl.textContent = "Signed in";
    } else {
      nameEl.textContent = "User";
      usernameEl.textContent = "Signed in";
    }

    // Update avatar
    if (avatarEl) {
      const initial = fullName ? fullName[0].toUpperCase() : email ? email[0].toUpperCase() : "U";
      avatarEl.setAttribute("data-initials", initial);
      
      if (avatarUrl) {
        avatarEl.setAttribute("data-avatar", avatarUrl);
        avatarEl.style.backgroundImage = `url(${avatarUrl})`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
      } else {
        avatarEl.removeAttribute("data-avatar");
        avatarEl.style.backgroundImage = "none";
        avatarEl.style.backgroundColor = stringToColor(fullName || email || "User");
      }
    }

    debug(`✅ Profile updated: ${fullName || email || "User"}`);
  } else {
    nameEl.textContent = "Guest";
    usernameEl.textContent = "Not signed in";
    
    if (avatarEl) {
      avatarEl.setAttribute("data-initials", "?");
      avatarEl.removeAttribute("data-avatar");
      avatarEl.style.backgroundImage = "none";
      avatarEl.style.backgroundColor = "#888";
    }
    
    debug("ℹ️ Profile showing guest state");
  }
}

/* ===============================
   Listen for header loaded
   =============================== */
document.addEventListener("header:loaded", () => {
  debug("✅ header loaded");
  headerLoaded = true;
  initializeProfilePanel();
});

/* ===============================
   Listen for profile panel loaded
   =============================== */
document.addEventListener("profile-panel:loaded", () => {
  debug("✅ profile panel loaded");
  profilePanelLoaded = true;
  initializeProfilePanel();
});

/* ===============================
   Listen for auth changes
   =============================== */
supabase.auth.onAuthStateChange(() => {
  debug("🔔 Auth state changed, updating profile panel");
  updateProfilePanel();
});

/* ===============================
   Handle login button in header
   =============================== */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-open-profile]")) {
    debug("👉 Opening profile panel from header");
    const panel = document.querySelector(".profile-panel");
    panel?.classList.add("open");
    updateProfilePanel();
  }
});
