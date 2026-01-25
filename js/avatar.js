document.addEventListener("header:loaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const mount = document.getElementById("avatar-mount");

  if (!trigger || !mount) return;

  fetch("partials/avatar-popup.html")
    .then(res => res.text())
    .then(html => {
      mount.innerHTML = html;

      const popup = document.getElementById("avatar-popup");
      if (!popup) return;

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("open");
      });

      document.addEventListener("click", () => {
        popup.classList.remove("open");
      });
    });
});
