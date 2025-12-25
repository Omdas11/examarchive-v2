// examarchive-v2/js/browse.js

let allPapers = [];
let selectedProgramme = "ALL";
let selectedStream = "Science";

const papersList = document.getElementById("papersList");
const searchInput = document.getElementById("searchInput");

// -------- FETCH PAPERS --------
fetch("data/papers.json")
  .then(res => res.json())
  .then(data => {
    allPapers = data;
    renderPapers();
  })
  .catch(err => {
    console.error("Failed to load papers.json", err);
    papersList.innerHTML = "<p>Error loading papers.</p>";
  });

// -------- RENDER --------
function renderPapers() {
  papersList.innerHTML = "";

  let filtered = allPapers.filter(paper => {
    // programme filter
    if (selectedProgramme !== "ALL" && paper.programme !== selectedProgramme) {
      return false;
    }

    // stream filter
    if (paper.stream !== selectedStream) {
      return false;
    }

    // search filter
    const q = searchInput.value.toLowerCase();
    if (q && !paper.search_text.includes(q)) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    papersList.innerHTML = "<p>No papers found.</p>";
    return;
  }

  filtered.forEach(paper => {
    const card = document.createElement("div");
    card.className = "paper-card";

    card.innerHTML = `
      <h3>${paper.paper_code}</h3>
      <p>${paper.paper_name}</p>
      <small>
        ${paper.programme} • Semester ${paper.semester} • ${paper.year}
      </small>
      <br>
      <a href="papers/${paper.pdf}" target="_blank">Open PDF</a>
    `;

    papersList.appendChild(card);
  });
}

// -------- PROGRAMME TOGGLE --------
document.getElementById("programmeToggle").addEventListener("click", e => {
  if (!e.target.dataset.programme) return;

  selectedProgramme = e.target.dataset.programme;

  document
    .querySelectorAll("#programmeToggle .toggle-btn")
    .forEach(btn => btn.classList.remove("active"));

  e.target.classList.add("active");
  renderPapers();
});

// -------- STREAM TOGGLE --------
document.getElementById("streamToggle").addEventListener("click", e => {
  if (!e.target.dataset.stream) return;

  selectedStream = e.target.dataset.stream;

  document
    .querySelectorAll("#streamToggle .toggle-btn")
    .forEach(btn => btn.classList.remove("active"));

  e.target.classList.add("active");
  renderPapers();
});

// -------- SEARCH --------
searchInput.addEventListener("input", renderPapers);
