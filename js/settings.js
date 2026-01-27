/* ================================
   Dynamic Settings System
   ================================ */

// Settings Configuration
const SETTINGS_CONFIG = {
  appearance: {
    title: "Appearance",
    description: "Customize the look and feel of ExamArchive",
    settings: [
      {
        id: "theme",
        label: "Theme",
        description: "Choose your preferred color scheme",
        type: "select",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "amoled", label: "AMOLED" }
        ],
        default: "light",
        storage: "localStorage",
        onChange: (value) => {
          document.body.setAttribute("data-theme", value);
          localStorage.setItem("theme", value);
        }
      },
      {
        id: "nightMode",
        label: "Night Mode",
        description: "Reduce blue light for comfortable reading at night",
        type: "toggle",
        default: false,
        storage: "localStorage",
        onChange: (enabled) => {
          document.body.setAttribute("data-night", enabled ? "on" : "off");
          localStorage.setItem("night", enabled ? "on" : "off");
        }
      },
      {
        id: "nightStrength",
        label: "Night Mode Warmth",
        description: "Adjust the warmth of night mode",
        type: "range",
        min: 0,
        max: 60,
        step: 1,
        default: 8,
        storage: "localStorage",
        dependsOn: "nightMode",
        onChange: (value) => {
          document.documentElement.style.setProperty("--night-strength", value);
          localStorage.setItem("nightStrength", value);
        }
      },
      {
        id: "accentColor",
        label: "Accent Color",
        description: "Choose your preferred accent color",
        type: "select",
        options: [
          { value: "#d32f2f", label: "Red (Default)" },
          { value: "#1976d2", label: "Blue" },
          { value: "#388e3c", label: "Green" },
          { value: "#f57c00", label: "Orange" },
          { value: "#7b1fa2", label: "Purple" }
        ],
        default: "#d32f2f",
        storage: "localStorage",
        onChange: (value) => {
          document.documentElement.style.setProperty("--red", value);
          localStorage.setItem("accentColor", value);
        }
      }
    ]
  },
  profile: {
    title: "Profile",
    description: "Manage your profile information",
    settings: [
      {
        id: "displayName",
        label: "Display Name",
        description: "Your name as shown to others",
        type: "text",
        default: "",
        storage: "appwrite",
        requiresAuth: true,
        onChange: async (value) => {
          if (window.AppwriteAuth) {
            const prefs = await window.AppwriteAuth.getUserPrefs();
            prefs.displayName = value;
            await window.AppwriteAuth.updateUserPrefs(prefs);
          }
        }
      },
      {
        id: "avatarUrl",
        label: "Avatar URL",
        description: "Custom avatar image URL",
        type: "text",
        default: "",
        storage: "appwrite",
        requiresAuth: true,
        placeholder: "https://example.com/avatar.jpg",
        onChange: async (value) => {
          if (window.AppwriteAuth) {
            const prefs = await window.AppwriteAuth.getUserPrefs();
            prefs.avatarUrl = value;
            await window.AppwriteAuth.updateUserPrefs(prefs);
            
            // Refresh avatar display
            const user = await window.AppwriteAuth.getCurrentUser();
            if (user) {
              window.AppwriteAuth.applyAuthState(user, prefs);
            }
          }
        }
      }
    ]
  },
  accessibility: {
    title: "Accessibility",
    description: "Make ExamArchive more accessible",
    settings: [
      {
        id: "highContrast",
        label: "High Contrast",
        description: "Increase contrast for better readability",
        type: "toggle",
        default: false,
        storage: "localStorage",
        onChange: (enabled) => {
          document.body.classList.toggle("high-contrast", enabled);
          localStorage.setItem("highContrast", enabled ? "true" : "false");
        }
      },
      {
        id: "reducedMotion",
        label: "Reduced Motion",
        description: "Minimize animations and transitions",
        type: "toggle",
        default: false,
        storage: "localStorage",
        onChange: (enabled) => {
          document.body.classList.toggle("reduced-motion", enabled);
          localStorage.setItem("reducedMotion", enabled ? "true" : "false");
        }
      }
    ]
  },
  privacy: {
    title: "Privacy",
    description: "Control your data and privacy",
    settings: [
      {
        id: "rememberLogin",
        label: "Remember Login",
        description: "Stay signed in on this device",
        type: "toggle",
        default: true,
        storage: "localStorage",
        onChange: (enabled) => {
          localStorage.setItem("rememberLogin", enabled ? "true" : "false");
        }
      },
      {
        id: "clearLocalData",
        label: "Clear Local Data",
        description: "Remove all locally stored data",
        type: "action",
        buttonLabel: "Clear Data",
        confirmMessage: "Are you sure? This will remove all your local settings and preferences.",
        action: () => {
          if (confirm("Are you sure? This will remove all your local settings and preferences.")) {
            // Keep auth-related items
            const theme = localStorage.getItem("theme");
            localStorage.clear();
            if (theme) localStorage.setItem("theme", theme);
            location.reload();
          }
        }
      }
    ]
  },
  system: {
    title: "System",
    description: "Advanced system settings",
    settings: [
      {
        id: "logoutAllSessions",
        label: "Logout from All Sessions",
        description: "Sign out from all devices",
        type: "action",
        buttonLabel: "Logout All",
        requiresAuth: true,
        action: async () => {
          if (window.AppwriteAuth) {
            try {
              await window.AppwriteAuth.logout();
              location.reload();
            } catch (err) {
              console.error("Logout error:", err);
              alert("Failed to logout. Please try again.");
            }
          }
        }
      },
      {
        id: "resetSettings",
        label: "Reset All Settings",
        description: "Restore default settings",
        type: "action",
        buttonLabel: "Reset Settings",
        confirmMessage: "This will reset all settings to defaults. Continue?",
        action: () => {
          if (confirm("This will reset all settings to defaults. Continue?")) {
            localStorage.removeItem("theme");
            localStorage.removeItem("night");
            localStorage.removeItem("nightStrength");
            localStorage.removeItem("accentColor");
            localStorage.removeItem("highContrast");
            localStorage.removeItem("reducedMotion");
            location.reload();
          }
        }
      }
    ]
  }
};

