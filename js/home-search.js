/* ==================================================
   ExamArchive v2 — Home Universal Search (FINAL)
   Features:
   1. Universal + Mode-based Search
   2. Question Papers search
   3. Repeated Questions search
   4. Auto-scroll + highlight (via localStorage)
   ================================================== */

const searchInput = document.querySelector(".search-input");
const resultsBox = document.querySelector(".search-results");
const modeBtn = document.getElementById("searchModeBtn");
const dropdown = document.getElementById("searchModeDropdown");

let PAPERS = [];
let RQ_DATA = [];
let currentMode = "universal";

/* ---------- Load papers.json ---------- */
fetch("data/papers.json")
  .then(res => res.json())
  .then(data => {
    PAPERS = data;
    loadRQFiles();
  })
  .catch(err => console.error("Failed to load papers.json", err));

/* ---------- Load RQ files safely ---------- */
function loadRQFiles() {
  PAPERS.forEach(paper => {
    fetch(`data/repeated-questions/${paper.paper_code}.json`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) RQ_DATA.push(data);
      })
      .catch(() => {});
  });
}

/* ---------- Mode Dropdown ---------- */
modeBtn.addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});

dropdown.addEventListener("click", e => {
  if (!e.target.dataset.mode) return;

  currentMode = e.target.dataset.mode;
  modeBtn.textContent = e.target.textContent;

  dropdown.querySelectorAll("button").forEach(b =>
    b.classList.remove("active")
  );
  e.target.classList.add("active");

  dropdown.style.display = "none";
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrapper")) {
    dropdown.style.display = "none";
  }
});

/* ---------- Instant Search ---------- */
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();

  if (q.length < 2) {
    resultsBox.innerHTML = "";
    resultsBox.style.display = "none";
    return;
  }

  const papers =
    (currentMode === "universal" || currentMode === "papers")
      ? searchPapers(q)
      : [];

  const rqs =
    (currentMode === "universal" || currentMode === "rq")
      ? searchRQ(q)
      : [];

  renderResults(papers, rqs, q);
});

/* ---------- Paper Search ---------- */
function searchPapers(q) {
  return PAPERS.filter(p =>
    p.search_text?.toLowerCase().includes(q) ||
    p.paper_code?.toLowerCase().includes(q) ||
    p.paper_name?.toLowerCase().includes(q) ||
    String(p.year).includes(q)
  ).slice(0, 5);
}

/* ---------- RQ Search ---------- */
function searchRQ(q) {
  const hits = [];

  RQ_DATA.forEach(paper => {
    paper.units?.forEach(unit => {
      unit.questions?.forEach(question => {
        if (question.toLowerCase().includes(q)) {
          hits.push({
            paper_code: paper.paper_code,
            question
          });
        }
      });
    });
  });

  return hits.slice(0, 5);
}

/* ---------- Render Results ---------- */
function renderResults(papers, rqs, q) {
  if (!papers.length && !rqs.length) {
    resultsBox.innerHTML = `<div class="result-item">No results found</div>`;
    resultsBox.style.display = "block";
    return;
  }

  let html = "";

  if (papers.length) {
    html += `
      <div class="result-group">
        <h4>Papers</h4>
        ${papers.map(p => `
          <div class="result-item paper" data-code="${p.paper_code}">
            ${p.paper_code} — ${p.paper_name} (${p.year})
          </div>
        `).join("")}
      </div>
    `;
  }

  if (rqs.length) {
    html += `
      <div class="result-group">
        <h4>Repeated Questions</h4>
        ${rqs.map(rq => `
          <div class="result-item rq"
               data-code="${rq.paper_code}"
               data-query="${q}">
            ${rq.question}
          </div>
        `).join("")}
      </div>
    `;
  }

  resultsBox.innerHTML = html;
  resultsBox.style.display = "block";
}

/* ---------- Click Handling ---------- */
resultsBox.addEventListener("click", e => {
  const item = e.target.closest(".result-item");
  if (!item) return;

  const code = item.dataset.code;

  // If RQ result → store highlight instruction
  if (item.classList.contains("rq")) {
    localStorage.setItem(
      "rqSearch",
      JSON.stringify({
        highlight: item.dataset.query
      })
    );
  }

  window.location.href = `paper.html?code=${code}`;
});
