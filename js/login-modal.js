// js/login-modal.js
// ===================================
// Login Modal Controller (Google only)
// MOBILE SAFE – no race conditions
// ===================================

import { account } from "./appwrite.js";

alert("✅ login-modal.js loaded");

// Wait until modal HTML actually exists
function waitForModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector("[data-provider='google']");
  const closeBtn = document.querySelector(".modal-close");

  if (!modal || !googleBtn) {
    setTimeout(waitForModal, 200);
    return;
  }

  alert("🔥 Login modal DOM found");

  // Open modal
  loginBtn?.addEventListener("click", () => {
    alert("🟢 Login button clicked");
    modal.classList.add("open");
  });

  // Close modal
  closeBtn?.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  // GOOGLE LOGIN
  googleBtn.addEventListener("click", () => {
    alert("🚀 Google OAuth CLICKED");

    const redirect = window.location.origin;

    account.createOAuth2Session(
      "google",
      redirect,
      redirect
    );
  });
}

waitForModal();
