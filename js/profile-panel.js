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
 * Map role level to display badge label
 * @param {number} level
 * @returns {string|null}
 */
function mapLevelToRole(level) {
  if (!Number.isFinite(level)) return null;
  const roleInfo = window.RoleUtils?.mapRole?.(level) || null;
  if (!roleInfo?.displayName) return null;
  return roleInfo.displayName.replace(/^[^\s]+ /, '');
}

/**
 * Get deduplicated badge labels for user role data
 * Shows primary_role as system role + custom badges as pills
 * @param {Object} role
 * @returns {string[]}
 */
function getUserBadges(role) {
  const badges = new Set();

  if (role?.primary_role) badges.add(role.primary_role);
  if (role?.secondary_role) badges.add(role.secondary_role);
  if (role?.tertiary_role) badges.add(role.tertiary_role);

  // Do NOT auto-add Founder from level — must be set via primary_role
  if (!role?.primary_role) {
    const levelRole = mapLevelToRole(role?.level);
    if (levelRole) badges.add(levelRole);
  }

  return Array.from(badges);
}

/**
 * Compute badges for a user using backend-verified roles table data
 * 
 * @param {Object} user - Supabase user object
 * @returns {Array} Array of badge objects (max 3)
 */
async function computeBadges(user) {
  const getUserBadge = window.Roles.getUserBadge;
  const getBadgeColor = window.Roles.getBadgeColor;
  
  // Get fallback badge data from backend
  const badgeInfo = await getUserBadge();

  if (!user || !user.id) {
    return [{
      type: badgeInfo.role,
      label: badgeInfo.badge,
      icon: badgeInfo.icon,
      color: badgeInfo.color
    }];
  }

  let roleData = {
    level: badgeInfo.level,
    primary_role: null,
    secondary_role: null,
    tertiary_role: null,
    custom_badges: []
  };

  if (user && user.id) {
    try {
      const supabase = await window.waitForSupabase();
      if (supabase) {
        const { data } = await supabase
          .from('roles')
          .select('level, primary_role, secondary_role, tertiary_role, custom_badges')
          .eq('user_id', user.id)
          .single();
        if (data) {
          roleData = {
            level: data.level ?? badgeInfo.level,
            primary_role: data.primary_role,
            secondary_role: data.secondary_role,
            tertiary_role: data.tertiary_role,
            custom_badges: data.custom_badges || []
          };
        }
      }
    } catch (err) {
      // Silently handle badge fetch errors
    }
  }

  const labels = getUserBadges(roleData).slice(0, 3);
  const badges = labels.map((label) => {
    if (label === 'Founder') {
      return {
        type: 'founder',
        label,
        icon: '👑',
        color: 'var(--color-warning)'
      };
    }

    const badgeType = label.toLowerCase().replace(/\s+/g, '_');
    return {
      type: badgeType,
      label,
      icon: '🏷️',
      color: getBadgeColor?.(badgeType) || 'var(--color-muted)'
    };
  });

  // Append custom_badges as pill badges
  if (Array.isArray(roleData.custom_badges)) {
    roleData.custom_badges.forEach(cb => {
      if (cb && typeof cb === 'string') {
        badges.push({
          type: 'custom',
          label: cb,
          icon: '🏅',
          color: 'var(--color-muted)'
        });
      }
    });
  }

  return badges;
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
  // Clear previous badges safely
  while (badgesSection.firstChild) {
    badgesSection.removeChild(badgesSection.firstChild);
  }

  badges.forEach(badge => {
    const div = document.createElement('div');
    div.className = 'badge badge-' + (badge.type || 'visitor');
    div.setAttribute('aria-label', (badge.label || '') + ' badge');
    div.style.borderColor = badge.color || '';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'badge-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = badge.icon || '';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'badge-label';
    labelSpan.textContent = badge.label || '';

    div.appendChild(iconSpan);
    div.appendChild(labelSpan);
    badgesSection.appendChild(div);
  });
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
   XP Level Thresholds (Cosmetic Only)
   XP does NOT control permissions.
   =============================== */
const XP_LEVELS = [
  { level: 0,   xp: 0,    title: 'Visitor' },
  { level: 5,   xp: 100,  title: 'Explorer' },
  { level: 10,  xp: 300,  title: 'Contributor' },
  { level: 25,  xp: 800,  title: 'Veteran' },
  { level: 50,  xp: 1500, title: 'Senior' },
  { level: 90,  xp: 3000, title: 'Elite' },
  { level: 100, xp: 5000, title: 'Legend' }
];

/**
 * Get XP thresholds for current and next level
 */
function getXpThresholds(currentXp) {
  let current = XP_LEVELS[0];
  let next = XP_LEVELS[1];
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (currentXp >= XP_LEVELS[i].xp) {
      current = XP_LEVELS[i];
      next = XP_LEVELS[i + 1] || XP_LEVELS[i];
      break;
    }
  }
  return { current, next };
}

