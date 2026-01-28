// js/common.js
// ============================================
// GLOBAL BOOTSTRAP (Theme + Partials + Auth Hook)
// ============================================

// ===============================
// Apply saved theme early
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
      callback && callback();
    })
    .catch(err => console.error(`Failed to load ${file}`, err));
}

// ===============================
// Header
// ===============================
loadPartial("header", "partials/header.html", () => {
  highlightActiveNav();
  document.dispatchEvent(new CustomEvent("header:loaded"));
});

// ===============================
// Footer
// ===============================
loadPartial("footer", "partials/footer.html");

// ===============================
// Avatar popup
// ===============================
loadPartial("avatar-portal", "partials/avatar-popup.html", () => {
  document.dispatchEvent(new CustomEvent("avatar:loaded"));
});

// ===============================
// Profile panel
// ===============================
loadPartial("profile-panel-portal", "partials/profile-panel.html", () => {
  document.dispatchEvent(new CustomEvent("profile-panel:loaded"));
});

// ===============================
// Login modal
// ===============================
loadPartial("login-modal-portal", "partials/login-modal.html", () => {
  document.dispatchEvent(new CustomEvent("login-modal:loaded"));
});

// ===============================
// Highlight active nav
// ===============================
function highlightActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
}

// ===============================
// Mobile menu
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
// Lazy-load avatar.js
// ===============================
document.addEventListener("avatar:loaded", () => {
  if (document.getElementById("avatar-script")) return;
  const s = document.createElement("script");
  s.src = "js/avatar.js";
  s.defer = true;
  s.id = "avatar-script";
  document.body.appendChild(s);
});

// ===============================
// Lazy-load login-modal.js (MODULE)
// ===============================
document.addEventListener("login-modal:loaded", () => {
  if (document.getElementById("login-modal-script")) return;
  const s = document.createElement("script");
  s.src = "js/login-modal.js";
  s.type = "module";
  s.id = "login-modal-script";
  document.body.appendChild(s);
});

// ===============================
// 🔥 AUTH RESTORE HOOK (CRITICAL)
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  if (window.AppwriteAuth?.restoreSession) {
    await window.AppwriteAuth.restoreSession();
  }
});
