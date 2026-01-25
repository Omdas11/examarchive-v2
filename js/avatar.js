document.addEventListener("DOMContentLoaded", () => {
  const avatarBtn = document.querySelector(".avatar-trigger");
  const mount = document.getElementById("avatar-mount");

  fetch("partials/avatar-popup.html")
    .then(res => res.text())
    .then(html => {
      mount.innerHTML = html;
    });

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const popup = document.querySelector(".avatar-popup");
    if (!popup) return;
    popup.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    const popup = document.querySelector(".avatar-popup");
    if (popup) popup.classList.remove("open");
  });
});
