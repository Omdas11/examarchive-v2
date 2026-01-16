// ===============================
// Apply saved theme early (GLOBAL)
// ===============================
(function () {
  const theme = localStorage.getItem("theme") || "light";
  const night = localStorage.getItem("night");

  document.body.setAttribute("data-theme", theme);

  if (night === "on") {
    document.body.setAttribute("data-night", "on");
  }
})();

// ===============================
// Load header & footer partials
// ===============================
function loadPartial(id, file) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      const container = document.getElementById(id);
      if (!container) return;

      container.innerHTML = data;

      // Header-specific actions
      if (id === "header") {
        highlightActiveNav();

        // 🔥 KEY FIX: notify other scripts (theme.js)
        document.dispatchEvent(new CustomEvent("header:loaded"));
      }
    })
    .catch(err => {
      console.error(`Failed to load ${file}:`, err);
    });
}

loadPartial("header", "partials/header.html");
loadPartial("footer", "partials/footer.html");

// ===============================
// Highlight active nav link
// ===============================
function highlightActiveNav() {
  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

// ===============================
// Mobile menu toggle + auto close
// ===============================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("menu-btn")) {
    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav) mobileNav.classList.toggle("open");
  }

  if (e.target.closest(".mobile-nav a")) {
    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav) mobileNav.classList.remove("open");
  }
});

// ===============================
// Auto-update footer year
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});
