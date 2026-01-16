// ===============================
// Theme & Night Mode Controller
// FINAL — WORKING & STABLE
// ===============================

// ---------- LOAD SAVED STATE ----------
const savedTheme = localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night") || "off";
const savedStrength = localStorage.getItem("nightStrength") || "50";

// Apply theme
document.body.setAttribute("data-theme", savedTheme);

// Apply night state
if (savedNight === "on") {
  document.body.setAttribute("data-night", "on");
} else {
  document.body.removeAttribute("data-night");
}

// Apply night strength (THIS WAS THE BUG)
document.body.style.setProperty(
  "--night-filter-strength",
  Number(savedStrength) / 100
);

// ---------- UI SYNC ----------
function syncThemeUI(theme) {
  document.querySelectorAll(".theme-btn[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

// ---------- CLICK HANDLER ----------
document.addEventListener("click", (e) => {
  const themeBtn = e.target.closest(".theme-btn[data-theme]");
  const nightBtn = e.target.closest(".night-btn");

  // Theme switch
  if (themeBtn) {
    const theme = themeBtn.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    syncThemeUI(theme);
  }

  // Night mode toggle
  if (nightBtn) {
    const isOn = document.body.getAttribute("data-night") === "on";

    if (isOn) {
      document.body.removeAttribute("data-night");
      localStorage.setItem("night", "off");
      nightBtn.classList.remove("active");
    } else {
      document.body.setAttribute("data-night", "on");
      localStorage.setItem("night", "on");
      nightBtn.classList.add("active");
    }
  }
});

// ---------- NIGHT STRENGTH SLIDER ----------
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

  const nightRange = document.getElementById("nightRange");
  if (nightRange) nightRange.value = savedStrength;

  const nightBtn = document.querySelector(".night-btn");
  if (nightBtn && savedNight === "on") {
    nightBtn.classList.add("active");
  }
});
