// ===============================
// Settings Page Controller
// Phase 9.2: Added debug panel controls
// Phase 9.2.3 - Converted to Classic JS (NO IMPORTS)
// ===============================

console.log("⚙️ settings.js loaded");

// ===============================
// Settings Configuration
// ===============================

const settingsConfig = [
  {
    id: "theme-section",
    title: "Theme",
    description: "Choose your preferred theme with unique backgrounds and colors",
    settings: [
      {
        id: "theme-preset",
        type: "theme-preset-grid",
        label: "Theme Preset",
        description: "Each theme includes background, cards, and harmonized accent colors",
        options: [
          { value: "red-classic", label: "Red Classic", desc: "Default ExamArchive look" },
          { value: "blue-slate", label: "Blue Slate", desc: "Cool professional blue" },
          { value: "green-mint", label: "Green Mint", desc: "Fresh and natural" },
          { value: "purple-nebula", label: "Purple Nebula", desc: "Deep cosmic purple" },
          { value: "amber-warm", label: "Amber Warm", desc: "Warm and inviting" },
          { value: "mono-gray", label: "Mono Gray", desc: "Minimal grayscale" },
          { value: "glass-light", label: "Glass Light", desc: "Transparent light" },
          { value: "glass-dark", label: "Glass Dark", desc: "Transparent dark" }
        ]
      },
      {
        id: "theme-mode",
        type: "theme-pills",
        label: "Theme Mode",
        description: "Override the base brightness for current theme",
        options: [
          { value: "auto", label: "Auto" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "amoled", label: "AMOLED" }
        ]
      }
    ]
  },
  {
    id: "accent-section",
    title: "Accent Color (Legacy)",
    description: "Fine-tune accent color - use Theme Presets above for coordinated looks",
    settings: [
      {
        id: "accent-color",
        type: "accent-pills",
        label: "Accent Color",
        description: "Choose your preferred accent color (overrides theme preset accent)",
        options: [
          { value: "red", label: "Red" },
          { value: "blue", label: "Blue" },
          { value: "green", label: "Green" },
          { value: "purple", label: "Purple" },
          { value: "amber", label: "Amber" },
          { value: "mono", label: "Mono" }
        ]
      }
    ]
  },
  {
    id: "font-section",
    title: "Font",
    description: "Customize text appearance",
    settings: [
      {
        id: "font-family",
        type: "select",
        label: "Font Family",
        description: "Choose your preferred font",
        requiresApply: true,
        options: [
          { value: "default", label: "Archive Default (System)" },
          { value: "system", label: "System Default" },
          { value: "academic-serif", label: "Academic Serif (Crimson)" },
          { value: "clean-sans", label: "Clean Sans (Inter)" },
          { value: "reading-sans", label: "Reading Sans (Source)" },
          { value: "monospace", label: "Monospace (Code)" }
        ]
      }
    ]
  },
  {
    id: "glass-section",
    title: "Glass UI Effects",
    description: "Optional visual effects for a modern look",
    settings: [
      {
        id: "glass-enabled",
        type: "toggle",
        label: "Enable Glass Effect",
        description: "Semi-transparent surfaces with backdrop blur"
      },
      {
        id: "glass-blur",
        type: "range",
        label: "Blur Intensity",
        description: "Control the backdrop blur strength",
        min: 0,
        max: 30,
        step: 2,
        unit: "px",
        default: 10,
        dependsOn: "glass-enabled"
      },
      {
        id: "glass-opacity",
        type: "range",
        label: "Transparency",
        description: "Control surface transparency",
        min: 0,
        max: 30,
        step: 5,
        unit: "%",
        default: 10,
        dependsOn: "glass-enabled"
      },
      {
        id: "glass-shadow-softness",
        type: "range",
        label: "Shadow Softness",
        description: "Adjust shadow intensity",
        min: 0,
        max: 50,
        step: 5,
        unit: "%",
        default: 15,
        dependsOn: "glass-enabled"
      }
    ]
  },
  {
    id: "night-mode-section",
    title: "Night Mode",
    description: "Warm filter to reduce eye strain and blue light",
    settings: [
      {
        id: "night-mode",
        type: "toggle",
        label: "Enable Night Mode",
        description: "Apply warm, low-contrast filter (independent of theme)"
      },
      {
        id: "night-strength",
        type: "range",
        label: "Night Mode Strength",
        description: "Adjust warmth and filter intensity",
        min: 0,
        max: 100,
        step: 10,
        unit: "%",
        default: 50,
        dependsOn: "night-mode"
      }
    ]
  },
  {
    id: "accessibility-section",
    title: "Accessibility",
    description: "Improve readability and reduce distractions",
    settings: [
      {
        id: "high-contrast",
        type: "toggle",
        label: "High Contrast",
        description: "Increase contrast for better readability"
      },
      {
        id: "reduced-motion",
        type: "toggle",
        label: "Reduced Motion",
        description: "Minimize animations and transitions"
      }
    ]
  },
  {
    id: "debug-section",
    title: "Debug Panel (Admin Only)",
    description: "Diagnostic tools for administrators and reviewers",
    requiresAdmin: true,
    settings: [
      {
        id: "debug-panel-enabled",
        type: "toggle",
        label: "Enable Debug Panel",
        description: "Show debug panel with system diagnostics"
      },
      {
        id: "clear-debug-logs",
        type: "button",
        label: "Clear Debug Logs",
        buttonText: "Clear Logs",
        buttonClass: "btn-outline"
      },
      {
        id: "reset-demo-data",
        type: "button",
        label: "Reset Upload Demo Data",
        buttonText: "Reset Demo Data",
        buttonClass: "btn-outline-red"
      }
    ]
  },
  {
    id: "account-section",
    title: "Account",
    description: "Manage your account",
    settings: [
      {
        id: "account-info",
        type: "account-info",
        label: "Account Information"
      },
      {
        id: "sign-out",
        type: "button",
        label: "Sign Out",
        buttonText: "Sign out",
        buttonClass: "btn-outline-red",
        requiresAuth: true
      }
    ]
  }
];

