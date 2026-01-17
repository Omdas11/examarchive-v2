/**
 * ExamArchive v2 — Browse Page (FINAL FIX)
 * Overwrite-only: fixes loading lock, rendering, filters, routing
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
  return code.replace(/^AU[A-Z]+/i, "");
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
  const list = document.getElementById("papers-list");
  const count = document.querySelector(".paper-count");
  const loading = document.querySelector(".loading-text");
  const skeletons = document.querySelector(".skeleton-group");

  // 🔥 REMOVE LOADING STATE
  if (loading) loading.remove();
  if (skeletons) skeletons.remove();

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
      window.location.href = `paper.html?code=${p.paper_code}`;
    };

    card.innerHTML = `
      <h3 class="paper-name">${p.paper_name || "Paper title pending"}</h3>
      <p class="paper-code">${shortCode}</p>
      <p class="paper-meta">
        Assam University • ${p.programme} • ${p.stream.toUpperCase()} • ${sem} • ${year}
      </p>
      <a
        class="paper-link"
        href="${p.pdf}"
        target="_blank"
        onclick="event.stopPropagation()"
      >
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

// ================================
// Bind controls
// ================================

// Programme
const programmeBtns = document.querySelectorAll("[data-programme]");
programmeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    programmeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.programme = btn.dataset.programme;
    applyFilters();
  });
});

// Stream
const streamBtns = document.querySelectorAll("[data-stream]");
streamBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    streamBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.stream = btn.dataset.stream;
    applyFilters();
  });
});

// Sort
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
