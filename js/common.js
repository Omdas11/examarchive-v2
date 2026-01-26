// ===============================
// Apply saved theme early (GLOBAL)
// ===============================
(function () {
  const theme = localStorage.getItem("theme") || "light";
  const night = localStorage.getItem("night");

  document.body.setAttribute("data-theme", theme);
  if (night === "on") document.body.setAttribute("data-night", "on");
})();

// ===============================
// Partial loader helper
// ===============================
function loadPartial(id, file, callback) {
  fetch(file)
    .then(res => res.text())
    .then(html => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = html;
      callback && callback();
    })
    .catch(err => console.error(file, err));
}

// ===============================
// HEADER
// ===============================
loadPartial("header", "partials/header.html", () => {
  highlightActiveNav();
  document.dispatchEvent(new Event("header:loaded"));
});

// ===============================
// FOOTER
// ===============================
loadPartial("footer", "partials/footer.html");

// ===============================
// AVATAR POPUP
// ===============================
loadPartial("avatar-portal", "partials/avatar-popup.html", () => {
  document.dispatchEvent(new Event("avatar:loaded"));
});

// ===============================
// EXPANDED PROFILE PANEL  🔥 THIS WAS MISSING
// ===============================
loadPartial("profile-panel-portal", "partials/profile-panel.html");

// ===============================
// Active nav
// ===============================
function highlightActiveNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(a => {
    if (a.getAttribute("href") === current) a.classList.add("active");
  });
}

// ===============================
// Mobile menu
// ===============================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".menu-btn");
  const nav = document.getElementById("mobileNav");
  if (btn && nav) nav.classList.toggle("open");
  if (e.target.closest(".mobile-nav a")) nav?.classList.remove("open");
});

// ===============================
// Footer year
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

// ===============================
// Load avatar.js AFTER popup exists
// ===============================
document.addEventListener("avatar:loaded", () => {
  if (document.getElementById("avatar-script")) return;
  const s = document.createElement("script");
  s.src = "js/avatar.js";
  s.id = "avatar-script";
  s.defer = true;
  document.body.appendChild(s);
});
