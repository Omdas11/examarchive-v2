// ===============================
// Load header & footer
// ===============================
function loadPartial(id, file) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      document.getElementById(id).innerHTML = data;
    });
}

loadPartial("header", "partials/header.html");
loadPartial("footer", "partials/footer.html");

// ===============================
// Mobile menu toggle (delegated)
// ===============================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("menu-btn")) {
    document.querySelector(".nav")?.classList.toggle("active");
  }
});

// ===============================
// Auto year
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
