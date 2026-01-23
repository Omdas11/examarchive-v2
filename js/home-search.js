/**
 * ExamArchive v2 — Home Search (FINAL STABLE + CATEGORIES)
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
function normalize(text = "") {
  return String(text).toLowerCase();
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

/* ---------------- Category Detection ---------------- */
function detectCategories(query) {
  const q = normalize(query);

  const subjects = {};
  const programmes = {};
  const streams = {};

  PAPERS.forEach(p => {
    if (p.subject && normalize(p.subject).includes(q)) {
      subjects[p.subject] = true;
    }
    if (p.programme && normalize(p.programme).includes(q)) {
      programmes[p.programme] = true;
    }
    if (p.stream && normalize(p.stream).includes(q)) {
      streams[p.stream] = true;
    }
  });

  return {
    subjects: Object.keys(subjects),
    programmes: Object.keys(programmes),
    streams: Object.keys(streams)
  };
}

/* ---------------- Paper Search ---------------- */
function searchPapers(query) {
  const q = normalize(query);

  return PAPERS.filter(p => {
    return [
      p.paper_code,
      p.paper_name,
      p.subject,
      p.programme,
      p.stream,
      p.year
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ")
      .includes(q);
  }).slice(0, 5);
}

/* ---------------- Render Results ---------------- */
function renderResults(query) {
  if (!query) return clearResults();

  let html = "";
  const categories = detectCategories(query);
  const paperMatches = searchPapers(query);

  /* ---------- Categories ---------- */
  if (
    categories.subjects.length ||
    categories.programmes.length ||
    categories.streams.length
  ) {
    html += `<div class="result-group"><h4>Categories</h4>`;

    categories.subjects.forEach(s => {
      html += `
        <div class="result-item"
             onclick="location.href='browse.html?subject=${encodeURIComponent(s)}'">
          📘 Subject: ${s}
        </div>`;
    });

    categories.programmes.forEach(p => {
      html += `
        <div class="result-item"
             onclick="location.href='browse.html?programme=${encodeURIComponent(p)}'">
          📘 Programme: ${p}
        </div>`;
    });

    categories.streams.forEach(s => {
      html += `
        <div class="result-item"
             onclick="location.href='browse.html?stream=${encodeURIComponent(s)}'">
          🏫 Stream: ${s}
        </div>`;
    });

    html += `</div>`;
  }

  /* ---------- Papers ---------- */
  if ((SEARCH_MODE === "universal" || SEARCH_MODE === "papers") && paperMatches.length) {
    html += `
      <div class="result-group">
        <h4>Papers</h4>
        ${paperMatches.map(p => `
          <div class="result-item"
               onclick="location.href='paper.html?code=${p.paper_code}'">
            ${p.paper_code} — ${p.paper_name} (${p.year})
          </div>
        `).join("")}
      </div>`;
  }

  /* ---------- Placeholders ---------- */
  if (SEARCH_MODE === "universal" || SEARCH_MODE === "rq") {
    html += `
      <div class="result-group">
        <h4>Repeated Questions</h4>
        <div class="result-item text-muted">RQ search coming soon</div>
      </div>`;
  }

  if (SEARCH_MODE === "universal" || SEARCH_MODE === "notes") {
    html += `
      <div class="result-group">
        <h4>Notes</h4>
        <div class="result-item text-muted">Notes search coming soon</div>
      </div>`;
  }

  if (!html.trim()) return showEmpty();

  resultsBox.innerHTML = html;
  resultsBox.style.display = "block";
}

/* ---------------- Input Events ---------------- */
input.addEventListener("input", e => {
  const q = e.target.value.trim();
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

    const q = input.value.trim();
    if (q) renderResults(q);
  });
});