/**
 * Get level ring CSS class based on XP tier
 * Ring color depends on primary_role for system roles,
 * falls back to XP tier for cosmetic display
 */
function getLevelRingClass(primaryRole, level) {
  // System role takes priority
  if (primaryRole === 'Founder') return 'ring-founder';
  if (primaryRole === 'Admin') return 'ring-admin';
  if (primaryRole === 'Senior Moderator') return 'ring-senior-moderator';
  if (primaryRole === 'Reviewer') return 'ring-reviewer';
  // Fall back to cosmetic XP tier
  if (level >= 50) return 'ring-senior';
  if (level >= 25) return 'ring-veteran';
  if (level >= 10) return 'ring-contributor';
  if (level >= 5) return 'ring-explorer';
  return 'ring-visitor';
}

/**
 * Populate profile stats from database
 */
async function populateProfileStats(user) {
  if (!user || !user.id) return;

  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) return;

    // Fetch upload stats
    const { data: statsData } = await supabase.rpc('get_user_upload_stats', {
      target_user_id: user.id
    });

    let totalUploads = 0;
    let approvedUploads = 0;
    if (statsData && statsData.length > 0) {
      totalUploads = statsData[0].total_uploads || 0;
      approvedUploads = statsData[0].approved_uploads || 0;
    }

    // Update stats in DOM
    const uploadsEl = document.querySelector('[data-field="uploads"]');
    const approvedEl = document.querySelector('[data-field="approved"]');
    const approvalPctEl = document.querySelector('[data-field="approval-pct"]');
    const contributionEl = document.querySelector('[data-field="contribution"]');

    if (uploadsEl) uploadsEl.textContent = totalUploads;
    if (approvedEl) approvedEl.textContent = approvedUploads;
    if (approvalPctEl) {
      approvalPctEl.textContent = totalUploads > 0
        ? Math.round((approvedUploads / totalUploads) * 100) + '%'
        : '0%';
    }

    // Fetch XP info
    const { data: xpData } = await supabase.rpc('get_user_xp_info', {
      target_user_id: user.id
    });

    let userXp = 0;
    let userLevel = 0;
    let userPrimaryRole = null;
    if (xpData && xpData.length > 0) {
      userXp = xpData[0].xp || 0;
      userLevel = xpData[0].level || 0;
    }

    // Fetch primary_role for ring color
    try {
      const { data: roleRow } = await supabase
        .from('roles')
        .select('primary_role')
        .eq('user_id', user.id)
        .single();
      if (roleRow) userPrimaryRole = roleRow.primary_role;
    } catch (_) {}

    // Contribution score = XP weighted metric
    if (contributionEl) contributionEl.textContent = userXp;

    // Update XP progress bar
    const xpSection = document.querySelector('.profile-xp');
    const xpBarFill = document.getElementById('xpBarFill');
    const xpCurrentEl = document.getElementById('xpCurrent');
    const xpNextEl = document.getElementById('xpNext');

    if (xpSection) xpSection.style.display = 'block';

    const { current, next } = getXpThresholds(userXp);
    if (xpCurrentEl) xpCurrentEl.textContent = userXp;
    if (xpNextEl) xpNextEl.textContent = next.xp;

    if (xpBarFill) {
      const range = next.xp - current.xp;
      const progress = range > 0 ? ((userXp - current.xp) / range) * 100 : 100;
      setTimeout(() => {
        xpBarFill.style.width = Math.min(100, Math.max(0, progress)) + '%';
      }, 100);
    }

    // Update avatar ring color class based on role/level
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) {
      // Remove all previous ring classes
      avatarEl.className = avatarEl.className.replace(/\bring-\S+/g, '').trim();
      const ringClass = getLevelRingClass(userPrimaryRole, userLevel);
      avatarEl.classList.add(ringClass);
    }

    // Update daily streak
    try {
      const { data: streakData } = await supabase.rpc('update_daily_streak');
      if (streakData && streakData.length > 0) {
        renderStreak(streakData[0].streak);
      }
    } catch (_) {
      // Streak update is optional
    }

    // Check for level up (compare with stored previous level)
    const prevLevel = parseInt(sessionStorage.getItem('examarchive_prev_level') || '0');
    if (userLevel > prevLevel && prevLevel > 0 && window.LevelUp?.show) {
      window.LevelUp.show(userLevel);
    }
    sessionStorage.setItem('examarchive_prev_level', String(userLevel));

  } catch (err) {
    // Silently handle stats fetch errors
  }
}

