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
      }
    })
    .catch(err => {
      console.error(`Failed to load ${file}:`, err);
    });
}

loadPartial("header", "partials/header.html");
loadPartial("footer", "partials/footer.html");

// ===============================
// Mobile menu toggle (delegated)
// ===============================
document.addEventListener("click", (e) => {
  // Hamburger button
  if (e.target.classList.contains("menu-btn")) {
    const mobileNav = document.getElementById("mobileNav");
    if (mobileNav) {
      mobileNav.classList.toggle("open");
    }
  }

  // Optional: close menu when clicking a mobile link
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
