/**
 * ExamArchive v2 — Home Search (FINAL, FIXED)
 */

const BASE = "https://omdas11.github.io/examarchive-v2";
const PAPERS_URL = `${BASE}/data/papers.json`;

const input = document.querySelector(".search-input");
const resultsBox = document.querySelector(".search-results");
const modeBtn = document.getElementById("searchModeBtn");
const modeDropdown = document.getElementById("searchModeDropdown");

let PAPERS = [];
let SEARCH_MODE = "universal";

/* ---------------- Load papers ---------------- */
fetch(PAPERS_URL)
  .then(r => r.json())
  .then(data => {
    PAPERS = Array.isArray(data) ? data : [];
  })
  .catch(() => {
    console.warn("Search: papers.json failed to load");
  });

/* ---------------- Helpers ---------------- */
function getPaperMeta(p) {
  const code = p.paper_code || p.code || "";
  const name = p.paper_name || p.name || "";
  const year = p.year || "";
  const subject = p.subject || "";
  const programme = p.programme || "";
  const stream = p.stream || "";

  return { code, name, year, subject, programme, stream };
}

function isRenderablePaper(p) {
  const { code, name } = getPaperMeta(p);
  return code.trim() !== "" || name.trim() !== "";
}

function normalizePaper(p) {
  const { code, name, year, subject, programme, stream } = getPaperMeta(p);

  return [
    code,
    name,
    subject,
    programme,
    stream,
    `${code} ${name}`,
    `${name} ${subject}`,
    String(year)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function clearResults() {
  resultsBox.style.display = "none";
  resultsBox.innerHTML = "";
}

function showEmpty() {
  resultsBox.innerHTML = `
    <div class="result-item text-muted">
      No results found
    </div>
  `;
  resultsBox.style.display = "block";
}

/* ---------------- Search Logic ---------------- */
function searchPapers(query) {
  return PAPERS
    .filter(p => normalizePaper(p).includes(query))
    .filter(isRenderablePaper)
    .slice(0, 5);
}

/* ---------------- Render ---------------- */
function renderResults(query) {
  if (!query) return clearResults();

  let html = "";

  /* ---------- Papers ---------- */
  if (SEARCH_MODE === "universal" || SEARCH_MODE === "papers") {
    const matches = searchPapers(query);

    if (matches.length) {
      html += `
        <div class="result-group">
          <h4>Papers</h4>
          ${matches
            .map(p => {
              const { code, name, year } = getPaperMeta(p);
              const label = code && name
                ? `${code} — ${name}`
                : name || code;

              return `
                <div class="result-item"
                     onclick="location.href='paper.html?code=${code}'">
                  ${label}${year ? ` (${year})` : ""}
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }
  }

  /* ---------- Repeated Questions (placeholder) ---------- */
  if (SEARCH_MODE === "universal" || SEARCH_MODE === "rq") {
    html += `
      <div class="result-group">
        <h4>Repeated Questions</h4>
        <div class="result-item text-muted">
          RQ search coming soon
        </div>
      </div>
    `;
  }

  /* ---------- Notes (placeholder) ---------- */
  if (SEARCH_MODE === "universal" || SEARCH_MODE === "notes") {
    html += `
      <div class="result-group">
        <h4>Notes</h4>
        <div class="result-item text-muted">
          Notes search coming soon
        </div>
      </div>
    `;
  }

  if (!html.trim()) {
    showEmpty();
  } else {
    resultsBox.innerHTML = html;
    resultsBox.style.display = "block";
  }
}

/* ---------------- Input Events ---------------- */
input.addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  renderResults(q);
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrapper")) {
    clearResults();
    modeDropdown.style.display = "none";
  }
});

/* ---------------- Mode Dropdown ---------------- */
modeBtn.addEventListener("click", () => {
  modeDropdown.style.display =
    modeDropdown.style.display === "block" ? "none" : "block";
});

modeDropdown.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    SEARCH_MODE = btn.dataset.mode;
    modeBtn.textContent = btn.textContent;

    modeDropdown
      .querySelectorAll("button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    modeDropdown.style.display = "none";

    const q = input.value.trim().toLowerCase();
    if (q) renderResults(q);
  });
});
