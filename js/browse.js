/**
 * ExamArchive v2 — Browse Page (FINAL STABLE)
 * Cards guaranteed | Filters safe | Sort working
 */

const PAPERS_URL = "./data/papers.json";

/* ===============================
   State
=============================== */
let papers = [];
let view = [];

const filters = {
  programme: "ALL",
  stream: "ALL",   // 🔴 FIX: do NOT filter initially
  year: "ALL",
  sort: "newest",
  search: ""
};

/* ===============================
   Helpers
=============================== */
const $ = id => document.getElementById(id);

function norm(v) {
  return String(v || "").toLowerCase();
}

function extractYear(pdf) {
  const m = pdf?.match(/(20\d{2})/);
  return m ? m[1] : null;
}

function shortCode(code) {
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

function extractSemester(code) {
  const m = code.match(/(\d)(0[1-8])/);
  return m ? `Sem ${m[2][1]}` : "—";
}

/* ===============================
   Load
=============================== */
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  papers = await res.json();
}

/* ===============================
   Year Filter
=============================== */
function buildYearFilter() {
  const wrap = $("yearToggle");
  wrap.innerHTML = "";

  const years = [...new Set(
    papers.map(p => extractYear(p.pdf)).filter(Boolean)
  )].sort((a, b) => b - a);

  const makeBtn = (label, value) => {
    const b = document.createElement("button");
    b.className = "toggle-btn";
    b.textContent = label;
    b.onclick = () => {
      filters.year = value;
      setActive(wrap, b);
      applyFilters();
    };
    return b;
  };

  const allBtn = makeBtn("ALL", "ALL");
  allBtn.classList.add("active");
  wrap.appendChild(allBtn);

  years.forEach(y => wrap.appendChild(makeBtn(y, y)));
}

/* ===============================
   Sort Options
=============================== */
function buildSort() {
  const s = $("sortSelect");
  s.innerHTML = `
    <option value="newest">Year (Newest)</option>
    <option value="oldest">Year (Oldest)</option>
  `;
}

/* ===============================
   Filters
=============================== */
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

  if (filters.search) {
    const q = norm(filters.search);
    view = view.filter(p =>
      norm(p.paper_name).includes(q) ||
      norm(p.paper_code).includes(q) ||
      extractYear(p.pdf)?.includes(q)
    );
  }

  if (filters.sort === "newest") {
    view.sort((a, b) =>
      (extractYear(b.pdf) || 0) - (extractYear(a.pdf) || 0)
    );
  }

  if (filters.sort === "oldest") {
    view.sort((a, b) =>
      (extractYear(a.pdf) || 0) - (extractYear(b.pdf) || 0)
    );
  }

  render();
}

/* ===============================
   Render
=============================== */
function render() {
  const list = $("papersList");
  const count = $("paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  view.forEach(p => {
    const card = document.createElement("div");
    card.className = "paper-card";

    const year = extractYear(p.pdf) || "—";
    const sem = extractSemester(p.paper_code);
    const code = shortCode(p.paper_code);

    card.onclick = () => {
      location.href = `paper.html?code=${code}`;
    };

    card.innerHTML = `
      <div class="paper-name">${p.paper_name || "Paper title pending"}</div>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        Assam University • ${p.programme} • ${p.stream.toUpperCase()} • ${sem} • ${year}
      </div>
      <a class="open-pdf" href="${p.pdf}" target="_blank"
         onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

/* ===============================
   UI helpers
=============================== */
function setActive(container, active) {
  container.querySelectorAll(".toggle-btn").forEach(b =>
    b.classList.remove("active")
  );
  active.classList.add("active");
}

/* ===============================
   Bind Controls
=============================== */
document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.onclick = () => {
    filters.programme = btn.dataset.programme;
    setActive($("programmeToggle"), btn);
    applyFilters();
  };
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.onclick = () => {
    filters.stream = btn.dataset.stream;
    setActive($("streamToggle"), btn);
    applyFilters();
  };
});

$("searchInput").oninput = e => {
  filters.search = e.target.value;
  applyFilters();
};

$("sortSelect").onchange = e => {
  filters.sort = e.target.value;
  applyFilters();
};

/* ===============================
   Init
=============================== */
(async function init() {
  await loadPapers();
  buildYearFilter();
  buildSort();
  applyFilters();
})();
