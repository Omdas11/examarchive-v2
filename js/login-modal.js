// js/login-modal.js
import { loginWithProvider } from "./auth.js";

let modal, msg;

function init() {
  modal = document.getElementById("login-modal");
  msg = document.getElementById("loginModalMsg");
  if (!modal) return;
}

function openModal() {
  modal.setAttribute("aria-hidden", "false");
  msg && (msg.hidden = true);
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  msg && (msg.hidden = true);
}

// Global click handling
document.addEventListener("click", (e) => {
  // Open
  if (e.target.closest(".login-trigger")) {
    openModal();
    return;
  }

  // Provider buttons
  const btn = e.target.closest("[data-provider]");
  if (btn) {
    const provider = btn.getAttribute("data-provider");
    loginWithProvider(provider);
    return;
  }

  // Close
  if (e.target.hasAttribute("data-close-login")) {
    closeModal();
  }
});

// Init after modal HTML exists
init();
