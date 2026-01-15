// ===============================
// Theme & Night Mode Controller
// ===============================

// Load saved state
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

// Initial sync (for settings page)
syncThemeUI(savedTheme);

// ---------- CLICK HANDLING (WORKS EVERYWHERE) ----------
document.addEventListener("click", (e) => {
  const themeBtn = e.target.closest(".theme-btn[data-theme]");
  const nightBtn = e.target.closest(".night-btn");

  if (themeBtn) {
    const theme = themeBtn.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    syncThemeUI(theme);
  }

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

// ---------- NIGHT STRENGTH ----------
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

// ---------- OBSERVE HEADER INJECTION ----------
const observer = new MutationObserver(() => {
  const headerButtons = document.querySelectorAll(".site-header .theme-btn");
  if (headerButtons.length) {
    syncThemeUI(localStorage.getItem("theme") || "light");
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// ---------- FINAL UI SYNC ----------
document.addEventListener("DOMContentLoaded", () => {
  syncThemeUI(savedTheme);

  const nightRange = document.querySelector("#nightRange");
  if (nightRange) nightRange.value = savedStrength;

  const nightBtn = document.querySelector(".night-btn");
  if (nightBtn && savedNight === "on") {
    nightBtn.classList.add("active");
  }
});
