// ===============================
// Load header & footer partials
// ===============================
function loadPartial(id, file) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = data;

        // After header loads, enhance nav
        if (id === "header") {
          highlightActiveNav();
        }
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
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
    }
  });
}

// ===============================
// Mobile menu toggle + auto close
// (event delegation)
// ===============================
document.addEventListener("click", (e) => {
  // Toggle menu (hamburger)
  if (e.target.classList.contains("menu-btn")) {
    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav) {
      mobileNav.classList.toggle("open");
    }
  }

  // Close menu when clicking a mobile link
  if (e.target.closest(".mobile-nav a")) {
    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav) {
      mobileNav.classList.remove("open");
    }
  }
});

// ===============================
// Auto-update footer year
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
