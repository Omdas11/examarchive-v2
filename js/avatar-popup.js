// js/avatar-popup.js
// ===============================
// AVATAR POPUP CONTROLLER
// ===============================

import { supabase } from "./supabase.js";

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
    debug("🚪 Signing out...");
    await supabase.auth.signOut();
    closeAvatarPopup();
    location.reload();
  });

  // Switch account handler
  switchBtn?.addEventListener("click", async () => {
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

  avatarPopupLoaded = true;

  // Initial update
  updateAvatarPopup();
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

    debug(`✅ Avatar popup updated: ${fullName || email || "User"}`);
  } else {
    nameEl.textContent = "Guest";
    usernameEl.textContent = "Not signed in";
    
    if (avatarEl) {
      avatarEl.setAttribute("data-initials", "?");
      avatarEl.removeAttribute("data-avatar");
      avatarEl.style.backgroundImage = "none";
      avatarEl.style.backgroundColor = "#888";
    }
    
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
