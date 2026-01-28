// js/login-modal.js
import { login } from "./auth.js";

let modal, form, msg;

/**
 * Initialize modal references AFTER DOM exists
 */
function initLoginModal() {
  modal = document.getElementById("login-modal");
  form = document.getElementById("loginForm");
  msg = document.getElementById("loginModalMsg");

  if (!modal || !form || !msg) {
    // Modal not present on this page
    return;
  }

  // Handle form submit
  form.addEventListener("submit", handleLogin);
}

/**
 * Open modal
 */
function openModal() {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "false");
  modal.classList.add("open"); // safe even if CSS ignores it
  msg.hidden = true;
}

/**
 * Close modal
 */
function closeModal() {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove("open");
  form.reset();
  msg.hidden = true;
}

/**
 * Handle login submit
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    msg.hidden = false;
    msg.textContent = "Please enter email and password.";
    return;
  }

  msg.hidden = false;
  msg.textContent = "Signing in…";

  try {
    await login(email, password);
    closeModal(); // success
  } catch (err) {
    msg.textContent = "Invalid email or password.";
  }
}

/**
 * Global click handlers
 */
document.addEventListener("click", (e) => {
  // Open modal
  if (e.target.closest(".login-trigger")) {
    openModal();
    return;
  }

  // Close modal
  if (e.target.hasAttribute("data-close-login")) {
    closeModal();
  }
});

/**
 * Init once modal HTML is loaded
 */
initLoginModal();