// ===============================
// Render Settings
// ===============================

async function renderSettings() {
  const container = document.getElementById("settings-container");
  if (!container) {
    console.error("❌ Settings container not found");
    window.Debug.logError(window.Debug.DebugModule.SYSTEM, 'Settings container element not found in DOM');
    return;
  }

  window.Debug.logInfo(window.Debug.DebugModule.SETTINGS, 'Starting settings page render, checking session...');

  // CRITICAL: Wait for session to be ready before rendering
  const { data: { session }, error: sessionError } = await window.__supabase__.auth.getSession();
  
  if (sessionError) {
    window.Debug.logError(window.Debug.DebugModule.AUTH, 'Session error during settings load', { error: sessionError.message });
    renderErrorMessage(container, 'Session Error', 'There was an error checking your session. Please try refreshing the page.');
    return;
  }

  // Check if user is signed in
  if (!session) {
    window.Debug.logWarn(window.Debug.DebugModule.SETTINGS, 'Settings hidden: no active session');
    renderSignedOutMessage(container);
    return;
  }

  window.Debug.logInfo(window.Debug.DebugModule.AUTH, 'Session verified, checking user role...', { userId: session.user.id });

  const user = session.user;
  
  // Backend role verification - MANDATORY before rendering settings
  const roleInfo = await window.AdminAuth.getUserRoleBackend(user.id);
  
  if (!roleInfo) {
    window.Debug.logError(window.Debug.DebugModule.ROLE, 'Failed to retrieve user role from backend');
    renderErrorMessage(container, 'Error Loading Settings', 'Unable to verify your permissions. Please try refreshing the page.');
    return;
  }

  window.Debug.logInfo(window.Debug.DebugModule.ROLE, 'User role verified', { role: roleInfo.name, level: roleInfo.level });

  // Check if user has appropriate role (admin or reviewer can see settings)
  const isAdmin = roleInfo.name === 'admin' || roleInfo.name === 'reviewer';
  
  if (!isAdmin) {
    window.Debug.logWarn(window.Debug.DebugModule.SETTINGS, 'Settings hidden: role check failed', { role: roleInfo.name });
    renderAccessDenied(container);
    return;
  }

  window.Debug.logInfo(window.Debug.DebugModule.SETTINGS, 'Rendering settings UI for authorized user');

  container.innerHTML = "";

  settingsConfig.forEach(section => {
    // Skip admin-only sections if user is not admin
    if (section.requiresAdmin && !isAdmin) {
      return;
    }
    
    const sectionEl = createSettingsSection(section, user);
    container.appendChild(sectionEl);
  });

  // Attach event listeners
  attachEventListeners();

  window.Debug.logInfo(window.Debug.DebugModule.SETTINGS, 'Settings UI rendered successfully');
  console.log("✅ Settings rendered");
}

