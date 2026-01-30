// ===============================
// Theme & Night Mode Controller
// FINAL — HEADER + SETTINGS SAFE
// GLOBAL APPLICATION
// ===============================

// ---------- LOAD SAVED STATE ----------
// Prefer new standardized keys, fall back to legacy keys
const savedTheme = localStorage.getItem("theme-mode") || localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night-mode") || localStorage.getItem("night") || "false";
const savedStrength = localStorage.getItem("night-strength") || localStorage.getItem("nightStrength") || "50";

// ---------- APPLY STATE ----------
// Theme is already applied by common.js early init
// Just ensure night mode is applied if needed
if (savedNight === "on" || savedNight === "true") {
  document.body.setAttribute("data-night", "on");
  document.body.style.setProperty("--night-filter-strength", Number(savedStrength) / 100);
}

// ---------- UI SYNC ----------
function syncThemeUI(theme) {
  // Header buttons
  document.querySelectorAll(".theme-btn[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });

  // Settings buttons (if present)
  document.querySelectorAll(".settings-theme-btn[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

function syncNightUI(isOn) {
  document.querySelectorAll(".night-btn, .settings-night-btn").forEach(btn => {
    btn.classList.toggle("active", isOn);
  });
}

// ---------- CLICK HANDLER ----------
document.addEventListener("click", (e) => {
  const themeBtn =
    e.target.closest(".theme-btn[data-theme]") ||
    e.target.closest(".settings-theme-btn[data-theme]");

  const nightBtn =
    e.target.closest(".night-btn") ||
    e.target.closest(".settings-night-btn");

  // Theme change (legacy header buttons)
  if (themeBtn) {
    const theme = themeBtn.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    // Use standardized key (theme-mode) for consistency with common.js
    localStorage.setItem("theme-mode", theme);
    // Keep legacy key for backwards compatibility
    localStorage.setItem("theme", theme);
    syncThemeUI(theme);
  }

  // Night toggle
  if (nightBtn) {
    const isOn = document.body.getAttribute("data-night") === "on";

    if (isOn) {
      document.body.removeAttribute("data-night");
      // Use standardized key (night-mode) with boolean string
      localStorage.setItem("night-mode", "false");
      // Keep legacy key for backwards compatibility
      localStorage.setItem("night", "off");
      syncNightUI(false);
    } else {
      document.body.setAttribute("data-night", "on");
      // Use standardized key (night-mode) with boolean string
      localStorage.setItem("night-mode", "true");
      // Keep legacy key for backwards compatibility
      localStorage.setItem("night", "on");
      syncNightUI(true);
    }
  }
});

// ---------- NIGHT STRENGTH ----------
document.addEventListener("input", (e) => {
  if (e.target.id === "nightRange" || e.target.id === "night-strength") {
    const value = e.target.value;

    document.body.style.setProperty(
      "--night-filter-strength",
      value / 100
    );

    // Use standardized key (night-strength)
    localStorage.setItem("night-strength", value);
    // Keep legacy key for backwards compatibility
    localStorage.setItem("nightStrength", value);
  }
});

// ---------- FINAL SYNC ----------
document.addEventListener("DOMContentLoaded", () => {
  const currentTheme = document.body.getAttribute("data-theme") || savedTheme;
  const currentNight = document.body.getAttribute("data-night") === "on";
  
  syncThemeUI(currentTheme);
  syncNightUI(currentNight);

  const nightRange = document.getElementById("nightRange") || document.getElementById("night-strength");
  if (nightRange) nightRange.value = savedStrength;
});
