// Phase 9.2.8 - Fixed timing issues with ES modules
// js/profile-panel.js
// ===============================
// PROFILE PANEL CONTROLLER
// Phase 9.2.8: Fixed Supabase initialization timing
// ===============================

function debug() {
  // Debug logging disabled in production
}

/* ===============================
   Badge Configuration & Logic (Phase 8.3)
   =============================== */

/**
 * Compute badges for a user using backend-verified roles
 * Badge Slot 1: Primary role badge
 * Badge Slot 2: Founder badge (auto if level=100) OR Contributor (auto if ≥1 upload)
 * Badge Slot 3: Custom badge from roles table
 * 
 * @param {Object} user - Supabase user object
 * @returns {Array} Array of badge objects (max 3)
 */
async function computeBadges(user) {
  const getUserBadge = window.Roles.getUserBadge;
  const badges = [];
  
  // Get badge from backend (SINGLE SOURCE OF TRUTH)
  const badgeInfo = await getUserBadge();
  
  // Slot 1: Primary role badge
  badges.push({
    type: badgeInfo.role,
    label: badgeInfo.badge,
    icon: badgeInfo.icon,
    color: badgeInfo.color
  });
  
  // Slot 2: Founder badge (auto if level=100) or Contributor badge (if has uploads)
  if (user && user.id) {
    try {
      const supabase = await window.waitForSupabase();
      if (supabase) {
        if (badgeInfo.level >= 100) {
          // Auto Founder badge
          badges.push({
            type: 'founder',
            label: 'Founder',
            icon: '⭐',
            color: 'var(--color-warning)'
          });
        } else {
          // Check if user has uploads → Contributor badge
          const hasContributions = await checkUserContributions(user.id);
          if (hasContributions) {
            badges.push({
              type: 'contributor',
              label: 'Contributor',
              icon: '✍️',
              color: 'var(--color-success)'
            });
          }
        }

        // Slot 3: Custom badge from roles table custom_badges
        const { data: roleData } = await supabase
          .from('roles')
          .select('custom_badges, primary_role, secondary_role, tertiary_role')
          .eq('user_id', user.id)
          .single();

        if (roleData) {
          // Use custom_badges array if available
          const customBadges = roleData.custom_badges || [];
          if (Array.isArray(customBadges) && customBadges.length > 0 && badges.length < 3) {
            badges.push({
              type: 'custom',
              label: customBadges[0],
              icon: '🏅',
              color: 'var(--color-purple, #9c27b0)'
            });
          }
        }
      }
    } catch (err) {
      // Silently handle badge fetch errors
    }
  }
  
  // Limit to 3 badges
  return badges.slice(0, 3);
}

/**
 * Check if user has contributed papers (any upload)
 * @param {string} userId - User ID
 * @returns {boolean} True if user has uploaded papers
 */
async function checkUserContributions(userId) {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) return false;
    
    const { count, error } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) return false;
    return (count || 0) > 0;
  } catch (err) {
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

/**
 * Render achievements in the profile panel
 * @param {string} userId - User ID
 */
async function renderAchievements(userId) {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) return;

    const { data, error } = await supabase.rpc('get_user_achievements', {
      target_user_id: userId
    });

    if (error || !data || data.length === 0) return;

    const achievementLabels = {
      'first_upload': { label: 'First Upload', icon: '📤' },
      '10_uploads': { label: '10 Uploads', icon: '🏆' },
      'first_review': { label: 'First Review', icon: '📝' },
      'first_publish': { label: 'First Publish', icon: '🌐' },
      'early_user': { label: 'Early Adopter', icon: '🌟' }
    };

    // Find or create achievements section
    let achievementsSection = document.querySelector('.profile-achievements');
    if (!achievementsSection) {
      achievementsSection = document.createElement('section');
      achievementsSection.className = 'profile-achievements';
      const badgesSection = document.querySelector('.profile-badges');
      if (badgesSection) {
        badgesSection.parentNode.insertBefore(achievementsSection, badgesSection.nextSibling);
      }
    }

    achievementsSection.style.display = 'flex';
    achievementsSection.innerHTML = `
      <h4 style="width:100%;margin:0 0 0.5rem;font-size:0.8rem;color:var(--text-muted);">Achievements</h4>
      ${data.map(a => {
        const info = achievementLabels[a.badge_type] || { label: a.badge_type, icon: '🏅' };
        return `<span class="achievement-pill" title="Earned ${new Date(a.awarded_at).toLocaleDateString()}">${info.icon} ${info.label}</span>`;
      }).join('')}
    `;
  } catch (err) {
    // Silently fail - achievements are optional
  }
}

