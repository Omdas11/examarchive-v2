(function () {
  const waitForHeader = new MutationObserver(() => {
    const trigger = document.querySelector(".avatar-trigger");
    const mount = document.getElementById("avatar-mount");

    if (!trigger || !mount) return;

    // Stop observing once found
    waitForHeader.disconnect();

    // Load popup HTML
    fetch("partials/avatar-popup.html")
      .then(res => res.text())
      .then(html => {
        mount.innerHTML = html;

        const popup = document.getElementById("avatar-popup");
        if (!popup) return;

        // Toggle popup
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          popup.classList.toggle("open");
        });

        // Close on outside click
        document.addEventListener("click", (e) => {
          if (!popup.contains(e.target) && !trigger.contains(e.target)) {
            popup.classList.remove("open");
          }
        });
      });
  });

  // Observe entire document until header appears
  waitForHeader.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
