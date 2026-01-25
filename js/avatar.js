document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.querySelector(".avatar-trigger");
  const mount = document.getElementById("avatar-mount");

  if (!trigger || !mount) return;

  // Load popup HTML
  fetch("partials/avatar-popup.html")
    .then(res => res.text())
    .then(html => {
      mount.innerHTML = html;

      const popup = document.getElementById("avatar-popup");

      // Toggle popup
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("open");
        popup.classList.toggle("hidden");
      });

      // Close on outside click
      document.addEventListener("click", (e) => {
        if (!popup.contains(e.target) && !trigger.contains(e.target)) {
          popup.classList.remove("open");
          popup.classList.add("hidden");
        }
      });
    });
});
