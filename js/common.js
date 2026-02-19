// js/common.js
// ============================================
// GLOBAL UI HELPERS (Theme + Partials + Menu)
// Phase 9.2.8: Graceful degradation, no blocking errors
// ============================================

// ⚠️ GRACEFUL DEGRADATION: Log warning instead of throwing
if (!window.__APP_BOOTED__) {
  console.warn('[COMMON] Bootstrap not loaded - continuing with degraded functionality');
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
  // Default to "light" for white background
  const themeMode = localStorage.getItem("theme-mode") || "light";
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
  initAuthStatusIndicator();
  document.dispatchEvent(new CustomEvent("header:loaded"));
  logInfo(DebugModule.SYSTEM, 'Header loaded');
});

/* ===============================
   Auth Status Indicator
   =============================== */
function initAuthStatusIndicator() {
  // Wait for auth:ready to set initial state
  window.addEventListener('auth:ready', (e) => {
    updateAuthStatusIndicator(e.detail.session);
  });

  // Listen for auth state changes
  window.addEventListener('auth-state-changed', (e) => {
    updateAuthStatusIndicator(e.detail.session);
  });
}

function updateAuthStatusIndicator(session) {
  const indicator = document.getElementById('authStatusIndicator');
  if (!indicator) return;

  const dot = indicator.querySelector('.auth-status-dot');
  const text = indicator.querySelector('.auth-status-text');
  
  if (session) {
    indicator.classList.remove('logged-out');
    indicator.classList.add('logged-in');
    indicator.title = 'Logged In';
    if (text) text.textContent = 'Logged In';
    document.body.classList.add('user-authenticated');
  } else {
    indicator.classList.remove('logged-in');
    indicator.classList.add('logged-out');
    indicator.title = 'Not Logged In';
    if (text) text.textContent = 'Not Logged In';
    document.body.classList.remove('user-authenticated');
    injectLoginHint();
  }
}

function injectLoginHint() {
  if (sessionStorage.getItem('login-hint-shown')) return;
  const avatarWrap = document.querySelector('.avatar-wrap');
  if (!avatarWrap || avatarWrap.querySelector('.login-hint')) return;
  const hint = document.createElement('span');
  hint.className = 'login-hint';
  hint.textContent = 'Tap to Login';
  avatarWrap.appendChild(hint);
  sessionStorage.setItem('login-hint-shown', '1');
}

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
