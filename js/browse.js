/**
 * ExamArchive v2 — Browse Page (FINAL RESTORE)
 * One card per PDF | Correct UX | Registry-safe
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
function norm(v) {
  return String(v || "").toLowerCase();
}

function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? m[1] : "—";
}

function extractShortCode(code) {
  // Remove university / programme prefixes
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

function extractSemester(code) {
  const m = code.match(/(\d)(0[1-8])/);
  if (!m) return "—";
  return `Sem ${m[2][1]}`;
}

// ================================
// Load data
// ================================
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  papers = await res.json();
}

// ================================
// Apply filters
// ================================
function applyFilters() {
  view = [...papers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  if (filters.stream !== "ALL") {
    view = view.filter(p => norm(p.stream) === norm(filters.stream));
  }

  if (filters.year !== "ALL") {
    view = view.filter(p => extractYear(p.pdf) === filters.year);
  }

  sortView();
  render();
}

// ================================
// Sort
// ================================
function sortView() {
  if (filters.sort === "newest") {
    view.sort((a, b) =>
      extractYear(b.pdf).localeCompare(extractYear(a.pdf))
    );
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
    const year = extractYear(p.pdf);
    const sem = extractSemester(p.paper_code);
    const shortCode = extractShortCode(p.paper_code);

    const card = document.createElement("div");
    card.className = "paper-card";
    card.onclick = () => {
      window.location.href = `paper.html?code=${shortCode}`;
    };

    card.innerHTML = `
      <h3 class="paper-title">${p.paper_name || "Paper title pending"}</h3>
      <p class="paper-code">${shortCode}</p>
      <small class="paper-meta">
        Assam University • ${p.programme} • ${p.stream.toUpperCase()} • ${sem} • ${year}
      </small>
      <a class="paper-link" href="${p.pdf}" target="_blank" onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

// ================================
// Bind controls
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
(async function init() {
  await loadPapers();
  applyFilters();
})();
