/**
 * ExamArchive v2 — Browse Page (STABLE RESTORE)
 * Matches browse.html + browse.css + papers.json
 */

const PAPERS_URL = "./data/papers.json";

let papers = [];
let view = [];

const filters = {
  programme: "ALL",
  stream: "ALL",
  year: "ALL",
  search: "",
  sort: "newest"
};

// -------------------- Helpers --------------------
const norm = v => String(v || "").toLowerCase();

const extractYear = pdf => {
  const m = pdf.match(/(20\d{2})/);
  return m ? m[1] : null;
};

const shortCode = code =>
  code.replace(/^AU(CBCS|FYUG)/i, "");

const semesterFromCode = code => {
  const m = code.match(/(\d)(0[1-8])/);
  return m ? `Sem ${m[2][1]}` : "—";
};

// -------------------- Load --------------------
async function loadPapers() {
  const res = await fetch(PAPERS_URL);
  papers = await res.json();
}

// -------------------- Apply Filters --------------------
function applyFilters() {
  view = [...papers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  if (filters.stream !== "ALL") {
    view = view.filter(
      p => norm(p.stream) === norm(filters.stream)
    );
  }

  if (filters.year !== "ALL") {
    view = view.filter(
      p => extractYear(p.pdf) === filters.year
    );
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

// -------------------- Sort --------------------
function sortView() {
  view.sort((a, b) => {
    const ya = extractYear(a.pdf) || "";
    const yb = extractYear(b.pdf) || "";
    return filters.sort === "oldest"
      ? ya.localeCompare(yb)
      : yb.localeCompare(ya);
  });
}

// -------------------- Render --------------------
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
    const sem = semesterFromCode(p.paper_code);
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
        Assam University • ${p.programme} • ${p.stream.toUpperCase()} • ${sem} • ${year}
      </div>
      <div class="open-pdf">Open PDF →</div>
    `;

    list.appendChild(card);
  });
}

// -------------------- Year Toggle --------------------
function initYears() {
  const years = [...new Set(papers.map(p => extractYear(p.pdf)).filter(Boolean))]
    .sort((a, b) => b - a);

  const row = document.getElementById("yearToggle");
  row.innerHTML = `<button class="toggle-btn active" data-year="ALL">ALL</button>`;

  years.forEach(y => {
    const b = document.createElement("button");
    b.className = "toggle-btn";
    b.dataset.year = y;
    b.textContent = y;
    row.appendChild(b);
  });

  row.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.onclick = () => {
      row.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filters.year = btn.dataset.year;
      applyFilters();
    };
  });
}

// -------------------- Bind Controls --------------------
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
  filters.search = e.target.value;
  applyFilters();
});

const sort = document.getElementById("sortSelect");
sort.innerHTML = `
  <option value="newest">Year (Newest)</option>
  <option value="oldest">Year (Oldest)</option>
`;

sort.onchange = e => {
  filters.sort = e.target.value;
  applyFilters();
};

// -------------------- Init --------------------
(async function init() {
  await loadPapers();
  initYears();
  applyFilters();
})();