// ================================
// Settings Renderer
// ================================
class SettingsRenderer {
  constructor(config, containerId = "settings-container") {
    this.config = config;
    this.container = document.getElementById(containerId);
    this.isLoggedIn = false;
  }

  async init() {
    if (!this.container) {
      console.error("Settings container not found");
      return;
    }

    // Check if user is logged in
    if (window.AppwriteAuth) {
      const user = await window.AppwriteAuth.getCurrentUser();
      this.isLoggedIn = !!user;
    }

    this.render();
    this.loadValues();
  }

  render() {
    this.container.innerHTML = "";

    Object.entries(this.config).forEach(([categoryKey, category]) => {
      const categorySection = this.createCategorySection(category);
      this.container.appendChild(categorySection);
    });
  }

  createCategorySection(category) {
    const section = document.createElement("section");
    section.className = "settings-card";

    const title = document.createElement("h2");
    title.textContent = category.title;
    section.appendChild(title);

    if (category.description) {
      const desc = document.createElement("p");
      desc.className = "text-muted";
      desc.textContent = category.description;
      section.appendChild(desc);
    }

    category.settings.forEach(setting => {
      // Skip settings that require auth if not logged in
      if (setting.requiresAuth && !this.isLoggedIn) {
        return;
      }

      const settingGroup = this.createSettingGroup(setting);
      section.appendChild(settingGroup);
    });

    return section;
  }

  createSettingGroup(setting) {
    const group = document.createElement("div");
    group.className = "setting-group";
    group.dataset.settingId = setting.id;

    // Label and description
    const labelContainer = document.createElement("div");
    labelContainer.className = "setting-label-container";

    const label = document.createElement("p");
    label.className = "setting-label";
    label.textContent = setting.label;
    labelContainer.appendChild(label);

    if (setting.description) {
      const desc = document.createElement("p");
      desc.className = "setting-description";
      desc.textContent = setting.description;
      labelContainer.appendChild(desc);
    }

    group.appendChild(labelContainer);

    // Control based on type
    const control = this.createControl(setting);
    group.appendChild(control);

    return group;
  }

