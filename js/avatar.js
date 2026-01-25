document.addEventListener("DOMContentLoaded", () => {
  fetch("partials/avatar-popup.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("avatar-root").innerHTML = html;

      const popup = document.getElementById("avatar-popup");
      const trigger = document.querySelector(".avatar-trigger");

      if (!popup || !trigger) return;

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (!popup.contains(e.target) && !trigger.contains(e.target)) {
          popup.classList.remove("open");
        }
      });
    });
});
