// js/common.js
// ============================================
// GLOBAL BOOTSTRAP (Theme + Partials + Auth Hook)
// Phase 9.2.3: Converted to Classic JS (NO IMPORTS)
// ============================================

// 🧨 HARD STOP IF BOOTSTRAP NOT LOADED
if (!window.__APP_BOOTED__) {
  alert('BOOTSTRAP FAILED: common.js blocked');
  throw new Error('Bootstrap not loaded');
}

console.log('[COMMON] common.js started');

// Wait for auth module to initialize
function waitForAuth() {
  return new Promise((resolve) => {
    if (window.__AUTH_READY__) {
      resolve();
      return;
    }
    
    const checkInterval = setInterval(() => {
      if (window.__AUTH_READY__) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.warn('[COMMON] Auth initialization timeout');
      resolve();
    }, 5000);
  });
}

// Helper to get supabase client
function getSupabase() {
  if (!window.__supabase__) {
    console.error('[COMMON] Supabase client not available');
    return null;
  }
  return window.__supabase__;
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
   🔑 AUTH GUARD FUNCTION
   =============================== */
/**
 * Checks if user is authenticated and optionally displays auth required UI
 * @param {Object} options - Configuration options
 * @param {boolean} options.redirectToLogin - Whether to trigger login modal (default: false)
 * @param {boolean} options.showMessage - Whether to show auth required message (default: true)
 * @returns {Promise<boolean>} - Returns true if authenticated, false otherwise
 */
async function requireAuth(options = {}) {
  const { redirectToLogin = false, showMessage = true } = options;
  
  // Check global session
  const isAuthenticated = !!window.__SESSION__;
  
  if (!isAuthenticated) {
    logWarn(DebugModule.AUTH, 'Auth required - user not logged in');
    
    if (showMessage) {
      // Show auth required UI
      const mainContent = document.querySelector("main");
      if (mainContent) {
        const authRequiredHTML = `
          <div class="auth-required" id="auth-required-container">
            <svg class="icon" style="width: 48px; height: 48px; margin: 0 auto 1rem; stroke: var(--text-muted);" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h2 style="color: var(--text); margin-bottom: 0.5rem;">Sign in required</h2>
            <p class="auth-required-text">
              You need to be signed in to upload papers.
            </p>
            <button class="btn btn-red" id="auth-required-signin-btn">
              Sign in
            </button>
          </div>
        `;
        mainContent.innerHTML = authRequiredHTML;
        mainContent.classList.add("auth-required-container");
        
        // Attach event listener (CSP-safe)
        const signInBtn = document.getElementById("auth-required-signin-btn");
        if (signInBtn) {
          signInBtn.addEventListener("click", () => {
            document.getElementById("avatarTrigger")?.click();
          });
        }
      }
    }
    
    if (redirectToLogin) {
      // Could redirect to a login page, but we use a modal
      // For now, just trigger the avatar popup
      setTimeout(() => {
        document.getElementById("avatarTrigger")?.click();
      }, 100);
    }
    
    return false;
  }
  
  logInfo(DebugModule.AUTH, 'Auth check passed - user authenticated');
  return true;
}

// Expose to window for other scripts
window.requireAuth = requireAuth;

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

/* ==================================================
   🔑 SUPABASE SESSION CHECK
   ================================================== */
(async function checkSessionOnce() {
  await waitForAuth();
  
  const session = window.__SESSION__;
  const user = session?.user || null;

  // 🔥 FORCE SESSION VISIBILITY (Phase 9.2.3)
  console.log('[COMMON] session =', session);
  console.log('[COMMON] session user =', user);

  if (!session) {
    console.log('[COMMON] No session detected (user not logged in)');
    logInfo(DebugModule.AUTH, 'No active session');
  } else {
    console.log('[COMMON] Session verified:', {
      userId: user.id,
      email: user.email
    });
    logInfo(DebugModule.AUTH, 'Active session found', { userId: user.id });
  }

  // 🔥 Always clean OAuth hash and query params (PREVENT LOOP)
  if (window.location.hash.includes("access_token")) {
    history.replaceState({}, document.title, window.location.pathname);
    logInfo(DebugModule.AUTH, 'OAuth hash cleaned from URL');
  }
  
  // 🔥 Clean OAuth ?code= query parameter after session is established
  const params = new URLSearchParams(window.location.search);
  if (params.has("code")) {
    history.replaceState({}, document.title, window.location.pathname);
    logInfo(DebugModule.AUTH, 'OAuth code parameter cleaned from URL');
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

/* ===============================
   Lazy-load avatar.js
   =============================== */
document.addEventListener("avatar:loaded", () => {
  if (document.getElementById("avatar-script")) return;
  const s = document.createElement("script");
  s.src = "/js/avatar.js";
  s.defer = true;
  s.id = "avatar-script";
  document.body.appendChild(s);
});

/* ===============================
   🔥 AUTH → UI SYNC (SESSION-BASED)
   =============================== */
async function syncAuthToUI(stage) {
  await waitForAuth();
  
  const session = window.__SESSION__;
  const user = session?.user || null;

  logInfo(DebugModule.AUTH, `UI sync triggered: ${stage}`, { 
    authenticated: !!user,
    userId: user?.id 
  });

  const avatarMini = document.querySelector(".avatar-mini");
  if (avatarMini && user) {
    const fullName = user.user_metadata?.full_name;
    const email = user.email;
    const avatarUrl = user.user_metadata?.avatar_url;
    
    const name = fullName || email || "U";
    avatarMini.textContent = name[0].toUpperCase();
    
    // Apply avatar image if available
    // Validate URL before using
    let sanitizedUrl = null;
    if (avatarUrl) {
      try {
        const parsed = new URL(avatarUrl);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          sanitizedUrl = avatarUrl;
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    }
    
    if (sanitizedUrl) {
      avatarMini.style.backgroundImage = `url("${sanitizedUrl}")`;
      avatarMini.style.backgroundSize = "cover";
      avatarMini.style.backgroundPosition = "center";
      avatarMini.textContent = ""; // Hide initial when image is shown
    } else {
      avatarMini.style.backgroundImage = "none";
      // Generate color from name
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = hash % 360;
      avatarMini.style.backgroundColor = `hsl(${hue}, 65%, 55%)`;
    }
  } else if (avatarMini) {
    avatarMini.textContent = "?";
    avatarMini.style.backgroundImage = "none";
    avatarMini.style.backgroundColor = "";
  }
}

/* ===============================
   Initial restore
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  syncAuthToUI("DOMContentLoaded");
});

window.addEventListener("load", () => {
  syncAuthToUI("window.load");
});

document.addEventListener("header:loaded", () => {
  syncAuthToUI("header.loaded");
});

/* ===============================
   Auth state change listener
   =============================== */
window.addEventListener('auth-state-changed', (e) => {
  const event = e.detail.event;
  logInfo(DebugModule.AUTH, `Auth event: ${event}`);
  syncAuthToUI("auth.change");
});
