// ===============================
// Theme & Night Mode Controller
// ===============================

document.addEventListener("DOMContentLoaded", () => {
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

  // Apply night strength
  document.documentElement.style.setProperty(
    "--night-strength",
    Number(savedStrength) / 100
  );

  // Sync theme buttons (header + settings)
  themeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === savedTheme);
  });

  // Sync night toggle
  if (savedNight === "on" && nightButton) {
    nightButton.classList.add("active");
  }

  // Sync night range
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

  // Night strength slider
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
});
