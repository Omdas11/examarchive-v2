// js/common.js
// ============================================
// GLOBAL UI HELPERS (Theme + Partials + Menu)
// ============================================

// ⚠️ GRACEFUL DEGRADATION: Log warning instead of throwing
if (!window.__APP_BOOTED__) {
  console.warn('[COMMON] Bootstrap not loaded - continuing with degraded functionality');
}

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
  highlightActiveDrawerLink();
  initAuthStatusIndicator();
  initAdminDrawerLink();
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
  if (session) {
    document.body.classList.add('user-authenticated');
  } else {
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
   Drawer menu
   =============================== */
function openDrawer() {
  document.body.classList.add("drawer-open");
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
}

document.addEventListener("click", (e) => {
  // Hamburger toggles drawer
  if (e.target.closest(".menu-btn")) {
    if (document.body.classList.contains("drawer-open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
    return;
  }

  // Close button in drawer
  if (e.target.closest(".drawer-close")) {
    closeDrawer();
    return;
  }

  // Overlay click closes drawer
  if (e.target.closest(".drawer-overlay")) {
    closeDrawer();
    return;
  }

  // Clicking a drawer link closes drawer
  if (e.target.closest(".drawer-link")) {
    closeDrawer();
  }
});

// Close drawer on ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("drawer-open")) {
    closeDrawer();
  }
});

// Highlight active drawer link
function highlightActiveDrawerLink() {
  const pathname = window.location.pathname;
  document.querySelectorAll(".drawer-link").forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    // For directory links (e.g. /admin/dashboard/), check if pathname starts with href
    // For file links, check exact match or filename match
    const isActive = href.endsWith("/")
      ? pathname.startsWith(href)
      : pathname === href || pathname.endsWith(href.split("/").pop());
    if (isActive) link.classList.add("active");
  });
}

// Profile link in drawer opens avatar trigger
document.addEventListener("click", (e) => {
  const profileLink = e.target.closest("#drawerProfileLink");
  if (profileLink) {
    e.preventDefault();
    closeDrawer();
    setTimeout(() => {
      const avatarTrigger = document.getElementById("avatarTrigger");
      if (avatarTrigger) {
        // Use focus then click for better screen reader support
        avatarTrigger.focus();
        avatarTrigger.click();
      }
    }, 350);
  }
});

/* ===============================
   Admin drawer link visibility
   =============================== */
function initAdminDrawerLink() {
  // Show admin link for users with role level >= 75
  window.addEventListener('auth:ready', () => {
    updateAdminDrawerVisibility();
  });
  window.addEventListener('auth-state-changed', () => {
    updateAdminDrawerVisibility();
  });
}

function updateAdminDrawerVisibility() {
  const adminLink = document.getElementById("drawerAdminLink");
  if (!adminLink) return;
  
  if (window.RoleUtils?.getCurrentUserRoleLevel) {
    window.RoleUtils.getCurrentUserRoleLevel().then(level => {
      if (level >= 75) {
        adminLink.removeAttribute("hidden");
      } else {
        adminLink.setAttribute("hidden", "");
      }
    });
  }
}

/* ===============================
   Footer year
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* Avatar functionality is handled by avatar-utils.js and avatar-popup.js */
