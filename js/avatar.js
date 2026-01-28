// js/avatar.js
// ============================================
// Avatar + Header Auth State Controller
// ============================================

import {
  onAuthChange,
  logout
} from "./auth.js";

// Elements
let loginBtn;
let avatarBtn;
let avatarInitial;
let avatarName;

// ===============================
// Init AFTER header is loaded
// ===============================
document.addEventListener("header:loaded", () => {
  loginBtn = document.querySelector(".login-trigger");
  avatarBtn = document.querySelector(".avatar-trigger");
  avatarInitial = document.querySelector(".avatar-initial");
  avatarName = document.querySelector(".avatar-name");

  bindAuth();
});

// ===============================
// Bind auth state to UI
// ===============================
function bindAuth() {
  onAuthChange(user => {
    if (user) {
      showUser(user);
    } else {
      showGuest();
    }
  });
}

// ===============================
// Show logged-in user
// ===============================
function showUser(user) {
  loginBtn?.classList.add("hidden");
  avatarBtn?.classList.remove("hidden");

  const name =
    user.name ||
    user.email?.split("@")[0] ||
    "User";

  if (avatarInitial) {
    avatarInitial.textContent = name.charAt(0).toUpperCase();
  }

  if (avatarName) {
    avatarName.textContent = name;
  }

  // Deterministic avatar color
  if (window.applyAvatarColors) {
    window.applyAvatarColors(name);
  }
}

// ===============================
// Show guest state
// ===============================
function showGuest() {
  avatarBtn?.classList.add("hidden");
  loginBtn?.classList.remove("hidden");
}

// ===============================
// Logout handler (profile panel)
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-logout]")) {
    await logout();
    location.reload();
  }
});
