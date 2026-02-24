// Phase 9.2.3 - Converted to Classic JS (NO IMPORTS)
// js/avatar-popup.js
// ===============================
// AVATAR POPUP CONTROLLER
// Dynamic Rendering Based on Auth State
// ===============================

function debug() {}

if (window.__AVATAR_POPUP_INIT__) {
  console.warn('[avatar-popup] Already initialized, skipping');
} else {
  window.__AVATAR_POPUP_INIT__ = true;
}

let avatarPopupLoaded = false;
let avatarPopupHeaderLoaded = false;

/* ===============================
   Initialize avatar popup
   =============================== */
function initializeAvatarPopup() {
  // Wait for both avatar popup and header to be ready
  if (avatarPopupLoaded || !avatarPopupHeaderLoaded) return;

  const popup = document.getElementById("avatar-popup");
  const avatarTrigger = document.querySelector(".avatar-trigger");

  if (!popup) {
    debug("[ERROR] avatar popup NOT found");
    return;
  }

  debug("[OK] avatar popup DOM ready");

  // Only attach click handler if the trigger element actually exists.
  // Guard with avatarPopupLoaded AFTER successful attachment so a missing
  // element on first call doesn't permanently block future attempts.
  if (avatarTrigger) {
    // Avatar click navigates directly to profile (logged-in) or login (guest)
    avatarTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Close mobile menu if open
      const mobileNav = document.getElementById("mobileNav");
      if (mobileNav?.classList.contains("open")) {
        mobileNav.classList.remove("open");
        document.body.classList.remove("menu-open");
      }
      
      const session = window.AuthController?.getSession?.() || window.App?.session;
      if (session?.user) {
        window.location.href = "/profile.html";
      } else {
        window.location.href = "/login.html";
      }
    });

    avatarPopupLoaded = true;
  }
}

/* ===============================
   Render avatar popup with dynamic elements
   =============================== */
async function renderAvatarPopup() {
  const updateAvatarElement = window.AvatarUtils.updateAvatarElement;
  const handleLogout = window.AvatarUtils.handleLogout;
  const handleSwitchAccount = window.AvatarUtils.handleSwitchAccount;
  const handleSignIn = window.AvatarUtils.handleSignIn;
  
  // Use AuthController as single source of truth
  const session = window.AuthController?.getSession?.() || window.App?.session;
  const user = session?.user;

  const popup = document.getElementById("avatar-popup");
  if (!popup) return;

  // Update data-auth attribute for styling hooks
  popup.setAttribute("data-auth", user ? "user" : "guest");

  const nameEl = popup.querySelector(".display-name");
  const usernameEl = popup.querySelector(".username");
  const avatarEl = document.getElementById("avatarPopupCircle");
  const actionsContainer = popup.querySelector(".avatar-actions");

  if (!nameEl || !usernameEl || !actionsContainer) {
    return;
  }

  // Update header info
  if (user) {
    const fullName = user.user_metadata?.full_name;
    const email = user.email;

    if (fullName) {
      nameEl.textContent = fullName;
      usernameEl.textContent = email;
    } else if (email) {
      nameEl.textContent = email;
      usernameEl.textContent = "Signed in";
    } else {
      nameEl.textContent = "Account";
      usernameEl.textContent = "Signed in";
    }

    // Update avatar using shared utility
    updateAvatarElement(avatarEl, user);

    // Dynamically create logged-in actions
    actionsContainer.innerHTML = `
      <button class="btn btn-glass" id="avatarViewProfileBtn">
        View Profile
      </button>

      <a href="settings.html" class="btn btn-outline">
        Settings
      </a>

      <button class="btn btn-outline" id="avatarSwitchBtn">
        Switch Account
      </button>

      <button class="btn btn-outline-red" id="avatarLogoutBtn">
        Sign out
      </button>
    `;

    // Attach event listeners to dynamically created elements
    const logoutBtn = document.getElementById("avatarLogoutBtn");
    const switchBtn = document.getElementById("avatarSwitchBtn");
    const viewProfileBtn = document.getElementById("avatarViewProfileBtn");

    logoutBtn?.addEventListener("click", async () => {
      closeAvatarPopup();
      await handleLogout();
    });

    switchBtn?.addEventListener("click", async () => {
      closeAvatarPopup();
      await handleSwitchAccount();
    });

    viewProfileBtn?.addEventListener("click", () => {
      debug("[ACTION] Navigating to profile page");
      closeAvatarPopup();
      window.location.href = "/profile.html";
    });

    debug(`[OK] Avatar popup updated (logged-in): ${fullName || email || "User"}`);
  } else {
    // Guest state
    nameEl.innerHTML = (window.SvgIcons ? window.SvgIcons.inline('user') : '') + " Visitor";
    usernameEl.textContent = "Not signed in";
    
    // Update avatar for guest
    updateAvatarElement(avatarEl, null);
    
    // Dynamically create guest actions
    actionsContainer.innerHTML = `
      <button class="btn btn-primary" id="avatarSignInBtn">
        Sign in with Google
      </button>
    `;

    // Attach event listener to dynamically created element
    const signInBtn = document.getElementById("avatarSignInBtn");
    signInBtn?.addEventListener("click", async () => {
      debug("[ACTION] Sign in with Google clicked from avatar popup");
      closeAvatarPopup();
      await handleSignIn();
    });
    
    debug("[INFO] Avatar popup updated (guest)");
  }
}