  createControl(setting) {
    switch (setting.type) {
      case "toggle":
        return this.createToggle(setting);
      case "select":
        return this.createSelect(setting);
      case "text":
        return this.createTextInput(setting);
      case "range":
        return this.createRange(setting);
      case "action":
        return this.createActionButton(setting);
      default:
        return document.createElement("div");
    }
  }

  createToggle(setting) {
    const toggle = document.createElement("label");
    toggle.className = "setting-toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `setting-${setting.id}`;
    input.dataset.settingId = setting.id;

    const slider = document.createElement("span");
    slider.className = "toggle-slider";

    toggle.appendChild(input);
    toggle.appendChild(slider);

    input.addEventListener("change", () => {
      if (setting.onChange) {
        setting.onChange(input.checked);
      }
    });

    return toggle;
  }

  createSelect(setting) {
    const select = document.createElement("select");
    select.className = "setting-select";
    select.id = `setting-${setting.id}`;
    select.dataset.settingId = setting.id;

    setting.options.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      if (setting.onChange) {
        setting.onChange(select.value);
      }
    });

    return select;
  }

  createTextInput(setting) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "setting-input";
    input.id = `setting-${setting.id}`;
    input.dataset.settingId = setting.id;
    if (setting.placeholder) {
      input.placeholder = setting.placeholder;
    }

    input.addEventListener("blur", () => {
      if (setting.onChange) {
        setting.onChange(input.value);
      }
    });

    return input;
  }

  createRange(setting) {
    const container = document.createElement("div");
    container.className = "setting-range-container";

    const input = document.createElement("input");
    input.type = "range";
    input.className = "setting-range";
    input.id = `setting-${setting.id}`;
    input.dataset.settingId = setting.id;
    input.min = setting.min;
    input.max = setting.max;
    input.step = setting.step;

    const valueDisplay = document.createElement("span");
    valueDisplay.className = "range-value";
    valueDisplay.textContent = setting.default;

    input.addEventListener("input", () => {
      valueDisplay.textContent = input.value;
      if (setting.onChange) {
        setting.onChange(input.value);
      }
    });

    container.appendChild(input);
    container.appendChild(valueDisplay);

    return container;
  }

  createActionButton(setting) {
    const button = document.createElement("button");
    button.className = "btn btn-outline";
    button.textContent = setting.buttonLabel || "Execute";
    button.type = "button";

    button.addEventListener("click", () => {
      if (setting.action) {
        setting.action();
      }
    });

    return button;
  }

  async loadValues() {
    Object.values(this.config).forEach(category => {
      category.settings.forEach(async setting => {
        const element = document.getElementById(`setting-${setting.id}`);
        if (!element) return;

        let value = setting.default;

        // Load from storage
        if (setting.storage === "localStorage") {
          const stored = localStorage.getItem(setting.id);
          if (stored !== null) {
            if (setting.type === "toggle") {
              value = stored === "true" || stored === "on";
            } else if (setting.type === "range") {
              value = parseInt(stored);
            } else {
              value = stored;
            }
          }
        } else if (setting.storage === "appwrite" && this.isLoggedIn && window.AppwriteAuth) {
          try {
            const prefs = await window.AppwriteAuth.getUserPrefs();
            if (prefs[setting.id] !== undefined) {
              value = prefs[setting.id];
            }
          } catch (err) {
            console.error("Error loading Appwrite prefs:", err);
          }
        }

        // Set value based on type
        if (setting.type === "toggle") {
          element.checked = value;
        } else if (setting.type === "select" || setting.type === "text" || setting.type === "range") {
          element.value = value;
          
          if (setting.type === "range") {
            const valueDisplay = element.nextElementSibling;
            if (valueDisplay) {
              valueDisplay.textContent = value;
            }
          }
        }
      });
    });
  }
}

// ================================
// Initialize Settings Page
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  // Wait for Appwrite to be ready
  await new Promise(resolve => {
    if (window.AppwriteAuth) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (window.AppwriteAuth) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 5000);
    }
  });

  const renderer = new SettingsRenderer(SETTINGS_CONFIG);
  await renderer.init();
});
