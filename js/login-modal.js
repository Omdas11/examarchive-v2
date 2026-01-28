// js/login-modal.js
// ===============================
// Login Modal Controller (Google only)
// ===============================

import { account } from "./appwrite.js";

document.addEventListener("login-modal:loaded", () => {
  alert("✅ Login modal JS initialized");

  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const closeBtn = modal?.querySelector(".modal-close");
  const googleBtn = modal?.querySelector("[data-provider='google']");

  if (!modal || !googleBtn) {
    alert("❌ Login modal or Google button NOT found");
    return;
  }

  // Open modal
  loginBtn?.addEventListener("click", () => {
    modal.classList.add("open");
  });

  // Close modal
  closeBtn?.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  // 🔐 GOOGLE LOGIN
  googleBtn.addEventListener("click", () => {
    alert("🔥 Google OAuth triggered");

    const redirect = window.location.origin;

    account.createOAuth2Session(
      "google",
      redirect, // success
      redirect  // failure
    );
  });
});
