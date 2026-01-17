/**
 * ExamArchive v2 – Browse Logic (Registry-aware)
 * OVERWRITE-SAFE VERSION
 */

const PAPERS_URL = "./data/papers.json";
const REGISTRY_BASE = "./data/registry/";

let papers = [];
let filters = {
  programme: "ALL",
  stream: "ALL",
  year: "ALL"
};

// ================================
// Load registries
// ================================
async function loadRegistry(name) {
  const res = await fetch(`${REGISTRY_BASE}${name}.json`);
  return res.json();
}

// ================================
// Load papers
// ================================
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  papers = await res.json();
}

// ================================
// Apply filters
// ================================
function applyFilters() {
  let filtered = [...papers];

  if (filters.programme !== "ALL") {
    filtered = filtered.filter(p => p.programme === filters.programme);
  }

  if (filters.stream !== "ALL") {
    filtered = filtered.filter(p => p.stream === filters.stream);
  }

  renderPapers(filtered);
}

// ================================
// Render papers
// ================================
function renderPapers(list) {
  const container = document.querySelector(".papers-list");
  const countEl = document.querySelector(".paper-count");

  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `<p class="empty">No papers found.</p>`;
    countEl.textContent = "Showing 0 papers";
    return;
  }

  countEl.textContent = `Showing ${list.length} papers`;

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "paper-card";
    card.innerHTML = `
      <h3>${p.paper_code}</h3>
      <p>${p.paper_name}</p>
      <small>${p.programme} · ${p.stream}</small>
      <a href="${p.pdf}" target="_blank">Open PDF →</a>
    `;
    container.appendChild(card);
  });
}

// ================================
// Event bindings
// ================================
document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.addEventListener("click", () => {
    filters.programme = btn.dataset.programme;
    applyFilters();
  });
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.addEventListener("click", () => {
    filters.stream = btn.dataset.stream;
    applyFilters();
  });
});

// ================================
// Init
// ================================
(async function init() {
  await loadPapers();
  applyFilters();
})();
