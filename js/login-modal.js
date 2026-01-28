// js/login-modal.js
import { login } from "./auth.js";

// Elements
const modal = document.getElementById("login-modal");
const form = document.getElementById("loginForm");
const msg = document.getElementById("loginModalMsg");

// Open modal
document.addEventListener("click", (e) => {
  if (e.target.closest(".login-trigger")) {
    openModal();
  }
});

// Close modal
document.addEventListener("click", (e) => {
  if (e.target.hasAttribute("data-close-login")) {
    closeModal();
  }
});

function openModal() {
  modal?.setAttribute("aria-hidden", "false");
  msg.hidden = true;
}

function closeModal() {
  modal?.setAttribute("aria-hidden", "true");
  form?.reset();
  msg.hidden = true;
}

// Handle login
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  msg.hidden = false;
  msg.textContent = "Signing in…";

  try {
    await login(email, password);
    closeModal(); // success → modal closes
  } catch (err) {
    msg.textContent = "Invalid email or password.";
  }
});
