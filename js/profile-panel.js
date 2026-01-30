// js/profile-panel.js
// ===============================
// PROFILE PANEL CONTROLLER
// Dynamic Rendering Based on Auth State
// + DYNAMIC BADGES (Phase 8)
// ===============================

import { supabase } from "./supabase.js";
import { updateAvatarElement, handleLogout, handleSwitchAccount, handleSignIn } from "./avatar-utils.js";
import { getUserProfile, getRoleBadge, isAdmin, getCurrentUserRole } from "./roles.js";

function debug(msg) {
  console.log("[profile-panel]", msg);
}

/* ===============================
   Badge Configuration & Logic (Phase 8)
   =============================== */

/**
 * Compute badges for a user dynamically using Phase 8 roles
 * @param {Object} user - Supabase user object
 * @returns {Array} Array of badge objects
 */
async function computeBadges(user) {
  if (!user) return [];
  
  const badges = [];
  
  // Get user profile with role - force fresh fetch to ensure latest data
  const profile = await getUserProfile(false);
  
  console.log('[BADGE] Computing badges for user, profile:', profile);
  
  if (!profile) {
    console.log('[BADGE] No profile found, returning empty badges');
    return badges;
  }
  
  // Get role badge from roles system
  const roleBadge = getRoleBadge(profile.role);
  
  console.log('[BADGE] Role badge:', roleBadge, 'for role:', profile.role);
  
  if (roleBadge) {
    // Map role badge to display format
    const badgeIcons = {
      'Admin': '👑',
      'Moderator': '🛡️',
      'Contributor': '📝'
    };
    
    badges.push({
      type: profile.role,
      label: roleBadge.name,
      icon: badgeIcons[roleBadge.name] || '✓',
      color: roleBadge.color || '#1976d2'
    });
    
    console.log('[BADGE] Added role badge:', badges[0]);
  }
  
  // Check if user has uploaded papers (contributor activity)
  const hasUploads = await checkUserContributions(user.id);
  if (hasUploads && profile.role !== 'admin' && profile.role !== 'reviewer') {
    badges.push({
      type: "active-contributor",
      label: "Active",
      icon: "⭐",
      color: "#f57c00"
    });
  }
  
  console.log('[BADGE] Final badges array:', badges);
  return badges;
}

/**
 * Check if user has contributed papers
 * @param {string} userId - User ID
 * @returns {boolean} True if user has uploaded papers
 */
async function checkUserContributions(userId) {
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
    <div class="badge badge-${badge.type}" aria-label="${badge.label} badge">
      <span class="badge-icon" aria-hidden="true">${badge.icon}</span>
      <span class="badge-label">${badge.label}</span>
    </div>
  `).join("");
}

/* ===============================
   State tracking for both events
   =============================== */
let headerLoaded = false;
let profilePanelLoaded = false;
let clickHandlerAttached = false;

/* ===============================
   Initialize profile panel
   =============================== */
function initializeProfilePanel() {
  // Only run once both are ready
  if (!headerLoaded || !profilePanelLoaded || clickHandlerAttached) {
    return;
  }

  const panel = document.querySelector(".profile-panel");
  const backdrop = document.querySelector(".profile-panel-backdrop");
  const closeBtn = document.querySelector(".profile-panel-close");
  const switchAccountModal = document.getElementById("switch-account-modal");

  if (!panel) {
    debug("❌ profile panel NOT found");
    return;
  }

  debug("✅ profile panel DOM ready, attaching handlers");

  function openPanel() {
    panel.classList.add("open");
    renderProfilePanel(); // Render user info when opening
    debug("🟢 profile panel opened");
  }

  function closePanel() {
    panel.classList.remove("open");
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

  backdrop?.addEventListener("click", closePanel);
  closeBtn?.addEventListener("click", closePanel);

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

  // Initial render
  renderProfilePanel();
}

/* ===============================
   Render profile panel with dynamic elements
   =============================== */
async function renderProfilePanel() {
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

    // Check if user is admin - force fresh check
    const userIsAdmin = await isAdmin(false);
    console.log('[PROFILE-PANEL] User is admin:', userIsAdmin);

    // Dynamically create logged-in actions
    actionsSection.innerHTML = `
      ${userIsAdmin ? `
        <a href="admin/dashboard.html" class="btn btn-red">
          Admin Dashboard
        </a>
      ` : ''}
      
      <a href="settings.html" class="btn btn-outline">
        Manage Account
      </a>

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

    // Hide badges and stats
    if (badgesSection) badgesSection.style.display = "none";
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
supabase.auth.onAuthStateChange(() => {
  debug("🔔 Auth state changed, re-rendering profile panel");
  renderProfilePanel();
});
