// ===============================
// Theme Controller
// Phase 3 — Single Light ↔ Dark Toggle
// GLOBAL APPLICATION
// ===============================

// ---------- LOAD SAVED STATE ----------
const savedTheme = localStorage.getItem("theme-mode") || localStorage.getItem("theme") || "light";

// ---------- UI SYNC ----------
function syncThemeUI(theme) {
  // Legacy header buttons (if any remain)
  document.querySelectorAll(".theme-btn[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });

  // Settings buttons (if present)
  document.querySelectorAll(".settings-theme-btn[data-theme]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

// ---------- SINGLE TOGGLE HANDLER ----------
document.addEventListener("click", (e) => {
  // Single theme toggle button
  const toggleBtn = e.target.closest("#themeToggleBtn");
  if (toggleBtn) {
    const current = document.body.getAttribute("data-theme") || "light";
    // Treat amoled as a dark variant — toggle to light; otherwise toggle to dark
    const next = (current === "light") ? "dark" : "light";
    
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme-mode", next);
    localStorage.setItem("theme", next);
    syncThemeUI(next);
    return;
  }
  
  // Legacy: Settings theme buttons still work
  const themeBtn =
    e.target.closest(".theme-btn[data-theme]") ||
    e.target.closest(".settings-theme-btn[data-theme]");

  if (themeBtn) {
    const theme = themeBtn.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme-mode", theme);
    localStorage.setItem("theme", theme);
    syncThemeUI(theme);
  }
});

// ---------- FINAL SYNC ----------
document.addEventListener("DOMContentLoaded", () => {
  const currentTheme = document.body.getAttribute("data-theme") || savedTheme;
  syncThemeUI(currentTheme);
});
