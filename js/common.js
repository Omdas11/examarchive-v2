// js/common.js
// ============================================
// GLOBAL BOOTSTRAP (Theme + Partials + Auth Hook)
// SUPABASE – MOBILE DEBUG VERSION (STABLE)
// ============================================

import { supabase } from "./supabase.js";
import { clearRoleCache } from "./roles.js";
import { loadAuthoritativeRole } from "./role-authority.js";

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
export async function requireAuth(options = {}) {
  const { redirectToLogin = false, showMessage = true } = options;
  
  const { data } = await supabase.auth.getSession();
  const isAuthenticated = !!data?.session;
  
  if (!isAuthenticated) {
    debugBox("🔒 Auth required - user not logged in");
    
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
  
  debugBox("✅ Auth check passed");
  return true;
}

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
   Mobile debug helper (VISIBLE)
   =============================== */
function debugBox(text) {
  let box = document.getElementById("debug-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "debug-box";
    box.style.position = "fixed";
    box.style.bottom = "10px";
    box.style.left = "10px";
    box.style.zIndex = "999999";
    box.style.background = "#000";
    box.style.color = "#0f0";
    box.style.padding = "8px";
    box.style.fontSize = "12px";
    box.style.fontFamily = "monospace";
    box.style.maxWidth = "90vw";
    document.body.appendChild(box);
  }
  box.textContent = text;
  console.log(text);
}

/* ==================================================
   🔑 INITIALIZE GLOBAL ROLE STATE (AUTHORITATIVE)
   ================================================== */
(async function initializeAuthoritativeRole() {
  // Set initial state to not ready
  window.__ROLE_READY__ = false;
  window.__APP_ROLE__ = {
    role: null,
    badge: null,
    ready: false
  };

  const { data } = await supabase.auth.getSession();

  if (!data?.session) {
    debugBox("ℹ️ No active session");
    clearRoleCache(); // Clear any stale cache
  }

  // Load authoritative role from database (NO CACHE)
  try {
    console.log('[COMMON] Loading authoritative role...');
    const roleData = await loadAuthoritativeRole();
    
    // Set global role state
    window.__APP_ROLE__ = {
      role: roleData.role,
      badge: roleData.badge,
      ready: true
    };
    window.__ROLE_READY__ = true;
    
    console.log('[COMMON] Global role state initialized:', window.__APP_ROLE__);
    debugBox(`✅ Role loaded: ${roleData.role} (${roleData.badge})`);
    
    // Dispatch event to notify UI components
    window.dispatchEvent(new Event('role:ready'));
    console.log('[COMMON] role:ready event dispatched');
  } catch (err) {
    debugBox("⚠️ Error loading role: " + err.message);
    // Default to guest on error
    window.__APP_ROLE__ = {
      role: 'guest',
      badge: 'Guest',
      ready: true
    };
    window.__ROLE_READY__ = true;
    window.dispatchEvent(new Event('role:ready'));
  }

  // 🔥 Always clean OAuth hash (PREVENT LOOP)
  if (window.location.hash.includes("access_token")) {
    history.replaceState({}, document.title, window.location.pathname);
    debugBox("🧹 OAuth hash cleaned from URL");
  }
})();

/* ===============================
   Load partial helper
   =============================== */
function loadPartial(id, file, callback) {
  fetch(file)
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById(id);
      if (!container) {
        debugBox("❌ Missing container: #" + id);
        return;
      }
      container.innerHTML = html;
      callback && callback();
    })
    .catch(() => debugBox("❌ Failed to load " + file));
}

/* ===============================
   Header
   =============================== */
loadPartial("header", "partials/header.html", () => {
  highlightActiveNav();
  document.dispatchEvent(new CustomEvent("header:loaded"));
  debugBox("✅ Header loaded");
});

/* ===============================
   Footer
   =============================== */
loadPartial("footer", "partials/footer.html");

/* ===============================
   Avatar popup
   =============================== */
loadPartial("avatar-portal", "partials/avatar-popup.html", () => {
  document.dispatchEvent(new CustomEvent("avatar:loaded"));
});

/* ===============================
   Profile panel
   =============================== */
loadPartial("profile-panel-portal", "partials/profile-panel.html", () => {
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
  s.src = "js/avatar.js";
  s.defer = true;
  s.id = "avatar-script";
  document.body.appendChild(s);
});

/* ===============================
   🔥 AUTH → UI SYNC (SESSION-BASED)
   =============================== */
async function syncAuthToUI(stage) {
  const { data } = await supabase.auth.getSession();
  const session = data?.session || null;
  const user = session?.user || null;

  debugBox(
    "🔎 " + stage +
    " | auth=" + (user ? "USER" : "NULL")
  );

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
   Supabase auth listener
   =============================== */
supabase.auth.onAuthStateChange(async (event) => {
  debugBox("🔔 AUTH EVENT: " + event);
  
  // Clear role cache on auth changes (except token refresh)
  if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
    clearRoleCache();
    
    // Re-load authoritative role from database (NO CACHE)
    try {
      console.log('[COMMON] Auth event, reloading authoritative role...');
      const roleData = await loadAuthoritativeRole();
      
      window.__APP_ROLE__ = {
        role: roleData.role,
        badge: roleData.badge,
        ready: true
      };
      window.__ROLE_READY__ = true;
      
      console.log('[COMMON] Role reloaded after', event, ':', window.__APP_ROLE__);
      debugBox(`✅ Role updated: ${roleData.role} (${roleData.badge})`);
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new Event('role:ready'));
    } catch (err) {
      debugBox(`⚠️ Error updating role after ${event}: ${err.message}`);
    }
  }
  
  syncAuthToUI("auth.change");
});