/* ===============================
   State tracking for both events
   =============================== */
if (window.__PROFILE_PANEL_INIT__) {
  console.warn('[profile-panel] Already initialized, skipping');
} else {
  window.__PROFILE_PANEL_INIT__ = true;
}

let profilePanelHeaderLoaded = false;
let profilePanelLoaded = false;
let clickHandlerAttached = false;

/* ===============================
   Initialize profile panel
   =============================== */
function initializeProfilePanel() {
  const handleLogout = window.AvatarUtils?.handleLogout;
  const handleSwitchAccount = window.AvatarUtils?.handleSwitchAccount;
  const handleSignIn = window.AvatarUtils?.handleSignIn;
  
  // Only run once both are ready
  if (!profilePanelHeaderLoaded || !profilePanelLoaded || clickHandlerAttached) {
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
    
    // Update current account email using AuthController
    const session = window.AuthController?.getSession?.() || window.App?.session;
    const user = session?.user;
    const emailEl = document.getElementById("currentAccountEmail");
    if (emailEl && user) {
      emailEl.textContent = user.email;
    }
    
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
      if (handleLogout) await handleLogout();
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
      if (handleSignIn) await handleSignIn();
      return;
    }
  });

  // Confirm switch account - actually trigger OAuth
  switchAccountModal?.addEventListener("click", async (e) => {
    if (e.target.id === "confirmSwitchAccountBtn") {
      closeSwitchAccountModal();
      if (handleSwitchAccount) await handleSwitchAccount();
    }
  });

  clickHandlerAttached = true;
  debug("✅ profile panel handlers attached");

  // Render profile panel immediately with current session
  renderProfilePanel();
}

/* ===============================
   Render profile panel with dynamic elements
   Uses window.App.session as SINGLE SOURCE OF TRUTH
   =============================== */
async function renderProfilePanel() {
  const updateAvatarElement = window.AvatarUtils?.updateAvatarElement;
  const isCurrentUserAdmin = window.AdminAuth?.isCurrentUserAdmin;
  
  // Use AuthController as single source of truth
  const session = window.AuthController?.getSession?.() || window.App?.session;
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

    // Show "Member since" from created_at
    const memberSinceEl = document.querySelector(".profile-member-since");
    if (memberSinceEl && user.created_at) {
      const d = new Date(user.created_at);
      memberSinceEl.textContent = `Member since ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
      memberSinceEl.style.display = "block";
    }

    // Update avatar using shared utility
    if (updateAvatarElement) updateAvatarElement(avatarEl, user);

    // Compute and render badges dynamically
    const badges = await computeBadges(user);
    renderBadges(badges);

    // Load and display achievements
    await renderAchievements(user.id);

    // Show stats
    if (statsSection) statsSection.style.display = "grid";

    // Check if user is admin - use BACKEND VERIFICATION ONLY
    const userIsAdmin = isCurrentUserAdmin ? await isCurrentUserAdmin() : false;

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

      <a href="/support.html" class="btn btn-outline">
        Help & Support
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

    // Hide member since for guest
    const memberSinceEl = document.querySelector(".profile-member-since");
    if (memberSinceEl) memberSinceEl.style.display = "none";
    
    // Update avatar for guest
    if (updateAvatarElement) updateAvatarElement(avatarEl, null);

    // Show guest badge
    const guestBadges = await computeBadges(null);
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
  profilePanelHeaderLoaded = true;
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
   Listen for auth changes - Use centralized event
   =============================== */
window.addEventListener('auth-state-changed', () => {
  debug("🔔 Auth state changed, re-rendering profile panel");
  renderProfilePanel();
});