/**
 * Render daily streak visualization in profile panel
 * Shows 7 small circles, filled = active streak day
 * @param {number} streakCount - Current streak count
 */
function renderStreak(streakCount) {
  let streakSection = document.querySelector('.profile-streak');
  if (!streakSection) {
    streakSection = document.createElement('section');
    streakSection.className = 'profile-streak';
    const xpSection = document.querySelector('.profile-xp');
    if (xpSection && xpSection.parentNode) {
      xpSection.parentNode.insertBefore(streakSection, xpSection.nextSibling);
    }
  }

  // Normalize streakCount to a non-negative finite number
  let normalizedStreak = Number.isFinite(streakCount) ? streakCount : 0;
  if (normalizedStreak < 0) normalizedStreak = 0;

  const days = 7;
  const activeDays = Math.min(normalizedStreak, days);

  // Clear previous content safely
  while (streakSection.firstChild) {
    streakSection.removeChild(streakSection.firstChild);
  }

  // Build streak row with dots
  const rowDiv = document.createElement('div');
  rowDiv.className = 'streak-row';

  for (let i = 0; i < days; i++) {
    const isActive = i < activeDays;
    const dot = document.createElement('span');
    dot.className = 'streak-dot' + (isActive ? ' active' : '');
    dot.setAttribute('role', 'img');
    dot.setAttribute('aria-label', 'Day ' + (i + 1) + (isActive ? ' (active)' : ''));
    rowDiv.appendChild(dot);
  }

  // Fire icon when streak >= 7
  if (normalizedStreak >= 7) {
    const fireSpan = document.createElement('span');
    fireSpan.className = 'streak-fire';
    fireSpan.setAttribute('aria-label', 'Streak on fire!');
    fireSpan.textContent = '🔥';
    rowDiv.appendChild(fireSpan);
  }

  // Streak label
  const labelDiv = document.createElement('div');
  labelDiv.className = 'streak-label';
  labelDiv.textContent = normalizedStreak + ' day streak';

  streakSection.appendChild(rowDiv);
  streakSection.appendChild(labelDiv);
  streakSection.style.display = 'block';
}

/* ===============================
   State tracking for both events
   =============================== */
if (window.__PROFILE_PANEL_INIT__) {
  // Already initialized
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

    // Fetch and display upload stats + XP
    await populateProfileStats(user);

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
