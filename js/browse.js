/**
 * ExamArchive v2 — Browse Page (RESTORED & STABLE)
 * DOM-aligned with browse.html
 */

const PAPERS_URL = "./data/papers.json";

let allPapers = [];
let filtered = [];

const state = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  search: "",
  sort: "newest"
};

// =======================
// Helpers
// =======================
const $ = id => document.getElementById(id);

function getYearFromPdf(path) {
  const m = path.match(/(20\d{2})/);
  return m ? m[1] : "—";
}

function shortCode(code) {
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

function semesterFromCode(code) {
  const m = code.match(/(\d)(0[1-8])/);
  return m ? `Sem ${m[2][1]}` : "—";
}

// =======================
// Load data
// =======================
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  allPapers = await res.json();
}

// =======================
// Build UI Controls
// =======================
function buildYearFilter() {
  const years = [...new Set(allPapers.map(p => getYearFromPdf(p.pdf)))]
    .filter(Boolean)
    .sort((a, b) => b - a);

  const wrap = $("yearToggle");
  wrap.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    state.year = "ALL";
    setActive(wrap, allBtn);
    apply();
  };
  wrap.appendChild(allBtn);

  years.forEach(y => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = y;
    btn.onclick = () => {
      state.year = y;
      setActive(wrap, btn);
      apply();
    };
    wrap.appendChild(btn);
  });
}

function buildSortOptions() {
  const select = $("sortSelect");
  select.innerHTML = `
    <option value="newest">Year (Newest)</option>
    <option value="oldest">Year (Oldest)</option>
  `;

  select.onchange = e => {
    state.sort = e.target.value;
    apply();
  };
}

// =======================
// Filters + Render
// =======================
function apply() {
  filtered = [...allPapers];

  if (state.programme !== "ALL") {
    filtered = filtered.filter(p => p.programme === state.programme);
  }

  if (state.stream !== "ALL") {
    filtered = filtered.filter(
      p => p.stream.toLowerCase() === state.stream.toLowerCase()
    );
  }

  if (state.year !== "ALL") {
    filtered = filtered.filter(p => getYearFromPdf(p.pdf) === state.year);
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    filtered = filtered.filter(p =>
      (p.paper_name || "").toLowerCase().includes(q) ||
      p.paper_code.toLowerCase().includes(q) ||
      p.pdf.includes(q)
    );
  }

  filtered.sort((a, b) => {
    const ya = getYearFromPdf(a.pdf);
    const yb = getYearFromPdf(b.pdf);
    return state.sort === "newest" ? yb - ya : ya - yb;
  });

  render();
}

function render() {
  const list = $("papersList");
  const count = $("paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${filtered.length} papers`;

  if (!filtered.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "paper-card";

    const year = getYearFromPdf(p.pdf);
    const sem = semesterFromCode(p.paper_code);
    const sc = shortCode(p.paper_code);

    card.onclick = () => {
      window.location.href = `paper.html?code=${sc}`;
    };

    card.innerHTML = `
      <h3 class="paper-title">${p.paper_name || "Paper title pending"}</h3>
      <p class="paper-code">${sc}</p>
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

// =======================
// Toggle helpers
// =======================
function setActive(container, btn) {
  container.querySelectorAll(".toggle-btn").forEach(b =>
    b.classList.remove("active")
  );
  btn.classList.add("active");
}

// =======================
// Bind UI
// =======================
document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.onclick = () => {
    state.programme = btn.dataset.programme;
    setActive($("programmeToggle"), btn);
    apply();
  };
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.onclick = () => {
    state.stream = btn.dataset.stream;
    setActive($("streamToggle"), btn);
    apply();
  };
});

$("searchInput").addEventListener("input", e => {
  state.search = e.target.value.trim();
  apply();
});

// =======================
// Init
// =======================
(async function init() {
  await loadPapers();
  buildYearFilter();
  buildSortOptions();
  apply();
})();