// ===============================
// Fallback UI Messages
// ===============================

/**
 * Render message for signed-out users
 */
function renderSignedOutMessage(container) {
  const card = document.createElement('div');
  card.className = 'settings-card';
  card.style.cssText = 'text-align: center; padding: 3rem 2rem;';

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size: 3rem; margin-bottom: 1rem;';
  icon.textContent = '🔒';

  const heading = document.createElement('h2');
  heading.style.marginBottom = '1rem';
  heading.textContent = 'Sign In Required';

  const message = document.createElement('p');
  message.className = 'text-muted';
  message.style.marginBottom = '2rem';
  message.textContent = 'Please sign in to access the settings page.';

  const signInLink = document.createElement('a');
  signInLink.href = '/login.html';
  signInLink.className = 'btn btn-red';
  signInLink.textContent = 'Sign In';

  card.appendChild(icon);
  card.appendChild(heading);
  card.appendChild(message);
  card.appendChild(signInLink);

  container.innerHTML = '';
  container.appendChild(card);
}

/**
 * Render message for users without permission
 */
function renderAccessDenied(container) {
  const card = document.createElement('div');
  card.className = 'settings-card';
  card.style.cssText = 'text-align: center; padding: 3rem 2rem;';

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size: 3rem; margin-bottom: 1rem;';
  icon.textContent = '⛔';

  const heading = document.createElement('h2');
  heading.style.marginBottom = '1rem';
  heading.textContent = 'Access Denied';

  const message1 = document.createElement('p');
  message1.className = 'text-muted';
  message1.style.marginBottom = '1.5rem';
  message1.textContent = 'You do not have permission to view this page.';

  const message2 = document.createElement('p');
  message2.className = 'text-muted';
  message2.style.fontSize = '0.9rem';
  message2.textContent = 'This page is only accessible to administrators and reviewers.';

  card.appendChild(icon);
  card.appendChild(heading);
  card.appendChild(message1);
  card.appendChild(message2);

  container.innerHTML = '';
  container.appendChild(card);
}

/**
 * Render generic error message
 */
function renderErrorMessage(container, title, message) {
  // Create elements safely to prevent XSS
  const card = document.createElement('div');
  card.className = 'settings-card';
  card.style.cssText = 'text-align: center; padding: 3rem 2rem;';

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size: 3rem; margin-bottom: 1rem;';
  icon.textContent = '⚠️';

  const heading = document.createElement('h2');
  heading.style.marginBottom = '1rem';
  heading.textContent = title;

  const messageP = document.createElement('p');
  messageP.className = 'text-muted';
  messageP.style.marginBottom = '2rem';
  messageP.textContent = message;

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'btn btn-outline';
  refreshBtn.textContent = 'Refresh Page';
  refreshBtn.addEventListener('click', () => location.reload());

  card.appendChild(icon);
  card.appendChild(heading);
  card.appendChild(messageP);
  card.appendChild(refreshBtn);

  container.innerHTML = '';
  container.appendChild(card);
}

// ===============================
// Create Settings Section
// ===============================

function createSettingsSection(section, user) {
  const sectionEl = document.createElement("div");
  sectionEl.className = "settings-card";
  sectionEl.id = section.id;

  let html = `
    <h2>${section.title}</h2>
    <p class="text-muted">${section.description}</p>
  `;

  section.settings.forEach(setting => {
    // Skip auth-required settings if not logged in
    if (setting.requiresAuth && !user) {
      return;
    }

    html += createSettingElement(setting, user);
  });

  sectionEl.innerHTML = html;
  return sectionEl;
}

// ===============================
// Create Setting Element
// ===============================

