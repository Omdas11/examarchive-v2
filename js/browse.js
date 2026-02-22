/**
 * ExamArchive v2 — Browse Page
 * Phase 2: Fully database-driven from Supabase submissions table
 */

/* -------------------- State -------------------- */
let allPapers = [];
let view = [];

// Cache for signed URLs (path → { url, expiresAt })
const signedUrlCache = new Map();
const SIGNED_URL_TTL = 3600; // 1 hour

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

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* -------------------- DOM -------------------- */
const sortTrigger = document.getElementById("sortTrigger");
const sortOverlay = document.getElementById("sortOverlay");
const sortSheet = document.getElementById("sortSheet");
const sortOptionsEl = document.getElementById("sortOptions");
const closeSortBtn = document.getElementById("closeSort");
const cancelSortBtn = document.getElementById("cancelSort");
const currentSortLabel = document.getElementById("currentSort");

/* -------------------- Signed URL -------------------- */
/**
 * Get a signed URL for a file in uploads-approved bucket
 * Uses cache and auto-refreshes when expired
 */
async function getSignedUrl(supabase, filePath) {
  if (!filePath) return '#';

  const cached = signedUrlCache.get(filePath);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.url;
  }

  try {
    const { data, error } = await supabase.storage
      .from('uploads-approved')
      .createSignedUrl(filePath, SIGNED_URL_TTL);

    if (error || !data?.signedUrl) {
      return '#';
    }

    signedUrlCache.set(filePath, {
      url: data.signedUrl,
      expiresAt: Date.now() + (SIGNED_URL_TTL - 60) * 1000 // refresh 60s before expiry (converting seconds to ms)
    });

    if (window.Debug) {
      window.Debug.logInfo('storage', 'Signed URL generated', { path: filePath });
    }

    return data.signedUrl;
  } catch {
    return '#';
  }
}

/* -------------------- Load -------------------- */
async function loadPapers() {
  try {
    if (!window.waitForSupabase) {
      allPapers = [];
      return;
    }
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      allPapers = [];
      return;
    }

    // Load published submissions from Supabase
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('Could not load published papers:', error.message);
      allPapers = [];
      return;
    }

    // Map submissions to display format with signed URLs
    // Filter out demo papers — only show real uploads
    const papers = await Promise.all((data || []).filter(s => !s.is_demo).map(async (s) => {
      const pdfUrl = s.approved_path
        ? await getSignedUrl(supabase, s.approved_path)
        : '#';

      return {
        paper_codes: [s.paper_code],
        paper_names: [s.original_filename ? s.original_filename.replace(/\.pdf$/i, '') : s.paper_code],
        year: s.year,
        stream: 'Science',
        programme: 'ALL',
        university: 'ExamArchive',
        semester: 0,
        pdf: pdfUrl,
        is_demo: s.is_demo || false,
        file_size: s.file_size,
        published_at: s.published_at,
        approved_path: s.approved_path,
        original_filename: s.original_filename,
        is_published: true
      };
    }));

    allPapers = papers;

    if (window.Debug) {
      window.Debug.logInfo('system', `Loaded ${allPapers.length} published papers from database`);
    }
  } catch (err) {
    console.warn('Error loading papers:', err);
    allPapers = [];
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
  view = [...allPapers];

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
        ? `<span class="availability-badge subtle" style="background: var(--accent-soft); color: var(--accent);">🧪 DEMO PAPER</span>`
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

    const fileSizeStr = p.file_size ? ` • ${formatFileSize(p.file_size)}` : '';
    const publishedStr = p.published_at
      ? ` • ${new Date(p.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
      : '';

    card.innerHTML = `
      <h3 class="paper-name">${p.paper_names.join(" / ")}</h3>
      <div class="paper-code">${p.paper_codes.join(" / ")}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream.toUpperCase()}
        • ${p.year}${fileSizeStr}${publishedStr}
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
