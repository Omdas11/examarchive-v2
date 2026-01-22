const searchInput = document.querySelector(".search-input");
const resultsBox = document.querySelector(".search-results");
const modeBtn = document.getElementById("searchModeBtn");
const dropdown = document.getElementById("searchModeDropdown");

let PAPERS = [];
let currentMode = "universal";

/* ---------- Load papers.json once ---------- */
fetch("data/papers.json")
  .then(res => res.json())
  .then(data => {
    PAPERS = data;
  })
  .catch(err => {
    console.error("Failed to load papers.json", err);
  });

/* ---------- Search mode dropdown ---------- */
modeBtn.addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});

dropdown.addEventListener("click", e => {
  if (!e.target.dataset.mode) return;

  currentMode = e.target.dataset.mode;
  modeBtn.textContent = e.target.textContent;

  dropdown.querySelectorAll("button").forEach(btn =>
    btn.classList.remove("active")
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

  if (!q || q.length < 2) {
    resultsBox.style.display = "none";
    resultsBox.innerHTML = "";
    return;
  }

  // For now: only papers are searchable
  if (currentMode !== "universal" && currentMode !== "papers") {
    resultsBox.innerHTML = `
      <div class="result-item">Search mode coming soon</div>
    `;
    resultsBox.style.display = "block";
    return;
  }

  const matches = PAPERS.filter(p =>
    p.search_text?.toLowerCase().includes(q) ||
    p.paper_code?.toLowerCase().includes(q) ||
    p.paper_name?.toLowerCase().includes(q) ||
    String(p.year).includes(q)
  ).slice(0, 8); // limit results

  renderPaperResults(matches);
});

/* ---------- Render Results ---------- */
function renderPaperResults(list) {
  if (!list.length) {
    resultsBox.innerHTML = `
      <div class="result-item">No results found</div>
    `;
    resultsBox.style.display = "block";
    return;
  }

  resultsBox.innerHTML = `
    <div class="result-group">
      <h4>Papers</h4>
      ${list.map(p => `
        <div class="result-item" data-code="${p.paper_code}">
          ${p.paper_code} — ${p.paper_name} (${p.year})
        </div>
      `).join("")}
    </div>
  `;

  resultsBox.style.display = "block";
}

/* ---------- Click Result ---------- */
resultsBox.addEventListener("click", e => {
  const item = e.target.closest(".result-item");
  if (!item || !item.dataset.code) return;

  window.location.href = `paper.html?code=${item.dataset.code}`;
});
