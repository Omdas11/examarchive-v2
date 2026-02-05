// Phase 9.2.3 - Converted to Classic JS (NO IMPORTS)
// js/avatar-popup.js
// ===============================
// AVATAR POPUP CONTROLLER
// Dynamic Rendering Based on Auth State
// ===============================

function debug(msg) {
  console.log("[avatar-popup]", msg);
}

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
    debug("❌ avatar popup NOT found");
    return;
  }

  debug("✅ avatar popup DOM ready");

  // Toggle avatar popup on avatar button click
  avatarTrigger?.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Close mobile menu if open
    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav?.classList.contains("open")) {
      mobileNav.classList.remove("open");
      document.body.classList.remove("menu-open");
    }
    
    popup.classList.toggle("open");
    renderAvatarPopup();
    debug("🔄 Avatar popup toggled");
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !avatarTrigger?.contains(e.target)) {
      closeAvatarPopup();
    }
  });

  avatarPopupLoaded = true;

  // Initial render
  renderAvatarPopup();
}

/* ===============================
   Render avatar popup with dynamic elements
   =============================== */
async function renderAvatarPopup() {
  const updateAvatarElement = window.AvatarUtils.updateAvatarElement;
  const handleLogout = window.AvatarUtils.handleLogout;
  const handleSwitchAccount = window.AvatarUtils.handleSwitchAccount;
  const handleSignIn = window.AvatarUtils.handleSignIn;
  
  // Use session from window.App (single source of truth)
  const session = window.App?.session || window.__SESSION__;
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
      nameEl.textContent = "User";
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
      debug("👉 Opening profile panel from avatar popup");
      closeAvatarPopup();
      const panel = document.querySelector(".profile-panel");
      panel?.classList.add("open");
    });

    debug(`✅ Avatar popup updated (logged-in): ${fullName || email || "User"}`);
  } else {
    // Guest state
    nameEl.textContent = "Guest";
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
      debug("👉 Sign in with Google clicked from avatar popup");
      closeAvatarPopup();
      await handleSignIn();
    });
    
    debug("ℹ️ Avatar popup updated (guest)");
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
  debug("✅ avatar loaded event received");
  initializeAvatarPopup();
});

/* ===============================
   Listen for header loaded
   =============================== */
document.addEventListener("header:loaded", () => {
  debug("✅ header loaded event received");
  avatarPopupHeaderLoaded = true;
  initializeAvatarPopup();
});

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
    debug("🔔 Auth state changed, re-rendering avatar popup");
    renderAvatarPopup();
  });
});
