// ===============================
// Theme & Night Mode Controller
// ===============================

// Apply saved state immediately
const savedTheme = localStorage.getItem("theme") || "light";
const savedNight = localStorage.getItem("night") || "off";
const savedStrength = localStorage.getItem("nightStrength") || "8";

document.body.setAttribute("data-theme", savedTheme);

if (savedNight === "on") {
  document.body.setAttribute("data-night", "on");
}

document.documentElement.style.setProperty(
  "--night-strength",
  Number(savedStrength) / 100
);

// Delegate clicks (works for injected header)
document.addEventListener("click", (e) => {
  const themeBtn = e.target.closest(".theme-btn[data-theme]");
  const nightBtn = e.target.closest(".night-btn");

  // Theme toggle
  if (themeBtn) {
    const theme = themeBtn.dataset.theme;

    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    document.querySelectorAll(".theme-btn").forEach(b =>
      b.classList.toggle("active", b === themeBtn)
    );
  }

  // Night toggle
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

// Night strength slider
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

// Sync UI after header/settings load
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === savedTheme);
  });

  const nightBtn = document.querySelector(".night-btn");
  if (nightBtn && savedNight === "on") {
    nightBtn.classList.add("active");
  }

  const nightRange = document.querySelector("#nightRange");
  if (nightRange) nightRange.value = savedStrength;
});
