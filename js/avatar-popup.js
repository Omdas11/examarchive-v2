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

  // Avatar click navigates directly to profile (logged-in) or login (guest)
  avatarTrigger?.addEventListener("click", (e) => {
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
function updateHeaderAvatar(user) {
  const avatarMini = document.querySelector(".avatar-mini");
  if (!avatarMini) return;

  if (user) {
    const fullName = user.user_metadata?.full_name;
    const email = user.email;
    const avatarUrl = user.user_metadata?.avatar_url;
    const initial = fullName ? fullName[0].toUpperCase() : email ? email[0].toUpperCase() : "U";

    // Try to get roles avatar_url (uploaded avatar takes priority)
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (supabase) {
      supabase.from('roles').select('avatar_url').eq('user_id', user.id).single().then(function(res) {
        const rolesAvatarUrl = res.data?.avatar_url;
        const finalUrl = rolesAvatarUrl || avatarUrl;
        const sanitizedUrl = window.AvatarUtils?.sanitizeAvatarUrl
          ? window.AvatarUtils.sanitizeAvatarUrl(finalUrl)
          : finalUrl;
        if (sanitizedUrl) {
          avatarMini.textContent = "";
          avatarMini.style.backgroundImage = `url("${sanitizedUrl}")`;
          avatarMini.style.backgroundSize = "cover";
          avatarMini.style.backgroundPosition = "center";
        } else {
          avatarMini.textContent = initial;
          avatarMini.style.backgroundImage = "none";
          const color = window.AvatarUtils?.stringToColor
            ? window.AvatarUtils.stringToColor(fullName || email || "User")
            : "var(--avatar-bg)";
          avatarMini.style.backgroundColor = color;
        }
      });
    } else {
      const sanitizedUrl = window.AvatarUtils?.sanitizeAvatarUrl
        ? window.AvatarUtils.sanitizeAvatarUrl(avatarUrl)
        : avatarUrl;

      if (sanitizedUrl) {
        avatarMini.textContent = "";
        avatarMini.style.backgroundImage = `url("${sanitizedUrl}")`;
        avatarMini.style.backgroundSize = "cover";
        avatarMini.style.backgroundPosition = "center";
      } else {
        avatarMini.textContent = initial;
        avatarMini.style.backgroundImage = "none";
        const color = window.AvatarUtils?.stringToColor
          ? window.AvatarUtils.stringToColor(fullName || email || "User")
          : "var(--avatar-bg)";
        avatarMini.style.backgroundColor = color;
      }
    }
  } else {
    avatarMini.innerHTML = window.SvgIcons ? window.SvgIcons.get('user') : '';
    avatarMini.style.backgroundImage = "none";
    avatarMini.style.backgroundColor = "";
    avatarMini.title = "Visitor";
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
