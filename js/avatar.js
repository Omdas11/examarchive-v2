document.addEventListener("DOMContentLoaded", () => {
  const avatarBtn = document.querySelector(".avatar-trigger");
  let popup;

  fetch("partials/avatar-popup.html")
    .then(res => res.text())
    .then(html => {
      document.body.insertAdjacentHTML("beforeend", html);
      popup = document.getElementById("avatar-popup");
    });

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!popup) return;
    popup.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    if (popup) popup.classList.remove("open");
  });
});
