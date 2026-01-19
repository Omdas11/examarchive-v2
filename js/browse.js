/**
 * ExamArchive v2 — Browse Page
 * FINAL STABLE VERSION (Bottom Sheet Sort – Enhanced)
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
  sort: "year_desc"
};

// --------------------
// Helpers
// --------------------
const norm = v => String(v || "").toLowerCase();

// --------------------
// DOM refs
// --------------------
const sortTrigger = document.getElementById("sortTrigger");
const sortOverlay = document.getElementById("sortOverlay");
const sortSheet = document.getElementById("sortSheet");
const sortOptionsEl = document.getElementById("sortOptions");
const closeSortBtn = document.getElementById("closeSort");
const cancelSortBtn = document.getElementById("cancelSort");
const currentSortLabel = document.getElementById("currentSort");

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
// Sort Options (Bottom Sheet)
// --------------------
function getSortOptions(programme) {
  const options = [
    { key: "year_desc", label: "Year (Newest first)" },
    { key: "year_asc", label: "Year (Oldest first)" },
    { key: "name_asc", label: "Paper name (A–Z)" },
    { key: "name_desc", label: "Paper name (Z–A)" }
  ];

  if (programme === "FYUG" || programme === "CBCS") {
    options.splice(2, 0,
      { key: "semester_asc", label: "Semester (1 → Latest)" },
      { key: "semester_desc", label: "Semester (Latest → 1)" }
    );
  }

  return options;
}

function renderSortOptions() {
  sortOptionsEl.innerHTML = "";

  const options = getSortOptions(filters.programme);

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "sort-option";
    if (filters.sort === opt.key) btn.classList.add("active");

    btn.innerHTML = `
      <span class="radio"></span>
      ${opt.label}
    `;

    btn.onclick = () => {
      filters.sort = opt.key;
      currentSortLabel.textContent = opt.label;
      closeSort();
      applyFilters();
    };

    sortOptionsEl.appendChild(btn);
  });

  const active = options.find(o => o.key === filters.sort);
  if (active) currentSortLabel.textContent = active.label;
}

// --------------------
// Sort Sheet Controls
// --------------------
function openSort() {
  renderSortOptions();
  sortOverlay.hidden = false;
  sortSheet.hidden = false;
  sortTrigger.setAttribute("aria-expanded", "true");
}

function closeSort() {
  sortOverlay.hidden = true;
  sortSheet.hidden = true;
  sortTrigger.setAttribute("aria-expanded", "false");
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

  applySort();
  render();
}

// --------------------
// Apply Sort
// --------------------
function applySort() {
  switch (filters.sort) {
    case "year_desc":
      view.sort((a, b) => b.year - a.year);
      break;

    case "year_asc":
      view.sort((a, b) => a.year - b.year);
      break;

    case "semester_asc":
      view.sort((a, b) => a.semester - b.semester);
      break;

    case "semester_desc":
      view.sort((a, b) => b.semester - a.semester);
      break;

    case "name_asc":
      view.sort((a, b) =>
        a.paper_names[0].localeCompare(b.paper_names[0])
      );
      break;

    case "name_desc":
      view.sort((a, b) =>
        b.paper_names[0].localeCompare(a.paper_names[0])
      );
      break;
  }
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
      <a class="open-pdf" href="${p.pdf}" target="_blank" onclick="event.stopPropagation()">
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
sortTrigger.onclick = openSort;
sortOverlay.onclick = closeSort;
closeSortBtn.onclick = closeSort;
cancelSortBtn.onclick = closeSort;

document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-programme]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.programme = btn.dataset.programme;
    renderSortOptions();
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

// --------------------
// Init
// --------------------
(async function init() {
  await loadPapers();
  buildYearToggle();
  renderSortOptions();
  applyFilters();
})();