function createSettingElement(setting, user) {
  switch (setting.type) {
    case "theme-preset-grid":
      return createThemePresetGrid(setting);
    case "theme-pills":
      return createThemePills(setting);
    case "accent-pills":
      return createAccentPills(setting);
    case "select":
      return createSelect(setting);
    case "toggle":
      return createToggle(setting);
    case "range":
      return createRange(setting);
    case "account-info":
      return createAccountInfo(user);
    case "button":
      return createButton(setting);
    default:
      return "";
  }
}

// ===============================
// Theme Preset Grid
// ===============================

function createThemePresetGrid(setting) {
  const currentPreset = localStorage.getItem("theme-preset") || "red-classic";
  
  return `
    <div class="setting-group" style="flex-direction: column; align-items: stretch;">
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
        <p class="setting-description">${setting.description}</p>
      </div>
      <div class="theme-preset-grid">
        ${setting.options.map(opt => `
          <button 
            class="theme-preset-card ${opt.value === currentPreset ? 'active' : ''}"
            data-preset="${opt.value}"
            title="${opt.desc}"
          >
            <div class="preset-preview" data-preset="${opt.value}"></div>
            <div class="preset-info">
              <span class="preset-name">${opt.label}</span>
              <span class="preset-desc">${opt.desc}</span>
            </div>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

// ===============================
// Theme Pills
// ===============================

function createThemePills(setting) {
  const currentTheme = localStorage.getItem("theme-mode") || "auto";
  
  return `
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
        <p class="setting-description">${setting.description}</p>
      </div>
      <div class="theme-options">
        ${setting.options.map(opt => `
          <button 
            class="settings-theme-btn ${opt.value === currentTheme ? 'active' : ''}"
            data-theme-mode="${opt.value}"
          >
            ${opt.label}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

// ===============================
// Accent Pills
// ===============================

function createAccentPills(setting) {
  const currentAccent = localStorage.getItem("accent-color") || "red";
  const previewAccent = localStorage.getItem("accent-color-preview") || currentAccent;
  
  return `
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
        <p class="setting-description">${setting.description}</p>
      </div>
      <div class="accent-options">
        ${setting.options.map(opt => `
          <button 
            class="accent-btn ${opt.value === previewAccent ? 'active' : ''}"
            data-accent="${opt.value}"
            title="${opt.label}"
          >
            <span class="accent-color-preview" data-color="${opt.value}"></span>
          </button>
        `).join("")}
      </div>
    </div>
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-description">Changes are previewed live but need to be applied</p>
      </div>
      <div class="accent-actions">
        <button class="btn btn-outline" id="reset-accent-btn">Reset to Default</button>
        <button class="btn btn-primary" id="apply-accent-btn">Apply Changes</button>
      </div>
    </div>
  `;
}

// ===============================
// Select Dropdown
// ===============================

function createSelect(setting) {
  const currentValue = localStorage.getItem(setting.id) || setting.options[0].value;
  const previewValue = setting.requiresApply 
    ? (localStorage.getItem(`${setting.id}-preview`) || currentValue)
    : currentValue;
  
  let html = `
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
        <p class="setting-description">${setting.description}</p>
      </div>
      <select 
        class="setting-select" 
        id="${setting.id}"
        data-setting-id="${setting.id}"
        ${setting.requiresApply ? 'data-requires-apply="true"' : ''}
      >
        ${setting.options.map(opt => `
          <option value="${opt.value}" ${opt.value === previewValue ? 'selected' : ''}>
            ${opt.label}
          </option>
        `).join("")}
      </select>
    </div>
  `;
  
  if (setting.requiresApply) {
    html += `
      <div class="setting-group">
        <div class="setting-label-container">
          <p class="setting-description">Changes will be applied after clicking Apply Changes</p>
        </div>
        <div class="font-actions">
          <button class="btn btn-outline" id="reset-font-btn">Reset to Default</button>
          <button class="btn btn-primary" id="apply-font-btn">Apply Changes</button>
        </div>
      </div>
    `;
  }
  
  return html;
}

// ===============================
// Range Slider
// ===============================

function createRange(setting) {
  const currentValue = localStorage.getItem(setting.id) || setting.default || setting.min;
  const isDisabled = setting.dependsOn && localStorage.getItem(setting.dependsOn) !== "true";
  
  return `
    <div class="setting-group" ${isDisabled ? 'style="opacity: 0.5;"' : ''}>
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
        <p class="setting-description">${setting.description}</p>
      </div>
      <div class="setting-range-container">
        <input 
          type="range" 
          class="setting-range" 
          id="${setting.id}"
          data-setting-id="${setting.id}"
          min="${setting.min}"
          max="${setting.max}"
          step="${setting.step || 1}"
          value="${currentValue}"
          ${isDisabled ? 'disabled' : ''}
        >
        <span class="range-value" id="${setting.id}-value">${currentValue}${setting.unit || ''}</span>
      </div>
    </div>
  `;
}

// ===============================
// Toggle Switch
// ===============================

function createToggle(setting) {
  const isChecked = localStorage.getItem(setting.id) === "true";
  
  return `
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
        <p class="setting-description">${setting.description}</p>
      </div>
      <label class="setting-toggle">
        <input 
          type="checkbox" 
          id="${setting.id}"
          data-setting-id="${setting.id}"
          ${isChecked ? 'checked' : ''}
        >
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
}

// ===============================
// Account Info
// ===============================

function createAccountInfo(user) {
  if (!user) {
    return `
      <div class="setting-group">
        <div class="setting-label-container">
          <p class="setting-label">Not signed in</p>
          <p class="setting-description">Sign in to manage your account</p>
        </div>
      </div>
    `;
  }

  const fullName = user.user_metadata?.full_name || "";
  const email = user.email || "";

  return `
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-label">${fullName || email}</p>
        <p class="setting-description">${fullName ? email : "Signed in"}</p>
      </div>
    </div>
  `;
}

// ===============================
// Button
// ===============================

function createButton(setting) {
  return `
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
      </div>
      <button 
        class="btn ${setting.buttonClass || 'btn-outline'}"
        id="${setting.id}"
        data-action="${setting.id}"
      >
        ${setting.buttonText}
      </button>
    </div>
  `;
}

// ===============================
// Attach Event Listeners
// ===============================

function attachEventListeners() {
  // ========== THEME PRESETS ==========
  // Theme preset cards
  document.querySelectorAll(".theme-preset-card").forEach(card => {
    card.addEventListener("click", (e) => {
      const preset = card.dataset.preset;
      
      // Update active state
      document.querySelectorAll(".theme-preset-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      
      // Apply theme preset
      localStorage.setItem("theme-preset", preset);
      applyThemePreset(preset);
      
      console.log(`🎨 Theme preset applied: ${preset}`);
    });
  });
  
  // Theme mode buttons (auto/light/dark/amoled)
  document.querySelectorAll(".settings-theme-btn[data-theme-mode]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const mode = btn.dataset.themeMode;
      
      // Update active state
      document.querySelectorAll(".settings-theme-btn[data-theme-mode]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Apply theme mode (saves to localStorage)
      applyThemeMode(mode);
      
      console.log(`🌓 Theme mode applied: ${mode}`);
    });
  });
  
  // Theme buttons are handled by theme.js (legacy header support)
  
  // ========== ACCENT COLOR ==========
  // Accent color preview (live preview as user clicks)
  document.querySelectorAll(".accent-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const accent = btn.dataset.accent;
      
      // Update preview in localStorage
      localStorage.setItem("accent-color-preview", accent);
      
      // Apply preview to DOM immediately
      document.documentElement.setAttribute("data-accent", accent);
      
      // Update active state
      document.querySelectorAll(".accent-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      console.log(`🎨 Accent color preview: ${accent}`);
    });
  });
  
  // Apply accent color button
  const applyAccentBtn = document.getElementById("apply-accent-btn");
  if (applyAccentBtn) {
    applyAccentBtn.addEventListener("click", () => {
      const previewAccent = localStorage.getItem("accent-color-preview") || "red";
      localStorage.setItem("accent-color", previewAccent);
      console.log(`✅ Accent color applied: ${previewAccent}`);
      
      // Show feedback
      applyAccentBtn.textContent = "Applied!";
      setTimeout(() => {
        applyAccentBtn.textContent = "Apply Changes";
      }, 1500);
    });
  }
  
  // Reset accent color button
  const resetAccentBtn = document.getElementById("reset-accent-btn");
  if (resetAccentBtn) {
    resetAccentBtn.addEventListener("click", () => {
      const defaultAccent = "red";
      localStorage.setItem("accent-color-preview", defaultAccent);
      document.documentElement.setAttribute("data-accent", defaultAccent);
      
      // Update UI
      document.querySelectorAll(".accent-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.accent === defaultAccent);
      });
      
      console.log(`🔄 Accent color reset to default (preview only - click Apply to persist)`);
    });
  }
  
  // ========== FONT FAMILY ==========
  // Font family select with preview
  const fontSelect = document.getElementById("font-family");
  if (fontSelect) {
    fontSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      
      // Apply preview immediately to body
      document.body.className = document.body.className.replace(/font-\w+/g, '');
      if (value !== "default") {
        document.body.classList.add(`font-${value}`);
      }
      
      // Store as preview only
      localStorage.setItem("font-family-preview", value);
      console.log(`🔤 Font family preview: ${value}`);
    });
    
    // Apply saved preview on load
    const previewFont = localStorage.getItem("font-family-preview") || localStorage.getItem("font-family") || "default";
    if (previewFont !== "default") {
      document.body.classList.add(`font-${previewFont}`);
    }
  }
  
  // Apply font button
  const applyFontBtn = document.getElementById("apply-font-btn");
  if (applyFontBtn) {
    applyFontBtn.addEventListener("click", () => {
      const previewFont = localStorage.getItem("font-family-preview") || "default";
      localStorage.setItem("font-family", previewFont);
      
      // Apply font class
      document.body.className = document.body.className.replace(/font-\w+/g, '');
      if (previewFont !== "default") {
        document.body.classList.add(`font-${previewFont}`);
      }
      
      console.log(`✅ Font family applied: ${previewFont}`);
      
      // Show feedback
      applyFontBtn.textContent = "Applied!";
      setTimeout(() => {
        applyFontBtn.textContent = "Apply Changes";
      }, 1500);
    });
  }
  
  // Reset font button
  const resetFontBtn = document.getElementById("reset-font-btn");
  if (resetFontBtn) {
    resetFontBtn.addEventListener("click", () => {
      const defaultFont = "default";
      localStorage.setItem("font-family-preview", defaultFont);
      
      // Update select
      if (fontSelect) fontSelect.value = defaultFont;
      
      console.log(`🔄 Font family reset to default (preview only - click Apply to persist)`);
    });
  }
  
  // ========== GLASS UI ==========
  // Glass enabled toggle
  const glassEnabledToggle = document.getElementById("glass-enabled");
  if (glassEnabledToggle) {
    glassEnabledToggle.addEventListener("change", (e) => {
      const isEnabled = e.target.checked;
      localStorage.setItem("glass-enabled", isEnabled);
      
      if (isEnabled) {
        document.body.classList.add("glass-enabled");
      } else {
        document.body.classList.remove("glass-enabled");
      }
      
      // Update dependent controls disabled state
      const glassBlurRange = document.getElementById("glass-blur");
      const glassOpacityRange = document.getElementById("glass-opacity");
      const glassShadowRange = document.getElementById("glass-shadow-softness");
      
      [glassBlurRange, glassOpacityRange, glassShadowRange].forEach(control => {
        if (control) {
          control.disabled = !isEnabled;
          control.parentElement.parentElement.style.opacity = isEnabled ? '1' : '0.5';
        }
      });
      
      console.log(`✨ Glass effect ${isEnabled ? "enabled" : "disabled"}`);
    });
    
    // Apply saved preference
    if (localStorage.getItem("glass-enabled") === "true") {
      document.body.classList.add("glass-enabled");
    }
  }
  
  // Glass blur intensity
  const glassBlurRange = document.getElementById("glass-blur");
  if (glassBlurRange) {
    glassBlurRange.addEventListener("input", (e) => {
      const value = e.target.value;
      localStorage.setItem("glass-blur", value);
      document.documentElement.style.setProperty("--glass-blur", `${value}px`);
      document.getElementById("glass-blur-value").textContent = `${value}px`;
    });
    
    // Apply saved value
    const savedBlur = localStorage.getItem("glass-blur") || "10";
    document.documentElement.style.setProperty("--glass-blur", `${savedBlur}px`);
  }
  
  // Glass opacity
  const glassOpacityRange = document.getElementById("glass-opacity");
  if (glassOpacityRange) {
    glassOpacityRange.addEventListener("input", (e) => {
      const value = e.target.value;
      localStorage.setItem("glass-opacity", value);
      document.documentElement.style.setProperty("--glass-opacity", value / 100);
      document.getElementById("glass-opacity-value").textContent = `${value}%`;
    });
    
    // Apply saved value
    const savedOpacity = localStorage.getItem("glass-opacity") || "10";
    document.documentElement.style.setProperty("--glass-opacity", savedOpacity / 100);
  }
  
  // Glass shadow softness
  const glassShadowRange = document.getElementById("glass-shadow-softness");
  if (glassShadowRange) {
    glassShadowRange.addEventListener("input", (e) => {
      const value = e.target.value;
      localStorage.setItem("glass-shadow-softness", value);
      document.documentElement.style.setProperty("--glass-shadow-softness", value / 100);
      document.getElementById("glass-shadow-softness-value").textContent = `${value}%`;
    });
    
    // Apply saved value
    const savedShadow = localStorage.getItem("glass-shadow-softness") || "15";
    document.documentElement.style.setProperty("--glass-shadow-softness", savedShadow / 100);
  }
  
  // ========== NIGHT MODE ==========
  // Night mode toggle
  const nightModeToggle = document.getElementById("night-mode");
  if (nightModeToggle) {
    nightModeToggle.addEventListener("change", (e) => {
      const isEnabled = e.target.checked;
      localStorage.setItem("night-mode", isEnabled.toString());
      
      if (isEnabled) {
        document.body.setAttribute("data-night", "on");
      } else {
        document.body.removeAttribute("data-night");
      }
      
      // Update dependent controls disabled state
      const nightStrengthRange = document.getElementById("night-strength");
      if (nightStrengthRange) {
        nightStrengthRange.disabled = !isEnabled;
        nightStrengthRange.parentElement.parentElement.style.opacity = isEnabled ? '1' : '0.5';
      }
      
      console.log(`🌙 Night mode ${isEnabled ? "enabled" : "disabled"}`);
    });
    
    // Apply saved preference
    const savedNightMode = localStorage.getItem("night-mode") === "true";
    if (savedNightMode) {
      nightModeToggle.checked = true;
      document.body.setAttribute("data-night", "on");
    }
    
    // Initialize dependent controls disabled state
    const nightStrengthRange = document.getElementById("night-strength");
    if (nightStrengthRange) {
      nightStrengthRange.disabled = !savedNightMode;
      nightStrengthRange.parentElement.parentElement.style.opacity = savedNightMode ? '1' : '0.5';
    }
  }
  
  // Night mode strength
  const nightStrengthRange = document.getElementById("night-strength");
  if (nightStrengthRange) {
    nightStrengthRange.addEventListener("input", (e) => {
      const value = e.target.value;
      localStorage.setItem("nightStrength", value);
      document.body.style.setProperty("--night-filter-strength", value / 100);
      document.getElementById("night-strength-value").textContent = `${value}%`;
    });
    
    // Apply saved value
    const savedStrength = localStorage.getItem("nightStrength") || "50";
    document.body.style.setProperty("--night-filter-strength", savedStrength / 100);
  }
  
  // ========== ACCESSIBILITY ==========
  // High contrast toggle
  const highContrastToggle = document.getElementById("high-contrast");
  if (highContrastToggle) {
    highContrastToggle.addEventListener("change", (e) => {
      const isEnabled = e.target.checked;
      localStorage.setItem("high-contrast", isEnabled);
      
      if (isEnabled) {
        document.body.classList.add("high-contrast");
      } else {
        document.body.classList.remove("high-contrast");
      }
      
      console.log(`✅ High contrast ${isEnabled ? "enabled" : "disabled"}`);
    });
    
    // Apply saved preference
    if (localStorage.getItem("high-contrast") === "true") {
      document.body.classList.add("high-contrast");
    }
  }
  
  // Reduced motion toggle
  const reducedMotionToggle = document.getElementById("reduced-motion");
  if (reducedMotionToggle) {
    reducedMotionToggle.addEventListener("change", (e) => {
      const isEnabled = e.target.checked;
      localStorage.setItem("reduced-motion", isEnabled);
      
      if (isEnabled) {
        document.body.classList.add("reduced-motion");
      } else {
        document.body.classList.remove("reduced-motion");
      }
      
      console.log(`✅ Reduced motion ${isEnabled ? "enabled" : "disabled"}`);
    });
    
    // Apply saved preference
    if (localStorage.getItem("reduced-motion") === "true") {
      document.body.classList.add("reduced-motion");
    }
  }
  
  // ========== DEBUG PANEL (ADMIN ONLY) ==========
  // Debug panel toggle
  const debugPanelToggle = document.getElementById("debug-panel-enabled");
  if (debugPanelToggle) {
    debugPanelToggle.addEventListener("change", (e) => {
      const isEnabled = e.target.checked;
      
      if (isEnabled) {
        window.Debug.debugLogger.enablePanel();
        window.Debug.togglePanel(); // Show panel
      } else {
        window.Debug.debugLogger.disablePanel();
        window.Debug.togglePanel(); // Hide panel
      }
      
      console.log(`🐛 Debug panel ${isEnabled ? "enabled" : "disabled"}`);
    });
    
    // Apply saved preference
    if (localStorage.getItem("debug-panel-enabled") === "true") {
      debugPanelToggle.checked = true;
    }
  }
  
  // Clear debug logs button
  const clearDebugBtn = document.getElementById("clear-debug-logs");
  if (clearDebugBtn) {
    clearDebugBtn.addEventListener("click", () => {
      window.Debug.debugLogger.clear();
      console.log("🗑️ Debug logs cleared");
      
      // Show feedback
      clearDebugBtn.textContent = "Cleared!";
      setTimeout(() => {
        clearDebugBtn.textContent = "Clear Logs";
      }, 1500);
    });
  }
  
  // Reset demo data button
  const resetDemoBtn = document.getElementById("reset-demo-data");
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to reset all demo upload data? This will delete all pending/approved/rejected submissions.")) {
        return;
      }
      
      try {
        resetDemoBtn.disabled = true;
        resetDemoBtn.textContent = "Resetting...";
        
        // Delete all submissions (admin only - protected by RLS)
        const { error } = await window.__supabase__
          .from('submissions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (error) {
          throw error;
        }
        
        console.log("✅ Demo data reset successful");
        resetDemoBtn.textContent = "Reset Complete!";
        
        setTimeout(() => {
          resetDemoBtn.disabled = false;
          resetDemoBtn.textContent = "Reset Demo Data";
        }, 2000);
      } catch (err) {
        console.error("❌ Error resetting demo data:", err);
        alert("Failed to reset demo data: " + err.message);
        resetDemoBtn.disabled = false;
        resetDemoBtn.textContent = "Reset Demo Data";
      }
    });
  }
  
  // Sign out button (uses shared auth helper)
  const signOutBtn = document.getElementById("sign-out");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      console.log("🚪 Sign out clicked");
      await window.AvatarUtils.handleLogout();
    });
  }
}

// ===============================
// Initialize
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  renderSettings();
});

// Re-render on auth state change
window.__supabase__.auth.onAuthStateChange(() => {
  console.log("🔔 Auth state changed, re-rendering settings");
  renderSettings();
});

// ===============================
// Theme Preset System (GLOBAL)
// ===============================

function applyThemePreset(preset) {
  document.body.setAttribute("data-theme-preset", preset);
  localStorage.setItem("theme-preset", preset);
  
  // Each preset defines its own background, card, and accent colors
  // CSS will handle the actual color values
  console.log(`✅ Theme preset ${preset} applied globally`);
}

function applyThemeMode(mode) {
  localStorage.setItem("theme-mode", mode);
  
  if (mode === "auto") {
    // Detect system preference
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    document.body.setAttribute("data-theme", mode);
  }
  console.log(`✅ Theme mode ${mode} applied globally`);
}

// Initialize theme preset and mode on page load
// (Already applied in common.js, just sync UI here)
document.addEventListener("DOMContentLoaded", () => {
  const savedPreset = localStorage.getItem("theme-preset") || "red-classic";
  const savedMode = localStorage.getItem("theme-mode") || "auto";
  
  // Theme is already applied by common.js, no need to reapply
  console.log(`Theme preset: ${savedPreset}, Theme mode: ${savedMode}`);
});
