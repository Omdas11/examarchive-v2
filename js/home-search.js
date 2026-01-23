/**
 * ExamArchive v2 — Home Search
 * FINAL (schema-aware for papers.json)
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
    console.warn("Home search: papers.json failed to load");
  });

/* ---------------- Helpers ---------------- */
function normalize(v = "") {
  return String(v).toLowerCase();
}

function clearResults() {
  resultsBox.style.display = "none";
  resultsBox.innerHTML = "";
}

function showEmpty() {
  resultsBox.innerHTML = `
    <div class="result-item text-muted">No results found</div>
  `;
  resultsBox.style.display = "block";
}

/* ---------------- Paper Search ---------------- */
function searchPapers(query) {
  const q = normalize(query);

  return PAPERS.filter(p => {
    const haystack = [
      ...(p.paper_codes || []),
      ...(p.paper_names || []),
      p.subject,
      p.programme,
      p.stream,
      ...(p.tags || []),
      p.year
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");

    return haystack.includes(q);
  }).slice(0, 6);
}

/* ---------------- Render ---------------- */
function renderResults(query) {
  if (!query) return clearResults();

  let html = "";

  /* ---------- PAPERS (PRIMARY) ---------- */
  if (SEARCH_MODE === "universal" || SEARCH_MODE === "papers") {
    const matches = searchPapers(query);

    if (matches.length) {
      html += `
        <div class="result-group">
          <h4>Papers</h4>
          ${matches.map(p => {
            const code = p.paper_codes?.[0] || "";
            const name = p.paper_names?.[0] || "";
            const year = p.year || "";

            return `
              <div class="result-item"
                   onclick="location.href='paper.html?code=${code}'">
                ${code} — ${name}${year ? ` (${year})` : ""}
              </div>
            `;
          }).join("")}
        </div>
      `;
    }
  }

  /* ---------- PLACEHOLDERS ---------- */
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

  if (!html.trim()) return showEmpty();

  resultsBox.innerHTML = html;
  resultsBox.style.display = "block";
}

/* ---------------- Input ---------------- */
input.addEventListener("input", e => {
  const q = e.target.value.trim();
  renderResults(q);
});

/* ---------------- Outside Click ---------------- */
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

    const q = input.value.trim();
    if (q) renderResults(q);
  });
});
