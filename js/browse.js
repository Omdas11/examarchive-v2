/**
 * ExamArchive v2 — Browse Page
 * Reads from data/papers.json (legacy) + approved_papers table (user uploads)
 */

// Use relative path to work with custom domain
const DATA_URL = "data/papers.json";

/* -------------------- State -------------------- */
let allPapers = [];
let approvedPapers = [];
let view = [];

let filters = {
  programme: "ALL",
  stream: "science",
  year: "ALL",
  search: "",
  sort: "year_desc"
};

/* -------------------- Helpers -------------------- */
const norm = v => String(v || "").toLowerCase();

function toRoman(num) {
  const map = [["X",10],["IX",9],["V",5],["IV",4],["I",1]];
  let r = "";
  for (const [k,v] of map) while (num >= v) { r += k; num -= v; }
  return r;
}

/* -------------------- DOM -------------------- */
const sortTrigger = document.getElementById("sortTrigger");
const sortOverlay = document.getElementById("sortOverlay");
const sortSheet = document.getElementById("sortSheet");
const sortOptionsEl = document.getElementById("sortOptions");
const closeSortBtn = document.getElementById("closeSort");
const cancelSortBtn = document.getElementById("cancelSort");
const currentSortLabel = document.getElementById("currentSort");

/* -------------------- Load -------------------- */
async function loadPapers() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch papers: ${res.status} ${res.statusText}`);
    }
    allPapers = await res.json();
    console.log(`Loaded ${allPapers.length} legacy papers`);
  } catch (error) {
    console.error("Error loading papers:", error);
    allPapers = [];
  }
  
  // Also load approved papers from Supabase
  await loadApprovedPapers();
}

/**
 * Load user-uploaded approved papers from Supabase approved_papers table
 * and from submissions where status = 'approved' (fallback)
 */
async function loadApprovedPapers() {
  try {
    if (!window.waitForSupabase) return;
    const supabase = await window.waitForSupabase();
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('approved_papers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Could not load approved papers:', error.message);
      approvedPapers = [];
    } else {
      approvedPapers = (data || []).map(p => ({
        paper_codes: [p.paper_code],
        paper_names: [p.paper_code],
        year: p.year,
        stream: 'Science',
        programme: 'ALL',
        university: 'User Upload',
        semester: 0,
        pdf: getApprovedPaperUrl(supabase, p.file_path),
        is_demo: p.is_demo || false,
        is_approved_upload: true
      }));
    }
    
    console.log(`Loaded ${approvedPapers.length} approved papers from database`);

    // Also load directly from submissions where status = 'approved' (fallback)
    // Only include submissions with an approved_path set in uploads-approved bucket
    const { data: approvedSubs, error: subsError } = await supabase
      .from('submissions')
      .select('paper_code, year, approved_path, user_id, created_at')
      .eq('status', 'approved')
      .not('approved_path', 'is', null);

    if (!subsError && approvedSubs?.length) {
      // Deduplicate: skip any paper_code+year already loaded from approved_papers
      const existingKeys = new Set(approvedPapers.map(p => `${p.paper_codes[0]}-${p.year}`));
      const submissionPapers = approvedSubs
        .filter(s => !existingKeys.has(`${s.paper_code}-${s.year}`))
        .map(s => ({
          paper_codes: [s.paper_code],
          paper_names: [s.paper_code],
          year: s.year,
          stream: 'Science',
          programme: 'ALL',
          university: 'User Upload',
          semester: 0,
          pdf: getApprovedPaperUrl(supabase, s.approved_path),
          is_demo: false,
          is_approved_upload: true
        }));
      approvedPapers = approvedPapers.concat(submissionPapers);
      console.log(`Loaded ${submissionPapers.length} additional approved papers from submissions`);
    }
  } catch (err) {
    console.warn('Error loading approved papers:', err);
    approvedPapers = [];
  }
}

/**
 * Get public URL for an approved paper
 */
function getApprovedPaperUrl(supabase, filePath) {
  try {
    const { data } = supabase.storage
      .from('uploads-approved')
      .getPublicUrl(filePath);
    return data?.publicUrl || '#';
  } catch {
    return '#';
  }
}

/* -------------------- Year Toggle -------------------- */
function buildYearToggle() {
  const yearToggle = document.getElementById("yearToggle");
  yearToggle.innerHTML = "";

  const years = [...new Set(allPapers.map(p => p.year))].sort((a,b)=>b-a);

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    setActive(yearToggle, allBtn);
    filters.year = "ALL";
    applyFilters();
  };
  yearToggle.appendChild(allBtn);

  years.forEach(y => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = y;
    btn.onclick = () => {
      setActive(yearToggle, btn);
      filters.year = String(y);
      applyFilters();
    };
    yearToggle.appendChild(btn);
  });
}

/* -------------------- Sort -------------------- */
function getSortOptions(programme) {
  const opts = [
    { key:"year_desc", label:"Year (Newest first)" },
    { key:"year_asc", label:"Year (Oldest first)" },
    { key:"name_asc", label:"Paper name (A–Z)" },
    { key:"name_desc", label:"Paper name (Z–A)" }
  ];

  if (programme === "FYUG" || programme === "CBCS") {
    opts.splice(2,0,
      { key:"semester_asc", label:"Semester (1 → Latest)" },
      { key:"semester_desc", label:"Semester (Latest → 1)" }
    );
  }
  return opts;
}

function renderSortOptions() {
  sortOptionsEl.innerHTML = "";
  const opts = getSortOptions(filters.programme);

  opts.forEach(o => {
    const btn = document.createElement("button");
    btn.className = "sort-option";
    if (filters.sort === o.key) btn.classList.add("active");
    btn.innerHTML = `<span class="radio"></span>${o.label}`;
    btn.onclick = () => {
      filters.sort = o.key;
      currentSortLabel.textContent = o.label;
      closeSort();
      applyFilters();
    };
    sortOptionsEl.appendChild(btn);
  });

  const active = opts.find(o => o.key === filters.sort);
  if (active) currentSortLabel.textContent = active.label;
}

function openSort() {
  renderSortOptions();
  sortOverlay.hidden = false;
  sortSheet.hidden = false;
}

function closeSort() {
  sortOverlay.hidden = true;
  sortSheet.hidden = true;
}

/* -------------------- Filters -------------------- */
function applyFilters() {
  // Combine legacy papers + approved uploads
  const combined = [...allPapers, ...approvedPapers];
  view = [...combined];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  view = view.filter(p => norm(p.stream) === filters.stream);

  if (filters.year !== "ALL") {
    view = view.filter(p => String(p.year) === filters.year);
  }

  if (filters.search) {
    view = view.filter(p =>
      norm(p.paper_names.join(" ")).includes(filters.search) ||
      norm(p.paper_codes.join(" ")).includes(filters.search) ||
      String(p.year).includes(filters.search)
    );
  }

  applySort();
  render();
}

/* -------------------- Sort Apply -------------------- */
function applySort() {
  switch (filters.sort) {
    case "year_desc": view.sort((a,b)=>b.year-a.year); break;
    case "year_asc": view.sort((a,b)=>a.year-b.year); break;
    case "semester_asc": view.sort((a,b)=>a.semester-b.semester); break;
    case "semester_desc": view.sort((a,b)=>b.semester-a.semester); break;
    case "name_asc":
      view.sort((a,b)=>a.paper_names[0].localeCompare(b.paper_names[0]));
      break;
    case "name_desc":
      view.sort((a,b)=>b.paper_names[0].localeCompare(a.paper_names[0]));
      break;
  }
}

/* -------------------- Render -------------------- */
function render() {
  const list = document.getElementById("papersList");
  const count = document.getElementById("paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="empty">No papers found for the selected filters.</p>`;
    return;
  }

  view.forEach(p => {
    const card = document.createElement("div");
    card.className = "paper-card";
    card.onclick = () => {
      window.location.href =
        `paper.html?code=${p.paper_codes[0]}&year=${p.year}`;
    };

    const badges = `
  <div class="availability-badges">
    ${
      p.is_demo
        ? `<span class="availability-badge subtle" style="background: var(--accent-soft); color: var(--accent);">DEMO</span>`
        : ""
    }
    ${
      p.has_rq
        ? `<span class="availability-badge subtle">Repeated Questions</span>`
        : ""
    }
    ${
      p.has_notes
        ? `<span class="availability-badge subtle">Notes</span>`
        : ""
    }
  </div>
`;

    card.innerHTML = `
      <h3 class="paper-name">${p.paper_names.join(" / ")}</h3>
      <div class="paper-code">${p.paper_codes.join(" / ")}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream.toUpperCase()}
        • Semester ${toRoman(p.semester)} • ${p.year}
      </div>
      ${badges}
      <a class="open-pdf"
         href="${p.pdf}"
         target="_blank"
         onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;
    list.appendChild(card);
  });
}

/* -------------------- UI Helpers -------------------- */
function setActive(group, btn) {
  group.querySelectorAll(".toggle-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}

/* -------------------- Bind -------------------- */
sortTrigger.onclick = openSort;
sortOverlay.onclick = closeSort;
closeSortBtn.onclick = closeSort;
cancelSortBtn.onclick = closeSort;

document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-programme]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    filters.programme = btn.dataset.programme;
    renderSortOptions();
    applyFilters();
  };
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-stream]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    filters.stream = btn.dataset.stream.toLowerCase();
    applyFilters();
  };
});

document.getElementById("searchInput").addEventListener("input", e => {
  filters.search = norm(e.target.value);
  applyFilters();
});

/* -------------------- Init -------------------- */
(async function () {
  try {
    await loadPapers();
    buildYearToggle();
    renderSortOptions();
    applyFilters();
    document.getElementById("paperCount").textContent = `Showing ${view.length} papers`;
  } catch (error) {
    console.error("Failed to initialize browse page:", error);
    document.getElementById("paperCount").textContent = "Error loading papers. Please refresh the page.";
  }
})();
