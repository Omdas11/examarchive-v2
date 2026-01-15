const radios = document.querySelectorAll('input[name="theme"]');
const savedTheme = localStorage.getItem("theme") || "light";

// apply saved theme on load
document.body.setAttribute("data-theme", savedTheme);

// sync radio buttons
radios.forEach(radio => {
  if (radio.value === savedTheme) {
    radio.checked = true;
  }

  radio.addEventListener("change", () => {
    document.body.setAttribute("data-theme", radio.value);
    localStorage.setItem("theme", radio.value);
  });
});
