// Phase 9.2.3 - Converted to Classic JS (NO IMPORTS)
// js/profile-panel.js
// ===============================
// PROFILE PANEL CONTROLLER
// Phase 8.3: Backend-First Badge System
// ===============================

function debug(msg) {
  console.log("[profile-panel]", msg);
}

/* ===============================
   Badge Configuration & Logic (Phase 8.3)
   =============================== */

/**
 * Compute badges for a user using backend-verified roles
 * Badge Slot 1: Primary role badge (VISITOR/USER/ADMIN/REVIEWER)
 * Badge Slot 2: Empty (future use)
 * Badge Slot 3: Empty (future use)
 * 
 * @param {Object} user - Supabase user object
 * @returns {Array} Array of badge objects
 */
async function computeBadges(user) {
  const getUserBadge = window.Roles.getUserBadge;
  const badges = [];
  
  console.log('[BADGE] Computing badges from backend...');
  
  // Get badge from backend (SINGLE SOURCE OF TRUTH)
  const badgeInfo = await getUserBadge();
  
  console.log('[BADGE] Backend badge info:', badgeInfo);
  
  // Slot 1: Primary role badge
  badges.push({
    type: badgeInfo.role,
    label: badgeInfo.badge,
    icon: badgeInfo.icon,
    color: badgeInfo.color
  });
  
  console.log(`[BADGE] rendered: ${badgeInfo.badge} (profile-panel, backend-verified)`);
  
  // Slot 2: Empty (future use)
  // Could be used for achievements, activity level, etc.
  
  // Slot 3: Empty (future use)
  // Could be used for certifications, special roles, etc.
  
  console.log('[BADGE] Final badges array:', badges);
  return badges;
}

/**
 * Check if user has contributed papers
 * @param {string} userId - User ID
 * @returns {boolean} True if user has uploaded papers
 */
async function checkUserContributions(userId) {
  const supabase = window.__supabase__;
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'published')
      .limit(1);
    
    if (error) {
      console.error('Error checking contributions:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error('Error in checkUserContributions:', err);
    return false;
  }
}

/**
 * Render badges dynamically in the profile panel
 * @param {Array} badges - Array of badge objects
 */
function renderBadges(badges) {
  const badgesSection = document.querySelector(".profile-badges");
  if (!badgesSection) return;
  
  if (badges.length === 0) {
    badgesSection.style.display = "none";
    return;
  }
  
  badgesSection.style.display = "flex";
  badgesSection.innerHTML = badges.map(badge => `
    <div class="badge badge-${badge.type}" aria-label="${badge.label} badge" style="border-color: ${badge.color};">
      <span class="badge-icon" aria-hidden="true">${badge.icon}</span>
      <span class="badge-label">${badge.label}</span>
    </div>
  `).join("");
}

/* ===============================
   State tracking for both events
   =============================== */
if (window.__PROFILE_PANEL_INIT__) {
  console.warn('[profile-panel] Already initialized, skipping');
} else {
  window.__PROFILE_PANEL_INIT__ = true;
}

let headerLoaded = false;
let profilePanelLoaded = false;
let clickHandlerAttached = false;

/* ===============================
   Initialize profile panel
   =============================== */
function initializeProfilePanel() {
  const supabase = window.__supabase__;
  const handleLogout = window.AvatarUtils.handleLogout;
  const handleSwitchAccount = window.AvatarUtils.handleSwitchAccount;
  const handleSignIn = window.AvatarUtils.handleSignIn;
  
  // Only run once both are ready
  if (!headerLoaded || !profilePanelLoaded || clickHandlerAttached) {
    return;
  }

  const panel = document.querySelector(".profile-panel");
  const backdrop = document.querySelector(".profile-panel-backdrop");
  const switchAccountModal = document.getElementById("switch-account-modal");

  if (!panel) {
    debug("❌ profile panel NOT found");
    return;
  }

  debug("✅ profile panel DOM ready, attaching handlers");

  function openPanel() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    // CRITICAL: Always refresh profile when opening to ensure latest auth state
    renderProfilePanel();
    debug("🟢 profile panel opened");
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    debug("🔴 profile panel closed");
  }

  function openSwitchAccountModal() {
    if (!switchAccountModal) return;
    
    // Update current account email
    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      const emailEl = document.getElementById("currentAccountEmail");
      if (emailEl && user) {
        emailEl.textContent = user.email;
      }
    }).catch(err => {
      debug("❌ Error getting session for switch account: " + err.message);
    });
    
    switchAccountModal.classList.add("open");
    switchAccountModal.setAttribute("aria-hidden", "false");
    debug("🟢 switch account modal opened");
  }

  function closeSwitchAccountModal() {
    if (!switchAccountModal) return;
    switchAccountModal.classList.remove("open");
    switchAccountModal.setAttribute("aria-hidden", "true");
    debug("🔴 switch account modal closed");
  }

  // Close panel on backdrop click
  backdrop?.addEventListener("click", closePanel);

  // Close panel on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      closePanel();
    }
  });

  // Close on any [data-close-profile] element
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-profile]")) {
      closePanel();
    }
  });

  // Close switch account modal
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-switch]")) {
      closeSwitchAccountModal();
    }
  });

  // Close switch account modal on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && switchAccountModal?.classList.contains("open")) {
      closeSwitchAccountModal();
    }
  });

  // Event delegation for dynamically created buttons
  panel.addEventListener("click", async (e) => {
    // Logout button
    if (e.target.id === "profileLogoutBtn") {
      closePanel();
      await handleLogout();
      return;
    }

    // Switch account button
    if (e.target.id === "profileSwitchAccountBtn") {
      closePanel();
      openSwitchAccountModal();
      return;
    }

    // Sign in button (guest mode)
    if (e.target.id === "profileSignInBtn") {
      closePanel();
      await handleSignIn();
      return;
    }
  });

  // Confirm switch account - actually trigger OAuth
  switchAccountModal?.addEventListener("click", async (e) => {
    if (e.target.id === "confirmSwitchAccountBtn") {
      closeSwitchAccountModal();
      await handleSwitchAccount();
    }
  });

  clickHandlerAttached = true;
  debug("✅ profile panel handlers attached");

  // Render profile panel immediately with current session
  renderProfilePanel();
}

