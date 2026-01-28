// js/login-modal.js
import { loginWithProvider } from "./auth.js";

function initLoginModal() {
  const modal = document.getElementById("login-modal");
  if (!modal) {
    alert("❌ login-modal NOT found");
    return;
  }

  alert("✅ login-modal FOUND");

  document.addEventListener("click", (e) => {
    if (e.target.closest(".login-trigger")) {
      modal.setAttribute("aria-hidden", "false");
    }

    if (e.target.hasAttribute("data-close-login")) {
      modal.setAttribute("aria-hidden", "true");
    }

    if (e.target.closest("[data-provider='google']")) {
      loginWithProvider("google");
    }
  });
}

// 🚨 WAIT for modal HTML
document.addEventListener("login-modal:loaded", () => {
  alert("📦 login-modal:loaded event");
  initLoginModal();
});
