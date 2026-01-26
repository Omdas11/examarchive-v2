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
// Load partial helper
// ===============================
function loadPartial(id, file, callback) {
  fetch(file)
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById(id);
      if (!container) return;

      container.innerHTML = html;

      if (typeof callback === "function") {
        callback();
      }
    })
    .catch(err => {
      console.error(`Failed to load ${file}:`, err);
    });
}

// ===============================
// Load HEADER
// ===============================
loadPartial("header", "partials/header.html", () => {
  highlightActiveNav();
  document.dispatchEvent(new CustomEvent("header:loaded"));
});

// ===============================
// Load FOOTER
// ===============================
loadPartial("footer", "partials/footer.html", () => {
  document.dispatchEvent(new CustomEvent("footer:loaded"));
});

// ===============================
// Load AVATAR POPUP
// ===============================
loadPartial("avatar-portal", "partials/avatar-popup.html", () => {
  document.dispatchEvent(new CustomEvent("avatar:loaded"));
});

// ===============================
// Load PROFILE PANEL (NEW)
// ===============================
loadPartial("profile-panel-portal", "partials/profile-panel.html");

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
// Load avatar.js ONLY AFTER popup exists
// ===============================
document.addEventListener("avatar:loaded", () => {
  if (document.getElementById("avatar-script")) return;

  const script = document.createElement("script");
  script.src = "js/avatar.js";
  script.defer = true;
  script.id = "avatar-script";
  document.body.appendChild(script);
});