/* ===============================
   Close avatar popup
   =============================== */
function closeAvatarPopup() {
  const popup = document.getElementById("avatar-popup");
  popup?.classList.remove("open");
}

/* ===============================
   Listen for avatar loaded
   =============================== */
document.addEventListener("avatar:loaded", () => {
  debug("[OK] avatar loaded event received");
  initializeAvatarPopup();
});

/* ===============================
   Listen for header loaded
   =============================== */
document.addEventListener("header:loaded", () => {
  debug("[OK] header loaded event received");
  avatarPopupHeaderLoaded = true;
  initializeAvatarPopup();
});

/* ===============================
   Update header avatar-mini with user's profile image or initials
   =============================== */
let headerAvatarFetchInProgress = false;

// In-memory cache so avatar doesn't re-fetch on every navigation/re-render.
// Keyed by user id; stores { avatarUrl, ringType }.
var _headerAvatarCache = {};

function updateHeaderAvatar(user) {
  const avatarMini = document.querySelector(".avatar-mini");
  if (!avatarMini) return;

  const avatarWrap = avatarMini.closest(".avatar-wrap");

  // Role tier → SVG icon + color mapping for fallback placeholder
  var tierSvgMap = {
    'founder':          { icon: 'crown',    color: '#ffd700' },
    'admin':            { icon: 'shield',   color: '#d32f2f' },
    'senior-moderator': { icon: 'shield',   color: '#ff9800' },
    'reviewer':         { icon: 'badge',    color: '#2196F3' },
    'senior':           { icon: 'lightning', color: '#9c27b0' },
    'veteran':          { icon: 'clipboard', color: '#00bcd4' },
    'contributor':      { icon: 'sparkles', color: '#4CAF50' },
    'explorer':         { icon: 'eye',      color: '#607d8b' },
    'visitor':          { icon: 'user',     color: '#9e9e9e' },
    'none':             { icon: 'user',     color: '#9e9e9e' }
  };

  if (user) {
    const fullName = user.user_metadata?.full_name;
    const email = user.email;
    const initial = fullName ? fullName[0].toUpperCase() : email ? email[0].toUpperCase() : "U";

    function applyAvatar(url, ringType) {
      const sanitizedUrl = window.AvatarUtils?.sanitizeAvatarUrl
        ? window.AvatarUtils.sanitizeAvatarUrl(url)
        : url;
      if (sanitizedUrl) {
        avatarMini.textContent = "";
        avatarMini.innerHTML = "";
        avatarMini.style.backgroundImage = `url("${sanitizedUrl}")`;
        avatarMini.style.backgroundSize = "cover";
        avatarMini.style.backgroundPosition = "center";
        avatarMini.style.backgroundColor = "";
        avatarMini.classList.remove("avatar-shimmer");
      } else {
        // Colorful SVG placeholder based on role tier
        var tier = tierSvgMap[ringType] || tierSvgMap['visitor'];
        var svgHtml = window.SvgIcons ? window.SvgIcons.get(tier.icon, { size: 18 }) : initial;
        avatarMini.innerHTML = svgHtml;
        avatarMini.style.backgroundImage = "none";
        avatarMini.style.backgroundColor = tier.color;
        avatarMini.style.color = "#fff";
        avatarMini.classList.remove("avatar-shimmer");
      }
    }

    // Serve from cache to avoid shimmer flicker on navigation/refresh
    if (_headerAvatarCache[user.id]) {
      var cached = _headerAvatarCache[user.id];
      if (avatarWrap) avatarWrap.setAttribute('data-ring', cached.ringType);
      applyAvatar(cached.avatarUrl, cached.ringType);
      return;
    }

    // Show shimmer while loading
    avatarMini.textContent = "";
    avatarMini.classList.add("avatar-shimmer");

    // Prevent duplicate fetches
    if (headerAvatarFetchInProgress) return;
    headerAvatarFetchInProgress = true;

    // Fetch avatar_url and role info from roles table (authoritative source)
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (supabase) {
      supabase.from('roles').select('avatar_url, primary_role, level').eq('user_id', user.id).single().then(function(res) {
        headerAvatarFetchInProgress = false;
        // Use only roles.avatar_url — do NOT fall back to OAuth metadata
        var rolesAvatar = res.data?.avatar_url || null;

        // Compute ring type first (needed for SVG fallback)
        var role = res.data?.primary_role || '';
        var level = res.data?.level || 0;
        var ringType = 'none';
        if (role === 'Founder') ringType = 'founder';
        else if (role === 'Admin') ringType = 'admin';
        else if (role === 'Senior Moderator') ringType = 'senior-moderator';
        else if (role === 'Reviewer') ringType = 'reviewer';
        else if (level >= 50) ringType = 'senior';
        else if (level >= 25) ringType = 'veteran';
        else if (level >= 10) ringType = 'contributor';
        else if (level >= 5) ringType = 'explorer';
        else ringType = 'visitor';

        // Cache the result so subsequent renders are instant
        _headerAvatarCache[user.id] = { avatarUrl: rolesAvatar, ringType: ringType };

        // Set ring data attribute for animated gradient
        if (avatarWrap) {
          avatarWrap.setAttribute('data-ring', ringType);
        }

        applyAvatar(rolesAvatar, ringType);
      }).catch(function() {
        headerAvatarFetchInProgress = false;
        // On error: show SVG fallback without caching so it retries next time
        applyAvatar(null, 'none');
        if (avatarWrap) avatarWrap.setAttribute('data-ring', 'none');
      });
    } else {
      headerAvatarFetchInProgress = false;
      applyAvatar(null, 'none');
      if (avatarWrap) avatarWrap.setAttribute('data-ring', 'none');
    }
  } else {
    // Guest: show visitor SVG placeholder; clear any stale cache
    _headerAvatarCache = {};
    var guestTier = tierSvgMap['visitor'];
    avatarMini.innerHTML = window.SvgIcons ? window.SvgIcons.get(guestTier.icon, { size: 18 }) : '';
    avatarMini.style.backgroundImage = "none";
    avatarMini.style.backgroundColor = guestTier.color;
    avatarMini.style.color = "#fff";
    avatarMini.classList.remove("avatar-shimmer");
    avatarMini.title = "Visitor";
    if (avatarWrap) avatarWrap.setAttribute('data-ring', 'none');
  }
}

/* ===============================
   Listen for auth changes
   =============================== */
let avatarPopupAuthListenerSetup = false;

document.addEventListener('app:ready', () => {
  if (avatarPopupAuthListenerSetup) return;
  avatarPopupAuthListenerSetup = true;
  
  const supabase = window.App.supabase;
  if (!supabase) return;

  supabase.auth.onAuthStateChange(() => {
    debug("[EVENT] Auth state changed, re-rendering avatar popup");
    renderAvatarPopup();
  });
});

/* ===============================
   Update header avatar on auth:ready
   =============================== */
window.addEventListener("auth:ready", (e) => {
  const session = e.detail?.session;
  updateHeaderAvatar(session?.user || null);
});

/* ===============================
   Update header avatar on auth state changes
   =============================== */
window.addEventListener("auth-state-changed", (e) => {
  const session = e.detail?.session;
  updateHeaderAvatar(session?.user || null);
});
