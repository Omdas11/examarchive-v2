// ===============================
// Settings Page Controller
// Modular settings without auth logic
// ===============================

console.log("⚙️ settings.js loaded");

// Import shared auth utilities (no auth logic in settings)
import { handleLogout } from "./avatar-utils.js";
import { supabase } from "./supabase.js";

// ===============================
// Settings Configuration
// ===============================

const settingsConfig = [
  {
    id: "theme-section",
    title: "Theme",
    description: "Choose your preferred color scheme",
    settings: [
      {
        id: "theme",
        type: "theme-pills",
        label: "Color Theme",
        description: "Select light, dark, or AMOLED theme",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "amoled", label: "AMOLED" }
        ]
      }
    ]
  },
  {
    id: "accent-section",
    title: "Accent Color",
    description: "Customize the accent color for buttons, links, and active states",
    settings: [
      {
        id: "accent-color",
        type: "accent-pills",
        label: "Accent Color",
        description: "Choose your preferred accent color",
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
          { value: "default", label: "Archive Default" },
          { value: "system", label: "System Default" },
          { value: "serif", label: "Serif" },
          { value: "sans", label: "Sans-serif" },
          { value: "mono", label: "Monospace" }
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
    return;
  }

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

  container.innerHTML = "";

  settingsConfig.forEach(section => {
    const sectionEl = createSettingsSection(section, user);
    container.appendChild(sectionEl);
  });

  // Attach event listeners
  attachEventListeners();

  console.log("✅ Settings rendered");
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
// Theme Pills
// ===============================

function createThemePills(setting) {
  const currentTheme = localStorage.getItem("theme") || "light";
  
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
            data-theme="${opt.value}"
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
  // Theme buttons are handled by theme.js
  
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
      localStorage.setItem("accent-color", defaultAccent);
      localStorage.setItem("accent-color-preview", defaultAccent);
      document.documentElement.setAttribute("data-accent", defaultAccent);
      
      // Update UI
      document.querySelectorAll(".accent-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.accent === defaultAccent);
      });
      
      console.log(`🔄 Accent color reset to default`);
    });
  }
  
  // ========== FONT FAMILY ==========
  // Font family select with preview
  const fontSelect = document.getElementById("font-family");
  if (fontSelect) {
    fontSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      // Store as preview only
      localStorage.setItem("font-family-preview", value);
      console.log(`🔤 Font family preview: ${value}`);
    });
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
      localStorage.setItem("font-family", defaultFont);
      localStorage.setItem("font-family-preview", defaultFont);
      
      // Remove font classes
      document.body.className = document.body.className.replace(/font-\w+/g, '');
      
      // Update select
      if (fontSelect) fontSelect.value = defaultFont;
      
      console.log(`🔄 Font family reset to default`);
    });
  }
  
  // Apply saved font on load
  const savedFont = localStorage.getItem("font-family") || "default";
  if (savedFont !== "default") {
    document.body.classList.add(`font-${savedFont}`);
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
      
      // Re-render to update dependent controls
      renderSettings();
      
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
  
  // Sign out button (uses shared auth helper)
  const signOutBtn = document.getElementById("sign-out");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      console.log("🚪 Sign out clicked");
      await handleLogout();
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
supabase.auth.onAuthStateChange(() => {
  console.log("🔔 Auth state changed, re-rendering settings");
  renderSettings();
});
