const modeBtn = document.getElementById("searchModeBtn");
const dropdown = document.getElementById("searchModeDropdown");

let currentMode = "universal";

modeBtn.addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});

dropdown.addEventListener("click", (e) => {
  if (!e.target.dataset.mode) return;

  currentMode = e.target.dataset.mode;
  modeBtn.textContent = e.target.textContent;

  dropdown.querySelectorAll("button").forEach(btn =>
    btn.classList.remove("active")
  );
  e.target.classList.add("active");

  dropdown.style.display = "none";
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    dropdown.style.display = "none";
  }
});
