/**
 * ExamArchive v2 — Browse Page (RESTORED + STABLE)
 * One card per PDF | Dynamic filters | SEO-safe
 */

const PAPERS_URL = "./data/papers.json";

/* -----------------------------
   State
----------------------------- */
let papers = [];
let view = [];

let filters = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  sort: "newest",
  search: ""
};

/* -----------------------------
   Helpers
----------------------------- */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function norm(v) {
  return String(v || "").toLowerCase();
}

function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? m[1] : null;
}

function shortCode(code) {
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

function extractSemester(code) {
  const m = code.match(/(\d)(0[1-8])/);
  if (!m) return "—";
  return `Sem ${m[2][1]}`;
}

/* -----------------------------
   Load
----------------------------- */
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  papers = await res.json();
}

/* -----------------------------
   Year Filter Builder
----------------------------- */
function buildYearFilter() {
  const wrap = $("#yearToggle");
  if (!wrap) return;

  const years = [...new Set(
    papers.map(p => extractYear(p.pdf)).filter(Boolean)
  )].sort((a, b) => b - a);

  wrap.innerHTML = `
    <button class="toggle-btn active" data-year="ALL">ALL</button>
    ${years.map(y =>
      `<button class="toggle-btn" data-year="${y}">${y}</button>`
    ).join("")}
  `;

  wrap.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      filters.year = btn.dataset.year;
      updateActive(wrap, btn);
      applyFilters();
    });
  });
}

/* -----------------------------
   Filters
----------------------------- */
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

  sortView();
  render();
}

/* -----------------------------
   Sort
----------------------------- */
function sortView() {
  if (filters.sort === "newest") {
    view.sort((a, b) =>
      (extractYear(b.pdf) || 0) - (extractYear(a.pdf) || 0)
    );
  }
}

/* -----------------------------
   Render
----------------------------- */
function render() {
  const list = $("#papersList");
  const count = $("#paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  view.forEach(p => {
    const year = extractYear(p.pdf) || "—";
    const sem = extractSemester(p.paper_code);
    const code = shortCode(p.paper_code);

    const card = document.createElement("div");
    card.className = "paper-card";
    card.onclick = () => {
      window.location.href = `paper.html?code=${code}`;
    };

    card.innerHTML = `
      <h3 class="paper-title">${p.paper_name || "Paper title pending"}</h3>
      <p class="paper-code">${code}</p>
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

/* -----------------------------
   UI helpers
----------------------------- */
function updateActive(group, activeBtn) {
  group.querySelectorAll(".toggle-btn").forEach(b =>
    b.classList.remove("active")
  );
  activeBtn.classList.add("active");
}

/* -----------------------------
   Bind controls
----------------------------- */
$$("[data-programme]").forEach(btn => {
  btn.addEventListener("click", () => {
    filters.programme = btn.dataset.programme;
    updateActive($("#programmeToggle"), btn);
    applyFilters();
  });
});

$$("[data-stream]").forEach(btn => {
  btn.addEventListener("click", () => {
    filters.stream = btn.dataset.stream;
    updateActive($("#streamToggle"), btn);
    applyFilters();
  });
});

$("#searchInput")?.addEventListener("input", e => {
  filters.search = e.target.value;
  applyFilters();
});

$("#sortSelect")?.addEventListener("change", e => {
  filters.sort = e.target.value;
  applyFilters();
});

/* -----------------------------
   Init
----------------------------- */
(async function init() {
  await loadPapers();
  buildYearFilter();
  applyFilters();
})();
