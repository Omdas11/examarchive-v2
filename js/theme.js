// ===============================
// Theme & Night Mode Controller
// ===============================

// Read saved state
const savedTheme = localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night") || "off";
const savedStrength = localStorage.getItem("nightStrength") || "8";

// Apply theme immediately
document.body.setAttribute("data-theme", savedTheme);
if (savedNight === "on") {
  document.body.setAttribute("data-night", "on");
}

document.documentElement.style.setProperty(
  "--night-strength",
  Number(savedStrength) / 100
);

// ---------- GLOBAL SYNC ----------
function syncThemeUI(theme) {
  document.querySelectorAll(".theme-btn[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

// Initial sync (for pages where buttons already exist)
syncThemeUI(savedTheme);

// ---------- EVENT DELEGATION ----------
document.addEventListener("click", (e) => {
  const themeBtn = e.target.closest(".theme-btn[data-theme]");
  const nightBtn = e.target.closest(".night-btn");

  // Theme change
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

// ---------- Night strength ----------
document.addEventListener("input", (e) => {
  if (e.target.id === "nightRange") {
    const value = e.target.value;
    document.documentElement.style.setProperty(
      "--night-strength",
      value / 100
    );
    localStorage.setItem("nightStrength", value);
  }
});

// ---------- RESYNC AFTER HEADER LOAD ----------
document.addEventListener("DOMContentLoaded", () => {
  // Run once header/settings are injected
  syncThemeUI(localStorage.getItem("theme") || "light");

  const nightRange = document.querySelector("#nightRange");
  if (nightRange) nightRange.value = savedStrength;

  const nightBtn = document.querySelector(".night-btn");
  if (nightBtn && savedNight === "on") {
    nightBtn.classList.add("active");
  }
});
