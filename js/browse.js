/**
 * ExamArchive v2 – Browse Logic (STABLE)
 * Restored UX + Registry-aware data
 */

const PAPERS_URL = "./data/papers.json";

let papers = [];
let view = [];
let filters = {
  programme: "ALL",
  stream: "ALL",
  year: "ALL",
  sort: "newest"
};

// ================================
// Helpers
// ================================
const norm = v => String(v || "").toLowerCase();

function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? m[1] : null;
}

// ================================
// Load data
// ================================
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  papers = await res.json();
}

// ================================
// Deduplicate papers by paper_code
// ================================
function dedupe(papers) {
  const map = new Map();

  papers.forEach(p => {
    const year = extractYear(p.pdf);
    if (!map.has(p.paper_code)) {
      map.set(p.paper_code, { ...p, year });
    } else {
      const existing = map.get(p.paper_code);
      if (year && year > existing.year) {
        map.set(p.paper_code, { ...p, year });
      }
    }
  });

  return Array.from(map.values());
}

// ================================
// Apply filters
// ================================
function applyFilters() {
  view = dedupe(papers);

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  if (filters.stream !== "ALL") {
    view = view.filter(p => p.stream === norm(filters.stream));
  }

  if (filters.year !== "ALL") {
    view = view.filter(p => p.year === filters.year);
  }

  sortView();
  render();
}

// ================================
// Sort
// ================================
function sortView() {
  if (filters.sort === "newest") {
    view.sort((a, b) => (b.year || 0) - (a.year || 0));
  }
}

// ================================
// Render
// ================================
function render() {
  const list = document.querySelector(".papers-list");
  const count = document.querySelector(".paper-count");

  list.innerHTML = "";

  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  view.forEach(p => {
    const card = document.createElement("div");
    card.className = "paper-card";

    card.innerHTML = `
      <h3>${p.paper_code}</h3>
      <p class="paper-name">${p.paper_name}</p>
      <small>
        ${p.programme} • ${p.stream.toUpperCase()} • ${p.year || "—"}
      </small>
      <a href="${p.pdf}" target="_blank">Open PDF →</a>
    `;

    list.appendChild(card);
  });
}

// ================================
// Bind controls
// ================================
document.querySelectorAll("[data-programme]").forEach(b =>
  b.addEventListener("click", () => {
    filters.programme = b.dataset.programme;
    applyFilters();
  })
);

document.querySelectorAll("[data-stream]").forEach(b =>
  b.addEventListener("click", () => {
    filters.stream = b.dataset.stream;
    applyFilters();
  })
);

const sortSelect = document.querySelector("#sort");
if (sortSelect) {
  sortSelect.addEventListener("change", e => {
    filters.sort = e.target.value;
    applyFilters();
  });
}

// ================================
// Init
// ================================
(async function () {
  await loadPapers();
  applyFilters();
})();
