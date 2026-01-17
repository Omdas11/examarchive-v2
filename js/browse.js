/**
 * ExamArchive v2 — Browse Page (FINAL, OBJECT-SAFE)
 */

alert("browse.js loaded");

const DATA_URL = "/examarchive-v2/data/papers.json";

// ================================
// State
// ================================
let allPapers = [];
let view = [];

let filters = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  search: "",
  sort: "newest"
};

// ================================
// Helpers
// ================================
function extractYear(pdf) {
  const m = String(pdf || "").match(/(20\d{2})/);
  return m ? m[1] : "";
}

function shortCode(code) {
  return String(code || "").replace(/^AU(CBCS|FYUG)/i, "");
}

// ================================
// Load papers (OBJECT → ARRAY)
// ================================
async function loadPapers() {
  const res = await fetch(DATA_URL);
  const raw = await res.json();

  // 🔥 CRITICAL FIX
  allPapers = Object.values(raw);

  alert("Loaded papers: " + allPapers.length);
}

// ================================
// Filters
// ================================
function applyFilters() {
  view = [...allPapers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  if (filters.stream !== "ALL") {
    view = view.filter(p => p.stream === filters.stream);
  }

  if (filters.year !== "ALL") {
    view = view.filter(p => extractYear(p.pdf) === filters.year);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    view = view.filter(p =>
      (p.paper_name || "").toLowerCase().includes(q) ||
      (p.paper_code || "").toLowerCase().includes(q) ||
      extractYear(p.pdf).includes(q)
    );
  }

  sortView();
  render();
}

// ================================
// Sort
// ================================
function sortView() {
  if (filters.sort === "newest") {
    view.sort((a, b) => extractYear(b.pdf) - extractYear(a.pdf));
  } else {
    view.sort((a, b) => extractYear(a.pdf) - extractYear(b.pdf));
  }
}

// ================================
// Render
// ================================
function render() {
  const list = document.getElementById("papersList");
  const count = document.getElementById("paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="text-muted">No papers found.</p>`;
    return;
  }

  view.forEach(p => {
    const year = extractYear(p.pdf);

    const card = document.createElement("div");
    card.className = "paper-card";
    card.onclick = () => {
      window.location.href = `paper.html?code=${shortCode(p.paper_code)}`;
    };

    card.innerHTML = `
      <div class="paper-name">${p.paper_name}</div>
      <div class="paper-code">${shortCode(p.paper_code)}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream} • Sem ${p.semester} • ${year}
      </div>
      <div class="open-pdf">Open PDF →</div>
    `;

    list.appendChild(card);
  });
}

// ================================
// Bind UI
// ================================
document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-programme]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.programme = btn.dataset.programme;
    applyFilters();
  };
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-stream]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.stream = btn.dataset.stream;
    applyFilters();
  };
});

document.getElementById("searchInput").oninput = e => {
  filters.search = e.target.value;
  applyFilters();
};

document.getElementById("sortSelect").onchange = e => {
  filters.sort = e.target.value;
  applyFilters();
};

// ================================
// Init
// ================================
(async function init() {
  await loadPapers();
  applyFilters();
})();
