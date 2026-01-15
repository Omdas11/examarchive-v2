// ===============================
// Theme & Night Mode Controller
// ===============================

const themeButtons = document.querySelectorAll(".theme-btn[data-theme]");
const nightButton = document.querySelector(".night-btn");
const nightRange = document.querySelector("#nightRange");

// Load saved values
const savedTheme = localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night") || "off";
const savedStrength = localStorage.getItem("nightStrength") || "8";

// Apply saved theme
document.body.setAttribute("data-theme", savedTheme);

// Apply night mode
if (savedNight === "on") {
  document.body.setAttribute("data-night", "on");
}

// Apply strength
document.documentElement.style.setProperty(
  "--night-strength",
  Number(savedStrength) / 100
);

// Sync UI
themeButtons.forEach(btn => {
  if (btn.dataset.theme === savedTheme) btn.classList.add("active");
});

if (savedNight === "on" && nightButton) {
  nightButton.classList.add("active");
}

if (nightRange) {
  nightRange.value = savedStrength;
}

// Theme switching
themeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    themeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Night toggle
if (nightButton) {
  nightButton.addEventListener("click", () => {
    const isOn = document.body.getAttribute("data-night") === "on";

    if (isOn) {
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

// Strength slider
if (nightRange) {
  nightRange.addEventListener("input", () => {
    const value = nightRange.value;
    document.documentElement.style.setProperty(
      "--night-strength",
      value / 100
    );
    localStorage.setItem("nightStrength", value);
  });
}
