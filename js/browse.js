/**
 * ExamArchive v2 — Browse Page (FINAL FIX)
 * Handles OBJECT-based papers.json correctly
 */
alert("browse.js loaded");
const DATA_URL = "/examarchive-v2/data/papers.json";

fetch(DATA_URL)
  .then(r => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(d => alert("Loaded papers: " + (Array.isArray(d) ? d.length : Object.keys(d).length)))
  .catch(e => alert("JSON load failed: " + e.message));

/* -------------------------------
   State
-------------------------------- */
let allPapers = [];
let view = [];

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
function norm(v) {
  return String(v || "").toLowerCase();
}

function extractYear(pdf) {
  const m = pdf.match(/(20\d{2})/);
  return m ? m[1] : "—";
}

function shortCode(code) {
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

/* -------------------------------
   Load data  ✅ FIX HERE
-------------------------------- */
async function loadPapers() {
  const res = await fetch(DATA_URL);
  const json = await res.json();

  // 🔥 THIS IS THE FIX
  allPapers = Array.isArray(json) ? json : Object.values(json);
}

/* -------------------------------
   Apply filters
-------------------------------- */
function applyFilters() {
  view = [...allPapers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  if (filters.stream !== "ALL") {
    view = view.filter(p => norm(p.stream) === norm(filters.stream));
  }

  if (filters.year !== "ALL") {
    view = view.filter(p => extractYear(p.pdf) === filters.year);
  }

  if (filters.search) {
    const q = norm(filters.search);
    view = view.filter(p =>
      norm(p.paper_code).includes(q) ||
      norm(p.paper_name).includes(q) ||
      extractYear(p.pdf).includes(q)
    );
  }

  view.sort((a, b) => {
    const ya = extractYear(a.pdf);
    const yb = extractYear(b.pdf);
    return filters.sort === "oldest"
      ? ya.localeCompare(yb)
      : yb.localeCompare(ya);
  });

  render();
}

/* -------------------------------
   Render cards
-------------------------------- */
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
    const year = extractYear(p.pdf);
    const code = shortCode(p.paper_code);

    const card = document.createElement("div");
    card.className = "paper-card";
    card.onclick = () => {
      window.location.href = `paper.html?code=${code}`;
    };

    card.innerHTML = `
      <div class="paper-name">${p.paper_name}</div>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        Assam University • ${p.programme} • ${p.stream.toUpperCase()} • ${year}
      </div>
      <div class="open-pdf"
           onclick="event.stopPropagation(); window.open('${p.pdf}', '_blank')">
        Open PDF →
      </div>
    `;

    list.appendChild(card);
  });
}

/* -------------------------------
   UI bindings (unchanged)
-------------------------------- */
document.querySelectorAll("#programmeToggle .toggle-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#programmeToggle .toggle-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.programme = btn.dataset.programme;
    applyFilters();
  };
});

document.querySelectorAll("#streamToggle .toggle-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#streamToggle .toggle-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.stream = btn.dataset.stream;
    applyFilters();
  };
});

document.getElementById("searchInput").oninput = e => {
  filters.search = e.target.value.trim();
  applyFilters();
};

const sortSelect = document.getElementById("sortSelect");
sortSelect.innerHTML = `
  <option value="newest">Year (Newest)</option>
  <option value="oldest">Year (Oldest)</option>
`;
sortSelect.onchange = e => {
  filters.sort = e.target.value;
  applyFilters();
};

/* -------------------------------
   Year toggle
-------------------------------- */
function buildYearToggle() {
  const years = [...new Set(allPapers.map(p => extractYear(p.pdf)))]
    .filter(y => y !== "—")
    .sort((a, b) => b.localeCompare(a));

  const wrap = document.getElementById("yearToggle");
  wrap.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => setYear("ALL", allBtn);
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
  document.querySelectorAll("#yearToggle .toggle-btn")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  filters.year = y;
  applyFilters();
}

/* -------------------------------
   Init
-------------------------------- */
(async function () {
  await loadPapers();
  buildYearToggle();
  applyFilters();
})();
