/**
 * ExamArchive v2 — Browse Page
 * FINAL STABLE VERSION (Repo-only, schema-aligned)
 */

const DATA_URL = "https://omdas11.github.io/examarchive-v2/data/papers.json";

// --------------------
// State
// --------------------
let allPapers = [];
let view = [];

let filters = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  search: "",
  sort: "newest"
};

// --------------------
// Helpers
// --------------------
const norm = v => String(v || "").toLowerCase();

// --------------------
// Load JSON
// --------------------
async function loadPapers() {
  const res = await fetch(DATA_URL);
  allPapers = await res.json();
}

// --------------------
// Year Toggle
// --------------------
function buildYearToggle() {
  const yearToggle = document.getElementById("yearToggle");
  yearToggle.innerHTML = "";

  const years = [...new Set(allPapers.map(p => p.year))].sort((a, b) => b - a);

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    setActive(yearToggle, allBtn);
    filters.year = "ALL";
    applyFilters();
  };
  yearToggle.appendChild(allBtn);

  years.forEach(year => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = year;
    btn.onclick = () => {
      setActive(yearToggle, btn);
      filters.year = String(year);
      applyFilters();
    };
    yearToggle.appendChild(btn);
  });
}

// --------------------
// Filters
// --------------------
function applyFilters() {
  view = [...allPapers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  view = view.filter(p => norm(p.stream) === norm(filters.stream));

  if (filters.year !== "ALL") {
    view = view.filter(p => String(p.year) === filters.year);
  }

  if (filters.search) {
    view = view.filter(p =>
      norm(p.paper_names.join(" ")).includes(filters.search) ||
      norm(p.paper_codes.join(" ")).includes(filters.search) ||
      String(p.year).includes(filters.search)
    );
  }

  view.sort((a, b) =>
    filters.sort === "newest" ? b.year - a.year : a.year - b.year
  );

  render();
}

// --------------------
// Render Cards
// --------------------
function render() {
  const list = document.getElementById("papersList");
  const count = document.getElementById("paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  view.forEach(p => {
    const title = p.paper_names.join(" / ");
    const code = p.paper_codes.join(" / ");
    const pdfUrl = p.pdf;

    const card = document.createElement("div");
    card.className = "paper-card";

    card.onclick = () => {
      window.location.href = `paper.html?code=${p.paper_codes[0]}`;
    };

    card.innerHTML = `
      <h3 class="paper-name">${title}</h3>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream} • Sem ${p.semester} • ${p.year}
      </div>
      <a class="open-pdf" href="${pdfUrl}" target="_blank" onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

// --------------------
// UI Helpers
// --------------------
function setActive(group, btn) {
  group.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// --------------------
// Bind Controls
// --------------------
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

document.getElementById("searchInput").addEventListener("input", e => {
  filters.search = norm(e.target.value);
  applyFilters();
});

document.getElementById("sortSelect").addEventListener("change", e => {
  filters.sort = e.target.value;
  applyFilters();
});

// --------------------
// Init
// --------------------
(async function init() {
  await loadPapers();
  buildYearToggle();
  applyFilters();
})();
