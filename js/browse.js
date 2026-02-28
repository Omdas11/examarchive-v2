/**
 * ExamArchive v2 — Browse Page
 * Pre-Phase 7: Displays real DB fields, card flip with stats.
 */

/* -------------------- State -------------------- */
let allPapers = [];
let view = [];
const PAPERS_PER_PAGE = 12;
let currentPage = 1;

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

/* -------------------- PDF URL -------------------- */
/**
 * Resolve the PDF URL for a submission.
 * Phase 6: uses file_url (Appwrite) stored in DB.
 * Falls back to legacy approved_path via Supabase signed URL for pre-migration rows.
 */
async function getPdfUrl(supabase, submission) {
  // Phase 6: use stored Appwrite URL
  if (submission.file_url) return submission.file_url;

  // Legacy fallback: generate Supabase signed URL for pre-migration rows
  const path = submission.approved_path || submission.storage_path;
  if (!path || !supabase) return '#';

  try {
    const bucket = submission.approved_path ? 'uploads-approved' : 'uploads-temp';
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return '#';
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

    // Map university stored value to display label
    function mapUniversity(val) {
      if (!val || val === 'assam-university') return 'Assam University';
      if (val === 'other') return 'Other';
      return val;
    }

    // Map programme stored value to display label
    function mapProgramme(val) {
      const map = { fyug: 'FYUG', cbcs: 'CBCS', pg: 'PG', honours: 'Honours', general: 'General' };
      if (!val) return 'CBCS';
      return map[val.toLowerCase()] || val.toUpperCase();
    }

    // Map stream stored value to display label
    function mapStream(val) {
      if (!val) return 'Science';
      return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    }

    // Map paper name: prefer subject, then original_filename, then paper_code
    function mapPaperName(s) {
      if (s.subject && s.subject.trim()) return s.subject.trim();
      if (s.original_filename) return s.original_filename.replace(/\.pdf$/i, '');
      return s.paper_code || '—';
    }

    // Map submissions to display format with Appwrite URLs
    const papers = await Promise.all((data || []).map(async (s) => {
      const pdfUrl = await getPdfUrl(supabase, s);
      const semesterNum = s.semester ? parseInt(s.semester, 10) : 0;

      return {
        id: s.id,
        paper_codes: [s.paper_code],
        paper_names: [mapPaperName(s)],
        year: s.year,
        stream: mapStream(s.stream),
        programme: mapProgramme(s.programme),
        university: mapUniversity(s.university),
        semester: semesterNum,
        pdf: pdfUrl,
        file_size: s.file_size,
        published_at: s.published_at,
        original_filename: s.original_filename,
        user_id: s.user_id,
        uploader_name: s.uploader_name || null,
        views: s.views || 0,
        downloads: s.downloads || 0,
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
  allBtn.dataset.year = "ALL";
  allBtn.onclick = () => {
    setActive(yearToggle, allBtn);
    filters.year = "ALL";
    currentPage = 1;
    applyFilters();
  };
  yearToggle.appendChild(allBtn);

  years.forEach(y => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = y;
    btn.dataset.year = String(y);
    btn.onclick = () => {
      setActive(yearToggle, btn);
      filters.year = String(y);
      currentPage = 1;
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

/* -------------------- URL Params -------------------- */
function readFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('programme')) filters.programme = params.get('programme');
  if (params.has('stream')) filters.stream = params.get('stream').toLowerCase();
  if (params.has('year')) filters.year = params.get('year');
  if (params.has('q')) filters.search = params.get('q').toLowerCase();
  if (params.has('sort')) filters.sort = params.get('sort');
  if (params.has('page')) currentPage = Math.max(1, parseInt(params.get('page'), 10) || 1);
}

function writeFiltersToURL() {
  const params = new URLSearchParams();
  if (filters.programme !== 'ALL') params.set('programme', filters.programme);
  if (filters.stream !== 'science') params.set('stream', filters.stream);
  if (filters.year !== 'ALL') params.set('year', filters.year);
  if (filters.search) params.set('q', filters.search);
  if (filters.sort !== 'year_desc') params.set('sort', filters.sort);
  if (currentPage > 1) params.set('page', currentPage);
  const qs = params.toString();
  const url = window.location.pathname + (qs ? '?' + qs : '');
  history.replaceState(null, '', url);
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
  writeFiltersToURL();
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

  const totalPages = Math.max(1, Math.ceil(view.length / PAPERS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAPERS_PER_PAGE;
  const pageItems = view.slice(start, start + PAPERS_PER_PAGE);

  count.textContent = `Showing ${start + 1}–${Math.min(start + PAPERS_PER_PAGE, view.length)} of ${view.length} papers`;

  if (!view.length) {
    count.textContent = `Showing 0 papers`;
    list.innerHTML = `<p class="empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 0.5rem;opacity:0.35;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>No papers found. Try adjusting your filters.</p>`;
    return;
  }

  pageItems.forEach(p => {
    const semRoman = p.semester ? toRoman(p.semester) : '—';
    const uploaderDisplay = p.uploader_name
      ? p.uploader_name
      : (p.user_id ? 'User' : 'Anonymous');

    const card = document.createElement("div");
    card.className = "paper-card-flip-wrap";

    card.innerHTML = `
      <div class="paper-card-inner">
        <div class="paper-card paper-card-front">
          <h3 class="paper-name">${p.paper_names.join(" / ")}</h3>
          <div class="paper-code">${p.paper_codes.join(" / ")}</div>
          <div class="paper-meta">
            ${p.university} &bull; ${p.programme} &bull; ${p.stream}
            &bull; Sem ${semRoman} &bull; ${p.year}
          </div>
          <a class="open-pdf"
             href="${p.pdf}"
             target="_blank"
             onclick="event.stopPropagation()">
            Open PDF &rarr;
          </a>
        </div>
        <div class="paper-card paper-card-back">
          <div class="paper-back-info">
            <div class="paper-back-row">
              <span class="paper-back-label">Uploaded by</span>
              <span class="paper-back-value">${uploaderDisplay}</span>
            </div>
            <div class="paper-back-row">
              <span class="paper-back-label">Views</span>
              <span class="paper-back-value">${p.views}</span>
            </div>
            <div class="paper-back-row">
              <span class="paper-back-label">Downloads</span>
              <span class="paper-back-value">${p.downloads}</span>
            </div>
          </div>
          <a class="open-pdf"
             href="${p.pdf}"
             target="_blank"
             onclick="event.stopPropagation()">
            Open PDF &rarr;
          </a>
        </div>
      </div>
    `;

    // Click anywhere on the card (not the PDF link) to flip
    card.addEventListener('click', (e) => {
      if (e.target.closest('.open-pdf')) return;
      card.classList.toggle('flipped');
    });

    list.appendChild(card);
  });

  // Pagination controls
  if (totalPages > 1) {
    const pag = document.createElement("div");
    pag.className = "pagination";
    pag.innerHTML = `
      <button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&laquo; Prev</button>
      <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
      <button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next &raquo;</button>
    `;
    pag.querySelectorAll("[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentPage = parseInt(btn.dataset.page, 10);
        writeFiltersToURL();
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    list.appendChild(pag);
  }
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
    currentPage = 1;
    renderSortOptions();
    applyFilters();
  };
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-stream]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    filters.stream = btn.dataset.stream.toLowerCase();
    currentPage = 1;
    applyFilters();
  };
});

document.getElementById("searchInput").addEventListener("input", e => {
  filters.search = norm(e.target.value);
  currentPage = 1;
  applyFilters();
});

/* -------------------- Init -------------------- */
(async function () {
  try {
    readFiltersFromURL();

    // Sync UI with restored filter state
    document.querySelectorAll("[data-programme]").forEach(b => {
      b.classList.toggle("active", b.dataset.programme === filters.programme);
    });
    document.querySelectorAll("[data-stream]").forEach(b => {
      b.classList.toggle("active", b.dataset.stream.toLowerCase() === filters.stream);
    });
    const searchInput = document.getElementById("searchInput");
    if (filters.search) searchInput.value = filters.search;

    await loadPapers();
    buildYearToggle();

    // Sync year toggle after building
    document.querySelectorAll("[data-year]").forEach(b => {
      b.classList.toggle("active", b.dataset.year === filters.year);
    });

    renderSortOptions();
    applyFilters();
  } catch (error) {
    console.error("Failed to initialize browse page:", error);
    document.getElementById("paperCount").textContent = "Error loading papers. Please refresh the page.";
  }
})();
