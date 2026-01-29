// js/avatar-popup.js
// ===============================
// AVATAR POPUP CONTROLLER
// ===============================

import { supabase } from "./supabase.js";
import { updateAvatarElement, handleLogout, handleSwitchAccount } from "./avatar-utils.js";

function debug(msg) {
  console.log("[avatar-popup]", msg);
}

let avatarPopupLoaded = false;
let headerLoaded = false;

/* ===============================
   Initialize avatar popup
   =============================== */
function initializeAvatarPopup() {
  // Wait for both avatar popup and header to be ready
  if (avatarPopupLoaded || !headerLoaded) return;

  const popup = document.getElementById("avatar-popup");
  const logoutBtn = document.getElementById("avatarLogoutBtn");
  const switchBtn = document.getElementById("avatarSwitchBtn");
  const avatarTrigger = document.querySelector(".avatar-trigger");

  if (!popup) {
    debug("❌ avatar popup NOT found");
    return;
  }

  debug("✅ avatar popup DOM ready");

  // Toggle avatar popup on avatar button click
  avatarTrigger?.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event bubbling
    popup.classList.toggle("open");
    updateAvatarPopup();
    debug("🔄 Avatar popup toggled");
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !avatarTrigger?.contains(e.target)) {
      closeAvatarPopup();
    }
  });

  // Logout handler
  logoutBtn?.addEventListener("click", async () => {
    closeAvatarPopup();
    await handleLogout();
  });

  // Switch account handler
  switchBtn?.addEventListener("click", async () => {
    closeAvatarPopup();
    await handleSwitchAccount();
  });

  avatarPopupLoaded = true;

  // Initial update
  updateAvatarPopup();
}

/* ===============================
   Update avatar popup with user data
   =============================== */
async function updateAvatarPopup() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

  const nameEl = document.querySelector("#avatar-popup .display-name");
  const usernameEl = document.querySelector("#avatar-popup .username");
  const avatarEl = document.getElementById("avatarPopupCircle");

  if (!nameEl || !usernameEl) {
    return;
  }

  if (user) {
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

    debug(`✅ Avatar popup updated: ${fullName || email || "User"}`);
  } else {
    nameEl.textContent = "Guest";
    usernameEl.textContent = "Not signed in";
    
    // Update avatar for guest
    updateAvatarElement(avatarEl, null);
    
    debug("ℹ️ Avatar popup showing guest state");
  }
}

/* ===============================
   Close avatar popup
   =============================== */
function closeAvatarPopup() {
  const popup = document.getElementById("avatar-popup");
  popup?.classList.remove("open");
}

/* ===============================
   Listen for avatar loaded
   =============================== */
document.addEventListener("avatar:loaded", () => {
  debug("✅ avatar loaded event received");
  initializeAvatarPopup();
});

/* ===============================
   Listen for header loaded
   =============================== */
document.addEventListener("header:loaded", () => {
  debug("✅ header loaded event received");
  headerLoaded = true;
  initializeAvatarPopup();
});

/* ===============================
   Listen for auth changes
   =============================== */
supabase.auth.onAuthStateChange(() => {
  debug("🔔 Auth state changed, updating avatar popup");
  updateAvatarPopup();
});

/* ===============================
   Handle "View Profile" button
   =============================== */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-open-profile]")) {
    debug("👉 Opening profile panel from avatar popup");
    closeAvatarPopup();
    const panel = document.querySelector(".profile-panel");
    panel?.classList.add("open");
  }
});

/* ===============================
   Handle "Sign in with Google" button
   =============================== */
document.addEventListener("click", async (e) => {
  const signInBtn = e.target.closest("#avatar-popup [data-open-login]");
  if (signInBtn) {
    debug("👉 Sign in with Google clicked from avatar popup");
    closeAvatarPopup();
    
    // Directly trigger Google OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      debug("❌ OAuth error: " + error.message);
      console.error("[avatar-popup] OAuth error:", error);
    }
  }
});

