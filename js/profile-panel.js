// ===============================
// Expanded Profile Panel Logic
// ===============================

(function () {
  const panel = document.getElementById("profile-panel");

  document.addEventListener("click", (e) => {
    // open from avatar popup
    if (e.target.closest("[data-open-profile]")) {
      panel.classList.add("open");
      return;
    }

    // close
    if (
      e.target.id === "profile-panel" ||
      e.target.id === "closeProfile"
    ) {
      panel.classList.remove("open");
    }
  });
})();
