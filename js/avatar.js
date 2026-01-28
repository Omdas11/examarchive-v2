// js/avatar.js
// ============================================
// Avatar + Header Auth UI Binder (FINAL)
// ============================================

import { onAuthChange, logout } from "./auth.js";

let loginBtn;
let avatarBtn;
let avatarMini;

// Init after header loads
document.addEventListener("header:loaded", () => {
  loginBtn = document.querySelector(".login-trigger");
  avatarBtn = document.querySelector(".avatar-trigger");
  avatarMini = document.querySelector(".avatar-mini");

  bindAuthUI();
});

function bindAuthUI() {
  onAuthChange(user => {
    if (user) {
      showUser(user);
    } else {
      showGuest();
    }
  });
}

function showUser(user) {
  // Toggle visibility
  loginBtn?.setAttribute("hidden", "true");
  avatarBtn?.removeAttribute("hidden");

  // Show initial
  const name = user.name || user.email || "U";
  if (avatarMini) {
    avatarMini.textContent = name.charAt(0).toUpperCase();
  }

  // Optional: color
  if (window.applyAvatarColors) {
    window.applyAvatarColors(name);
  }
}

function showGuest() {
  avatarBtn?.setAttribute("hidden", "true");
  loginBtn?.removeAttribute("hidden");

  if (avatarMini) {
    avatarMini.textContent = "?";
  }
}

// Logout (from profile panel)
document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-logout]")) {
    await logout();
    location.reload();
  }
});
