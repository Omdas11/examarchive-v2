// js/login-modal.js
// ===================================
// Login Modal Controller (DEBUG v2)
// ===================================

import { account } from "./appwrite.js";

alert("✅ login-modal.js loaded");

function waitForModal() {
  const portal = document.getElementById("login-modal-portal");

  if (!portal) {
    alert("❌ login-modal-portal NOT found");
    return;
  }

  if (portal.innerHTML.trim() === "") {
    alert("⏳ login-modal-portal EMPTY, waiting...");
    return setTimeout(waitForModal, 300);
  }

  alert("🔥 login-modal HTML injected");

  const modal = portal.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = portal.querySelector('[data-provider="google"]');

  if (!modal) {
    alert("❌ .login-modal NOT found inside portal");
    return;
  }

  if (!googleBtn) {
    alert("❌ Google button NOT found");
    return;
  }

  alert("✅ Modal + Google button FOUND");

  loginBtn?.addEventListener("click", () => {
    alert("🟢 LOGIN CLICKED");
    modal.classList.add("open");
  });

  googleBtn.addEventListener("click", () => {
    alert("🚀 GOOGLE CLICKED");
    account.createOAuth2Session(
      "google",
      window.location.origin,
      window.location.origin
    );
  });
}

waitForModal();
