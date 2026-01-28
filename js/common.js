// js/common.js
// ============================================
// GLOBAL BOOTSTRAP (Theme + Partials + Layout)
// Phase 1–2: Auth-safe (no auth logic here)
// ============================================

// ===============================
// Apply saved theme early (GLOBAL)
// ===============================
(function () {
  const theme = localStorage.getItem("theme") || "light";
  const night = localStorage.getItem("night");

  document.body.setAttribute("data-theme", theme);

  if (night === "on") {
    document.body.setAttribute("data-night", "on");
  }
})();

// ===============================
// Load partial helper
// ===============================
function loadPartial(id, file, callback) {
  fetch(file)
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById(id);
      if (!container) return;

      container.innerHTML = html;

      if (typeof callback === "function") {
        callback();
      }
    })
    .catch(err => {
      console.error(`Failed to load ${file}:`, err);
    });
}

// ===============================
// Deterministic Avatar Color Helper
// ===============================
function applyAvatarColors(name) {
  if (!name) return;

  const palettes = [
    { bg: "#ecfeff", text: "#155e75", ring: "#16a34a" },
    { bg: "#fef3c7", text: "#92400e", ring: "#f59e0b" },
    { bg: "#ede9fe", text: "#4c1d95", ring: "#8b5cf6" },
    { bg: "#dcfce7", text: "#14532d", ring: "#22c55e" },
    { bg: "#ffe4e6", text: "#9f1239", ring: "#fb7185" },
    { bg: "#e0f2fe", text: "#075985", ring: "#38bdf8" }
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palette = palettes[Math.abs(hash) % palettes.length];

  document.documentElement.style.setProperty("--avatar-bg", palette.bg);
  document.documentElement.style.setProperty("--avatar-text", palette.text);
  document.documentElement.style.setProperty("--avatar-ring", palette.ring);
}

// ===============================
// Load HEADER
// ===============================
loadPartial("header", "partials/header.html", () => {
  highlightActiveNav();
  document.dispatchEvent(new CustomEvent("header:loaded"));
});

// ===============================
// Load FOOTER
// ===============================
loadPartial("footer", "partials/footer.html");

// ===============================
// Load AVATAR POPUP
// ===============================
loadPartial("avatar-portal", "partials/avatar-popup.html", () => {
  document.dispatchEvent(new CustomEvent("avatar:loaded"));
});

// ===============================
// Load PROFILE PANEL
// ===============================
loadPartial("profile-panel-portal", "partials/profile-panel.html", () => {
  document.dispatchEvent(new CustomEvent("profile-panel:loaded"));
});

// ===============================
// Load LOGIN MODAL
// ===============================
loadPartial("login-modal-portal", "partials/login-modal.html", () => {
  document.dispatchEvent(new CustomEvent("login-modal:loaded"));
});

// ===============================
// Highlight active nav link
// ===============================
function highlightActiveNav() {
  const current =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
}

// ===============================
// Mobile menu toggle
// ===============================
document.addEventListener("click", (e) => {
  const menuBtn = e.target.closest(".menu-btn");
  const mobileNav = document.getElementById("mobileNav");

  if (menuBtn && mobileNav) {
    mobileNav.classList.toggle("open");
    document.body.classList.toggle("menu-open");
    return;
  }

  if (e.target.closest(".mobile-nav a")) {
    mobileNav?.classList.remove("open");
    document.body.classList.remove("menu-open");
  }
});

// ===============================
// Footer year
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

// ===============================
// Lazy-load avatar.js AFTER popup exists
// ===============================
document.addEventListener("avatar:loaded", () => {
  if (document.getElementById("avatar-script")) return;

  const script = document.createElement("script");
  script.src = "js/avatar.js";
  script.defer = true;
  script.id = "avatar-script";
  document.body.appendChild(script);
});

// ===============================
// 🔥 FIX: Lazy-load login-modal.js AFTER modal exists
// ===============================
document.addEventListener("login-modal:loaded", () => {
  if (document.getElementById("login-modal-script")) return;

  const script = document.createElement("script");
  script.src = "js/login-modal.js";
  script.defer = true;
  script.id = "login-modal-script";
  document.body.appendChild(script);
});
