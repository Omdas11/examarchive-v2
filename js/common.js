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
// Load header, footer & avatar popup
// ===============================
function loadPartial(id, file) {
  fetch(file)
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById(id);
      if (!container) return;

      container.innerHTML = html;

      // 🔔 Header ready
      if (id === "header") {
        highlightActiveNav();
        document.dispatchEvent(
          new CustomEvent("header:loaded", { bubbles: true })
        );
      }

      // 🔔 Footer ready
      if (id === "footer") {
        document.dispatchEvent(
          new CustomEvent("footer:loaded", { bubbles: true })
        );
      }
    })
    .catch(err => {
      console.error(`Failed to load ${file}:`, err);
    });
}

loadPartial("header", "partials/header.html");
loadPartial("footer", "partials/footer.html");
loadPartial("avatar-portal", "partials/avatar-popup.html");

// ===============================
// Highlight active nav link
// ===============================
function highlightActiveNav() {
  const current =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
}

// ===============================
// Mobile menu toggle
// ===============================
document.addEventListener("click", (e) => {
  const menuBtn = e.target.closest(".menu-btn");
  const mobileNav = document.getElementById("mobileNav");

  if (menuBtn && mobileNav) {
    mobileNav.classList.toggle("open");
    return;
  }

  if (e.target.closest(".mobile-nav a")) {
    mobileNav?.classList.remove("open");
  }
});

// ===============================
// Footer year
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

// ===============================
// Avatar JS loader (CORRECT)
// ===============================
document.addEventListener("header:loaded", () => {
  if (document.getElementById("avatar-script")) return;

  const script = document.createElement("script");
  script.src = "js/avatar.js";
  script.defer = true;
  script.id = "avatar-script";
  document.body.appendChild(script);
});
