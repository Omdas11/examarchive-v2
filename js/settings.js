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
    id: "font-section",
    title: "Font",
    description: "Customize text appearance",
    settings: [
      {
        id: "font-family",
        type: "select",
        label: "Font Family",
        description: "Choose your preferred font",
        options: [
          { value: "default", label: "Archive Default" },
          { value: "system", label: "System Default" }
        ]
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
    case "select":
      return createSelect(setting);
    case "toggle":
      return createToggle(setting);
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
// Select Dropdown
// ===============================

function createSelect(setting) {
  const currentValue = localStorage.getItem(setting.id) || setting.options[0].value;
  
  return `
    <div class="setting-group">
      <div class="setting-label-container">
        <p class="setting-label">${setting.label}</p>
        <p class="setting-description">${setting.description}</p>
      </div>
      <select 
        class="setting-select" 
        id="${setting.id}"
        data-setting-id="${setting.id}"
      >
        ${setting.options.map(opt => `
          <option value="${opt.value}" ${opt.value === currentValue ? 'selected' : ''}>
            ${opt.label}
          </option>
        `).join("")}
      </select>
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
  
  // Font family select
  const fontSelect = document.getElementById("font-family");
  if (fontSelect) {
    fontSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      localStorage.setItem("font-family", value);
      
      if (value === "system") {
        document.body.classList.add("font-system");
      } else {
        document.body.classList.remove("font-system");
      }
      
      console.log(`✅ Font family changed to: ${value}`);
    });
    
    // Apply saved font
    const savedFont = localStorage.getItem("font-family");
    if (savedFont === "system") {
      document.body.classList.add("font-system");
    }
  }
  
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