/* ===============================
   Render profile panel with dynamic elements
   Uses supabase.auth.getSession() as SINGLE SOURCE OF TRUTH
   =============================== */
async function renderProfilePanel() {
  const supabase = window.__supabase__;
  const updateAvatarElement = window.AvatarUtils.updateAvatarElement;
  const isCurrentUserAdmin = window.AdminAuth.isCurrentUserAdmin;
  
  // Get current session directly - SINGLE SOURCE OF TRUTH
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  const user = session?.user;

  const nameEl = document.querySelector(".profile-panel .profile-name");
  const usernameEl = document.querySelector(".profile-panel .profile-username");
  const avatarEl = document.getElementById("profileAvatar");
  const badgesSection = document.querySelector(".profile-badges");
  const statsSection = document.querySelector(".profile-stats");
  const actionsSection = document.querySelector(".profile-actions");

  if (!nameEl || !usernameEl || !actionsSection) {
    return;
  }

  if (user) {
    // Priority: full_name from Gmail metadata, then email, then fallback
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

    // Compute and render badges dynamically
    const badges = await computeBadges(user);
    console.log('[PROFILE-PANEL] Badges computed:', badges);
    renderBadges(badges);

    // Show stats
    if (statsSection) statsSection.style.display = "grid";

    // Check if user is admin - use BACKEND VERIFICATION ONLY
    const userIsAdmin = await isCurrentUserAdmin();
    console.log('[PROFILE-PANEL] User is admin:', userIsAdmin);
    console.log('[ADMIN] dashboard access', userIsAdmin ? 'granted' : 'denied');

    // Dynamically create logged-in actions with admin dashboard link if admin
    actionsSection.innerHTML = `
      ${userIsAdmin ? `
        <a href="/admin/dashboard/" class="btn btn-red">
          Admin Dashboard
        </a>
      ` : `
        <a href="settings.html" class="btn btn-outline">
          Manage Account
        </a>
      `}

      <button id="profileSwitchAccountBtn" class="btn btn-outline">
        Switch Account
      </button>

      <button id="profileLogoutBtn" class="btn btn-outline-red">
        Sign out
      </button>
    `;

    debug(`✅ Profile updated (logged-in): ${fullName || email || "User"}`);
  } else {
    // Guest state
    nameEl.textContent = "Guest";
    usernameEl.textContent = "Not signed in";
    
    // Update avatar for guest
    updateAvatarElement(avatarEl, null);

    // Show guest badge
    const guestBadges = await computeBadges(null);
    console.log('[PROFILE-PANEL] Guest badges computed:', guestBadges);
    renderBadges(guestBadges);

    // Hide stats
    if (statsSection) statsSection.style.display = "none";

    // Dynamically create guest actions
    actionsSection.innerHTML = `
      <p class="muted">
        Sign in to upload papers and track your progress.
      </p>

      <button id="profileSignInBtn" class="btn btn-primary">
        Sign in with Google
      </button>
    `;
    
    debug("ℹ️ Profile showing guest state");
  }
}

/* ===============================
   Listen for header loaded
   =============================== */
document.addEventListener("header:loaded", () => {
  debug("✅ header loaded");
  headerLoaded = true;
  initializeProfilePanel();
});

/* ===============================
   Listen for profile panel loaded
   =============================== */
document.addEventListener("profile-panel:loaded", () => {
  debug("✅ profile panel loaded");
  profilePanelLoaded = true;
  initializeProfilePanel();
});

/* ===============================
   Listen for auth changes
   =============================== */
document.addEventListener('app:ready', () => {
  const supabase = window.App.supabase;
  if (!supabase) return;

  supabase.auth.onAuthStateChange(() => {
    debug("🔔 Auth state changed, re-rendering profile panel");
    renderProfilePanel();
  });
});
