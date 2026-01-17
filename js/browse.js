/**
 * ExamArchive v2 — Browse Page (STABLE FINAL)
 * DOM-aligned with browse.html
 */

const PAPERS_URL = "./data/papers.json";

let papers = [];
let view = [];

let filters = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  sort: "newest",
  search: ""
};

/* =========================
   Helpers
========================= */
const $ = id => document.getElementById(id);

function norm(v) {
  return String(v || "").toLowerCase();
}

function extractYear(pdf) {
  const m = pdf.match(/(20\d{2})/);
  return m ? m[1] : "";
}

function shortCode(code) {
  return code.replace(/^AU(CBCS|FYUG)/i, "");
}

function extractSemester(code) {
  const m = code.match(/(\d)(0[1-8])/);
  return m ? `Sem ${m[2][1]}` : "—";
}

/* =========================
   Load
========================= */
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  papers = await res.json();
}

/* =========================
   Filters
========================= */
function applyFilters() {
  view = [...papers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  view = view.filter(
    p => norm(p.stream) === norm(filters.stream)
  );

  if (filters.year !== "ALL") {
    view = view.filter(p => extractYear(p.pdf) === filters.year);
  }

  if (filters.search) {
    view = view.filter(p =>
      norm(p.paper_code + p.paper_name + extractYear(p.pdf))
        .includes(filters.search)
    );
  }

  sortView();
  render();
}

/* =========================
   Sort
========================= */
function sortView() {
  if (filters.sort === "newest") {
    view.sort((a, b) =>
      extractYear(b.pdf).localeCompare(extractYear(a.pdf))
    );
  }
}

/* =========================
   Render
========================= */
function render() {
  const list = $("papersList");
  const count = $("paperCount");

  // CLEAR skeletons
  list.innerHTML = "";

  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  view.forEach(p => {
    const year = extractYear(p.pdf);
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
      <a class="paper-link" href="${p.pdf}" target="_blank"
         onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

/* =========================
   UI bindings
========================= */
document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#programmeToggle .toggle-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    filters.programme = btn.dataset.programme;
    applyFilters();
  };
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#streamToggle .toggle-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    filters.stream = btn.dataset.stream;
    applyFilters();
  };
});

$("searchInput").oninput = e => {
  filters.search = norm(e.target.value);
  applyFilters();
};

$("sortSelect").onchange = e => {
  filters.sort = e.target.value;
  applyFilters();
};

/* =========================
   Init
========================= */
(async function init() {
  await loadPapers();
  applyFilters();
})();
