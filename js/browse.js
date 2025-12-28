let allPapers = [];

let activeProgramme = 'ALL';
let activeStream = 'Science';
let activeYear = 'ALL';
let activeSort = 'year_desc';

const papersList = document.getElementById('papersList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const yearToggle = document.getElementById('yearToggle');

/* ================= FETCH PAPERS ================= */

fetch('data/papers.json')
  .then(res => res.json())
  .then(data => {
    allPapers = data;
    renderYearFilters();
    renderSortOptions();
    applyFilters();
  });

/* ================= FILTER RENDERERS ================= */

function renderYearFilters() {
  yearToggle.innerHTML = '';

  const years = [...new Set(allPapers.map(p => p.year))]
    .sort((a, b) => b - a);

  yearToggle.appendChild(createYearBtn('ALL'));

  years.forEach(year => {
    yearToggle.appendChild(createYearBtn(year));
  });
}

function createYearBtn(year) {
  const btn = document.createElement('button');
  btn.className = 'toggle-btn';
  if (year === activeYear) btn.classList.add('active');
  btn.textContent = year;

  btn.onclick = () => {
    activeYear = year;
    updateActiveButtons(yearToggle, btn);
    applyFilters();
  };

  return btn;
}

function renderSortOptions() {
  sortSelect.innerHTML = '';

  const common = [
    { value: 'year_desc', label: 'Year (Newest)' },
    { value: 'year_asc', label: 'Year (Oldest)' },
    { value: 'code', label: 'Paper Code' }
  ];

  const cbcs = [
    { value: 'course', label: 'Course Type (HCC / DSE / SEC)' },
    { value: 'semester', label: 'Semester' }
  ];

  const fyug = [
    { value: 'course', label: 'Course Type (DSC / DSM / SEC / IDC)' },
    { value: 'semester', label: 'Semester' }
  ];

  const options =
    activeProgramme === 'FYUG'
      ? [...common, ...fyug]
      : [...common, ...cbcs];

  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    sortSelect.appendChild(o);
  });

  sortSelect.value = activeSort;
}

/* ================= APPLY FILTERS ================= */

function applyFilters() {
  let result = [...allPapers];

  // Programme
  if (activeProgramme !== 'ALL') {
    result = result.filter(p => p.programme === activeProgramme);
  }

  // Stream
  result = result.filter(p => p.stream === activeStream);

  // Year
  if (activeYear !== 'ALL') {
    result = result.filter(p => String(p.year) === String(activeYear));
  }

  // Search
  const q = searchInput.value.toLowerCase();
  if (q) {
    result = result.filter(p =>
      p.search_text.toLowerCase().includes(q)
    );
  }

  // Sort
  result.sort(sortHandler);

  renderPapers(result);
}

/* ================= SORT ================= */

function sortHandler(a, b) {
  switch (activeSort) {
    case 'year_desc':
      return b.year - a.year;
    case 'year_asc':
      return a.year - b.year;
    case 'code':
      return a.paper_code.localeCompare(b.paper_code);
    case 'course':
      return a.course_type.localeCompare(b.course_type);
    case 'semester':
      return a.semester - b.semester;
    default:
      return 0;
  }
}

/* ================= RENDER PAPERS ================= */

function renderPapers(papers) {
  papersList.innerHTML = '';

  if (papers.length === 0) {
    papersList.innerHTML = '<p class="no-results">No papers found.</p>';
    return;
  }

  papers.forEach(paper => {
    const card = document.createElement('div');
    card.className = 'paper-card';
    card.onclick = () => window.open(paper.pdf, '_blank');

    card.innerHTML = `
      <h3>${paper.paper_code}</h3>
      <p>${paper.paper_name}</p>
      <small>${paper.programme} · Semester ${paper.semester} · ${paper.year}</small>
      <span class="open-link">Open PDF →</span>
    `;

    papersList.appendChild(card);
  });
}

/* ================= EVENTS ================= */

document.getElementById('programmeToggle').addEventListener('click', e => {
  if (!e.target.dataset.programme) return;
  activeProgramme = e.target.dataset.programme;
  updateActiveButtons(e.currentTarget, e.target);
  renderSortOptions();
  applyFilters();
});

document.getElementById('streamToggle').addEventListener('click', e => {
  if (!e.target.dataset.stream) return;
  activeStream = e.target.dataset.stream;
  updateActiveButtons(e.currentTarget, e.target);
  applyFilters();
});

searchInput.addEventListener('input', applyFilters);

sortSelect.addEventListener('change', e => {
  activeSort = e.target.value;
  applyFilters();
});

/* ================= UTIL ================= */

function updateActiveButtons(container, activeBtn) {
  container.querySelectorAll('.toggle-btn').forEach(btn =>
    btn.classList.remove('active')
  );
  activeBtn.classList.add('active');
}
