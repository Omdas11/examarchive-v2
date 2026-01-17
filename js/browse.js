/**
 * ExamArchive v2 — Browse Page (STABLE RESTORE)
 * Schema-safe | No inferred data | SEO-ready
 */

const DATA_URL = "./data/papers.json";

/* -------------------------------
   State
-------------------------------- */
let allPapers = [];
let filtered = [];

let filters = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  search: "",
  sort: "newest"
};

/* -------------------------------
   Helpers
-------------------------------- */
function normalize(v) {
  return String(v || "").toLowerCase();
}

function extractYear(pdfPath) {
  const m = pdfPath.match(/(20\d{2})/);
  return m ? m[1] : "—";
}

function shortCode(fullCode) {
  // AU + CBCS/FYUG prefix removal
  return fullCode.replace(/^AU(CBCS|FYUG)?/i, "");
}

/* -------------------------------
   Load data
-------------------------------- */
async function loadPapers() {
  const res = await fetch(DATA_URL);
  allPapers = await res.json();
}

/* -------------------------------
   Apply filters
-------------------------------- */
function applyFilters() {
  filtered = [...allPapers];

  // Programme
  if (filters.programme !== "ALL") {
    filtered = filtered.filter(
      p => p.programme === filters.programme
    );
  }

  // Stream
  if (filters.stream !== "ALL") {
    filtered = filtered.filter(
      p => normalize(p.stream) === normalize(filters.stream)
    );
  }

  // Year
  if (filters.year !== "ALL") {
    filtered = filtered.filter(
      p => extractYear(p.pdf) === filters.year
    );
  }

  // Search
  if (filters.search) {
    const q = normalize(filters.search);
    filtered = filtered.filter(p =>
      normalize(p.paper_code).includes(q) ||
      normalize(p.paper_name).includes(q) ||
      extractYear(p.pdf).includes(q)
    );
  }

  // Sort
  filtered.sort((a, b) => {
    const ya = extractYear(a.pdf);
    const yb = extractYear(b.pdf);
    return filters.sort === "oldest"
      ? ya.localeCompare(yb)
      : yb.localeCompare(ya);
  });

  render();
}

/* -------------------------------
   Render
-------------------------------- */
function render() {
  const list = document.getElementById("papersList");
  const count = document.getElementById("paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${filtered.length} papers`;

  if (!filtered.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  filtered.forEach(p => {
    const year = extractYear(p.pdf);
    const code = shortCode(p.paper_code);

    const card = document.createElement("div");
    card.className = "paper-card";
    card.onclick = () => {
      window.location.href = `paper.html?code=${code}`;
    };

    card.innerHTML = `
      <div class="paper-name">${p.paper_name || "Paper title pending"}</div>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        Assam University • ${p.programme} • ${p.stream.toUpperCase()} • ${year}
      </div>
      <div class="open-pdf" onclick="event.stopPropagation(); window.open('${p.pdf}', '_blank')">
        Open PDF →
      </div>
    `;

    list.appendChild(card);
  });
}

/* -------------------------------
   UI bindings
-------------------------------- */

// Programme toggle
document.querySelectorAll("#programmeToggle .toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("#programmeToggle .toggle-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    filters.programme = btn.dataset.programme;
    applyFilters();
  });
});

// Stream toggle
document.querySelectorAll("#streamToggle .toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("#streamToggle .toggle-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    filters.stream = btn.dataset.stream;
    applyFilters();
  });
});

// Year toggle (dynamic)
function buildYearToggle() {
  const years = [...new Set(allPapers.map(p => extractYear(p.pdf)))]
    .filter(y => y !== "—")
    .sort((a, b) => b.localeCompare(a));

  const wrap = document.getElementById("yearToggle");
  wrap.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    setYear("ALL", allBtn);
  };
  wrap.appendChild(allBtn);

  years.forEach(y => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = y;
    btn.onclick = () => setYear(y, btn);
    wrap.appendChild(btn);
  });
}

function setYear(y, btn) {
  document
    .querySelectorAll("#yearToggle .toggle-btn")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  filters.year = y;
  applyFilters();
}

// Search
document.getElementById("searchInput").addEventListener("input", e => {
  filters.search = e.target.value.trim();
  applyFilters();
});

// Sort
const sortSelect = document.getElementById("sortSelect");
sortSelect.innerHTML = `
  <option value="newest">Year (Newest)</option>
  <option value="oldest">Year (Oldest)</option>
`;
sortSelect.addEventListener("change", e => {
  filters.sort = e.target.value;
  applyFilters();
});

/* -------------------------------
   Init
-------------------------------- */
(async function init() {
  await loadPapers();
  buildYearToggle();
  applyFilters();
})();
