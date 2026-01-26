// ===============================
// Theme & Night Mode Controller
// FINAL — HEADER + SETTINGS SAFE
// ===============================

// ---------- LOAD SAVED STATE ----------
const savedTheme = localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night") || "off";
const savedStrength = localStorage.getItem("nightStrength") || "50";

// ---------- APPLY STATE ----------
document.body.setAttribute("data-theme", savedTheme);

if (savedNight === "on") {
  document.body.setAttribute("data-night", "on");
} else {
  document.body.removeAttribute("data-night");
}

document.body.style.setProperty(
  "--night-filter-strength",
  Number(savedStrength) / 100
);

// ---------- UI SYNC ----------
function syncThemeUI(theme) {
  // Header buttons
  document.querySelectorAll(".theme-btn[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });

  // Settings buttons
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

  // Theme change
  if (themeBtn) {
    const theme = themeBtn.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    syncThemeUI(theme);
  }

  // Night toggle
  if (nightBtn) {
    const isOn = document.body.getAttribute("data-night") === "on";

    if (isOn) {
      document.body.removeAttribute("data-night");
      localStorage.setItem("night", "off");
      syncNightUI(false);
    } else {
      document.body.setAttribute("data-night", "on");
      localStorage.setItem("night", "on");
      syncNightUI(true);
    }
  }
});

// ---------- NIGHT STRENGTH ----------
document.addEventListener("input", (e) => {
  if (e.target.id === "nightRange") {
    const value = e.target.value;

    document.body.style.setProperty(
      "--night-filter-strength",
      value / 100
    );

    localStorage.setItem("nightStrength", value);
  }
});

// ---------- FINAL SYNC ----------
document.addEventListener("DOMContentLoaded", () => {
  syncThemeUI(savedTheme);
  syncNightUI(savedNight === "on");

  const nightRange = document.getElementById("nightRange");
  if (nightRange) nightRange.value = savedStrength;
});
