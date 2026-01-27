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
// NEW: Deterministic Avatar Color Generator
// ===============================
function applyAvatarColors(name) {
  const palettes = [
    { bg: "#ecfeff", text: "#155e75", ring: "#16a34a" }, // cyan
    { bg: "#fef3c7", text: "#92400e", ring: "#f59e0b" }, // amber
    { bg: "#ede9fe", text: "#4c1d95", ring: "#8b5cf6" }, // violet
    { bg: "#dcfce7", text: "#14532d", ring: "#22c55e" }, // green
    { bg: "#ffe4e6", text: "#9f1239", ring: "#fb7185" }, // rose
    { bg: "#e0f2fe", text: "#075985", ring: "#38bdf8" }  // sky
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

  // NEW: Apply avatar colors (no image case)
  // Replace later with real auth user
  const user = {
    name: "Om Das",
    avatar: null
  };

  if (!user.avatar) {
    applyAvatarColors(user.name);
  }

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
// 🔥 LOAD EXPANDED PROFILE PANEL (THIS WAS MISSING)
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

    // NEW: sync hamburger animation
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
// Load avatar.js AFTER popup exists
// ===============================
document.addEventListener("avatar:loaded", () => {
  if (document.getElementById("avatar-script")) return;

  const script = document.createElement("script");
  script.src = "js/avatar.js";
  script.defer = true;
  script.id = "avatar-script";
  document.body.appendChild(script);
});
