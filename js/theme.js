// ===============================
// Theme & Night Mode Controller
// ===============================

// Elements
const themeButtons = document.querySelectorAll(".theme-btn[data-theme]");
const nightButton = document.querySelector(".night-btn");

// Load saved values
const savedTheme = localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night") || "off";

// Apply saved theme on load
document.body.setAttribute("data-theme", savedTheme);

// Apply saved night mode
if (savedNight === "on") {
  document.body.setAttribute("data-night", "on");
  if (nightButton) nightButton.classList.add("active");
}

// Highlight active theme button
themeButtons.forEach(btn => {
  if (btn.dataset.theme === savedTheme) {
    btn.classList.add("active");
  }
});

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
