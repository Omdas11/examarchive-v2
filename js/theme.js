// ===============================
// Theme & Night Mode Controller
// (Settings page interactions only)
// ===============================

// Elements
const themeButtons = document.querySelectorAll(".theme-btn[data-theme]");
const nightButton = document.querySelector(".night-btn");

// Load saved values (for UI sync only)
const savedTheme = localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night") || "off";

// ===============================
// Apply saved state on load
// ===============================

// Apply theme
document.body.setAttribute("data-theme", savedTheme);

// Apply night mode
if (savedNight === "on") {
  document.body.setAttribute("data-night", "on");
}

// ===============================
// Sync UI state on load
// ===============================

// Highlight active theme button
themeButtons.forEach(btn => {
  if (btn.dataset.theme === savedTheme) {
    btn.classList.add("active");
  }
});

// Highlight night mode button if enabled
if (savedNight === "on" && nightButton) {
  nightButton.classList.add("active");
}

// ===============================
// Theme button click
// ===============================
themeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;

    // Apply theme
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Update active state
    themeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ===============================
// Night mode toggle
// ===============================
if (nightButton) {
  nightButton.addEventListener("click", () => {
    const isNightOn = document.body.getAttribute("data-night") === "on";

    if (isNightOn) {
      document.body.removeAttribute("data-night");
      localStorage.setItem("night", "off");
      nightButton.classList.remove("active");
    } else {
      document.body.setAttribute("data-night", "on");
      localStorage.setItem("night", "on");
      nightButton.classList.add("active");
    }
  });
}
