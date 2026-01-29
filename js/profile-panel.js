// js/profile-panel.js
// ===============================
// PROFILE PANEL CONTROLLER (FIXED)
// ===============================

import { supabase } from "./supabase.js";
import { updateAvatarElement, handleLogout, handleSwitchAccount } from "./avatar-utils.js";

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
  const switchAccountModal = document.getElementById("switch-account-modal");
  const confirmSwitchBtn = document.getElementById("confirmSwitchAccountBtn");

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

  function openSwitchAccountModal() {
    if (!switchAccountModal) return;
    
    // Update current account email
    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      const emailEl = document.getElementById("currentAccountEmail");
      if (emailEl && user) {
        emailEl.textContent = user.email;
      }
    }).catch(err => {
      debug("❌ Error getting session for switch account: " + err.message);
    });
    
    switchAccountModal.classList.add("open");
    switchAccountModal.setAttribute("aria-hidden", "false");
    debug("🟢 switch account modal opened");
  }

  function closeSwitchAccountModal() {
    if (!switchAccountModal) return;
    switchAccountModal.classList.remove("open");
    switchAccountModal.setAttribute("aria-hidden", "true");
    debug("🔴 switch account modal closed");
  }

  backdrop?.addEventListener("click", closePanel);
  closeBtn?.addEventListener("click", closePanel);

  // Handle [data-open-profile] elements to open profile panel
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-profile]")) {
      openPanel();
    }
  });

  // Close on any [data-close-profile] element
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-profile]")) {
      closePanel();
    }
  });

  // Logout handler
  logoutBtn?.addEventListener("click", async () => {
    closePanel();
    await handleLogout();
  });

  // Switch account handler - open confirmation modal
  switchAccountBtn?.addEventListener("click", () => {
    closePanel();
    openSwitchAccountModal();
  });

  // Confirm switch account - actually trigger OAuth
  confirmSwitchBtn?.addEventListener("click", async () => {
    closeSwitchAccountModal();
    await handleSwitchAccount();
  });

  // Close switch account modal
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-switch]")) {
      closeSwitchAccountModal();
    }
  });

  // Handle Sign in with Google from profile panel (guest mode)
  document.addEventListener("click", async (e) => {
    const signInBtn = e.target.closest(".profile-panel [data-open-login]");
    if (signInBtn) {
      debug("👉 Sign in with Google clicked from profile panel");
      closePanel();
      
      // Directly trigger Google OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        debug("❌ OAuth error: " + error.message);
        console.error("[profile-panel] OAuth error:", error);
      }
    }
  });

  clickHandlerAttached = true;
  debug("✅ profile panel handlers attached");

  // Initial update
  updateProfilePanel();
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

    // Update avatar using shared utility
    updateAvatarElement(avatarEl, user);

    debug(`✅ Profile updated: ${fullName || email || "User"}`);
  } else {
    nameEl.textContent = "Guest";
    usernameEl.textContent = "Not signed in";
    
    // Update avatar for guest
    updateAvatarElement(avatarEl, null);
    
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
