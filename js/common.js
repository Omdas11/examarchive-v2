// js/common.js
// ============================================
// GLOBAL UI HELPERS (Theme + Partials + Menu)
// Phase 9.2.5: Removed ALL auth logic
// ============================================

// 🧨 HARD STOP IF BOOTSTRAP NOT LOADED
if (!window.__APP_BOOTED__) {
  alert('BOOTSTRAP FAILED: common.js blocked');
  throw new Error('Bootstrap not loaded');
}

console.log('[COMMON] common.js started');

// Helper for debug logging
function logInfo(module, message, data) {
  if (window.Debug && window.Debug.logInfo) {
    window.Debug.logInfo(module, message, data);
  }
}

function logWarn(module, message, data) {
  if (window.Debug && window.Debug.logWarn) {
    window.Debug.logWarn(module, message, data);
  }
}

function logError(module, message, data) {
  if (window.Debug && window.Debug.logError) {
    window.Debug.logError(module, message, data);
  }
}

const DebugModule = {
  AUTH: 'auth',
  UPLOAD: 'upload',
  ADMIN: 'admin',
  STORAGE: 'storage',
  ROLE: 'role',
  SETTINGS: 'settings',
  SYSTEM: 'system'
};

/* ===============================
   Apply saved theme early (GLOBAL)
   =============================== */
(function () {
  // Apply theme preset FIRST (coordinated colors)
  const themePreset = localStorage.getItem("theme-preset") || "red-classic";
  document.body.setAttribute("data-theme-preset", themePreset);
  
  // Apply theme mode (light/dark/amoled)
  const themeMode = localStorage.getItem("theme-mode") || "auto";
  if (themeMode === "auto") {
    // Detect system preference
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    document.body.setAttribute("data-theme", themeMode);
  }
  
  // Legacy theme support (for header buttons)
  const legacyTheme = localStorage.getItem("theme");
  if (legacyTheme && !localStorage.getItem("theme-mode")) {
    document.body.setAttribute("data-theme", legacyTheme);
  }
  
  // Apply night mode
  const night = localStorage.getItem("night-mode") || localStorage.getItem("night") || "false";
  if (night === "on" || night === "true") {
    document.body.setAttribute("data-night", "on");
    const nightStrength = localStorage.getItem("night-strength") || localStorage.getItem("nightStrength") || "50";
    document.body.style.setProperty("--night-filter-strength", Number(nightStrength) / 100);
  }
  
  // Apply saved accent color
  const accent = localStorage.getItem("accent-color") || "red";
  document.documentElement.setAttribute("data-accent", accent);
  
  // Apply saved font
  const font = localStorage.getItem("font-family") || "default";
  if (font !== "default") {
    document.body.classList.add(`font-${font}`);
  }
  
  // Apply glass effect
  const glassEnabled = localStorage.getItem("glass-enabled") === "true";
  if (glassEnabled) {
    document.body.classList.add("glass-enabled");
    
    // Apply glass settings
    const blur = localStorage.getItem("glass-blur") || "10";
    const opacity = localStorage.getItem("glass-opacity") || "10";
    const shadow = localStorage.getItem("glass-shadow-softness") || "15";
    
    document.documentElement.style.setProperty("--glass-blur", `${blur}px`);
    document.documentElement.style.setProperty("--glass-opacity", opacity / 100);
    document.documentElement.style.setProperty("--glass-shadow-softness", shadow / 100);
  }
  
  // Apply accessibility settings
  if (localStorage.getItem("high-contrast") === "true") {
    document.body.classList.add("high-contrast");
  }
  if (localStorage.getItem("reduced-motion") === "true") {
    document.body.classList.add("reduced-motion");
  }
})();

/* ===============================
   Load partial helper
   =============================== */
function loadPartial(id, file, callback) {
  // Make path root-relative if it's not already
  const path = file.startsWith('/') ? file : `/${file}`;
  
  fetch(path)
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById(id);
      if (!container) {
        logError(DebugModule.SYSTEM, `Missing container: #${id}`);
        return;
      }
      container.innerHTML = html;
      callback && callback();
    })
    .catch(() => logError(DebugModule.SYSTEM, `Failed to load ${path}`));
}

/* ===============================
   Header
   =============================== */
loadPartial("header", "/partials/header.html", () => {
  highlightActiveNav();
  document.dispatchEvent(new CustomEvent("header:loaded"));
  logInfo(DebugModule.SYSTEM, 'Header loaded');
});

/* ===============================
   Footer
   =============================== */
loadPartial("footer", "/partials/footer.html");

/* ===============================
   Avatar popup
   =============================== */
loadPartial("avatar-portal", "/partials/avatar-popup.html", () => {
  document.dispatchEvent(new CustomEvent("avatar:loaded"));
});

/* ===============================
   Profile panel
   =============================== */
loadPartial("profile-panel-portal", "/partials/profile-panel.html", () => {
  document.dispatchEvent(new CustomEvent("profile-panel:loaded"));
});

/* ===============================
   Highlight active nav
   =============================== */
function highlightActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
}

/* ===============================
   Mobile menu
   =============================== */
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

/* ===============================
   Footer year
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* Avatar functionality is handled by avatar-utils.js and avatar-popup.js */
