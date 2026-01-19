/**
 * ExamArchive v2 — Browse Page
 * FINAL STABLE VERSION (Repo-only, schema-aligned)
 */

// Absolute URL so it works from /examarchive-v2/browse
const DATA_URL = "https://omdas11.github.io/examarchive-v2/data/papers.json";

// --------------------
// State
// --------------------
let allPapers = [];
let view = [];

let filters = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  search: "",
  sort: "newest"
};

// --------------------
// Helpers
// --------------------
const norm = v => String(v || "").toLowerCase();

// --------------------
// Load JSON
// --------------------
async function loadPapers() {
  const res = await fetch(DATA_URL);
  allPapers = await res.json();
}

// --------------------
// Year Toggle
// --------------------
function buildYearToggle() {
  const yearToggle = document.getElementById("yearToggle");
  yearToggle.innerHTML = "";

  const years = [...new Set(allPapers.map(p => p.year))].sort((a, b) => b - a);

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    setActive(yearToggle, allBtn);
    filters.year = "ALL";
    applyFilters();
  };
  yearToggle.appendChild(allBtn);

  years.forEach(year => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = year;
    btn.onclick = () => {
      setActive(yearToggle, btn);
      filters.year = String(year);
      applyFilters();
    };
    yearToggle.appendChild(btn);
  });
}

// --------------------
// Filters
// --------------------
function applyFilters() {
  view = [...allPapers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  view = view.filter(p => norm(p.stream) === norm(filters.stream));

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

  view.sort((a, b) =>
    filters.sort === "newest" ? b.year - a.year : a.year - b.year
  );

  render();
}

// --------------------
// Render Cards
// --------------------
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
    const title = p.paper_names.join(" / ");
    const code = p.paper_codes.join(" / ");
    const pdfUrl = p.pdf; // ← DIRECT repo path, no overrides

    const card = document.createElement("div");
    card.className = "paper-card";

    card.onclick = () => {
      window.location.href = `paper.html?code=${p.paper_codes[0]}`;
    };

    card.innerHTML = `
      <h3 class="paper-name">${title}</h3>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream} • Sem ${p.semester} • ${p.year}
      </div>
      <a class="open-pdf" href="${pdfUrl}" target="_blank" onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

// --------------------
// UI Helpers
// --------------------
function setActive(group, btn) {
  group.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// --------------------
// Bind Controls
// --------------------
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
  filters.search = norm(e.target.value);
  applyFilters();
});

document.getElementById("sortSelect").addEventListener("change", e => {
  filters.sort = e.target.value;
  applyFilters();
});

// --------------------
// Init
// --------------------
(async function init() {
  await loadPapers();
  buildYearToggle();
  applyFilters();
})();D0_ooDomsrTuQwFA4",
  "au_cbcs_phshcc502t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc502t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDJ0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.p4Oby2yh5VuWn4yzK8aqDeh_ecBYGK0PEPF4x8PN7wQ",
  "au_cbcs_phshcc601t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.KoSpIaq7zUYZDyTsbkENYK-_K_iHSfeGkwyAzcTF7r4",
  "au_cbcs_phshcc601t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.s08WsPKBNkMjccmYcJsml3aSpnPtjQ-dlTnbF064JiY",
  "au_cbcs_phshcc601t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.bHfv5TOQUY4e_Omfo3HanP_8T3zS53XM3e4vEyaJm04",
  "au_cbcs_phshcc602t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.vAXLDkZlbAQN1iY5Qrl7Gew7REa8nGUieqBUVyJGBB8",
  "au_cbcs_phshcc602t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.aOFKPwK9m-63MGmyK24an_SDBfVVl0bSexLsnTLbrZY",
  "au_cbcs_phshcc602t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.Vv_SOqWCfeFOarLzo0oW5MknTxeuWIK3aHrpqJwk8ho",
  "au_fyug_phydsc101t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc101t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.NAxEsOHaQ5jR8FcHjitetVGs0cQ_4tDIHAxcvdHnLTk",
  "au_fyug_phydsc101t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc101t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MTAwLCJleHAiOjE3NjkzNDI5MDB9.nBoBjkzWVNb9k9VhvC8FWKu6eFIiJOqjDoLFU6Z_aMI",
  "au_fyug_phydsc102t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc102t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDJ0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MTAwLCJleHAiOjE3NjkzNDI5MDB9.BbwtsUNjnY5wut__2E9o6_Ae0Rl9mPSpPySvajPeGow"
};

// Resolve PDF URL (applies overrides when present)
function resolvePdfUrl(paperEntry) {
  let base = paperEntry.pdf.split("/").pop();
  base = base.replace(/_pdf$/i, "");
  if (!base.endsWith(".pdf")) base += ".pdf";
  base = base.toLowerCase();

  const withAu = base.startsWith("au_") ? base : "au_" + base;
  const candidates = [withAu, base, base.replace(/^au_/, "")];

  for (const key of candidates) {
    if (PDF_OVERRIDES[key]) return PDF_OVERRIDES[key];
  }

  console.warn("Missing override for", candidates[0], "fallback:", paperEntry.pdf);
  return paperEntry.pdf;
}

// --------------------
// State
// --------------------
let allPapers = [];
let view = [];

let filters = {
  programme: "ALL",
  stream: "Science",
  year: "ALL",
  search: "",
  sort: "newest"
};

// --------------------
// Helpers
// --------------------
const norm = v => String(v || "").toLowerCase();

// --------------------
// Load JSON
// --------------------
async function loadPapers() {
  const res = await fetch(DATA_URL);
  allPapers = await res.json();
}

// --------------------
// Year Toggle
// --------------------
function buildYearToggle() {
  const yearToggle = document.getElementById("yearToggle");
  yearToggle.innerHTML = "";

  const years = [...new Set(allPapers.map(p => p.year))].sort((a, b) => b - a);

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    setActive(yearToggle, allBtn);
    filters.year = "ALL";
    applyFilters();
  };
  yearToggle.appendChild(allBtn);

  years.forEach(year => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = year;
    btn.onclick = () => {
      setActive(yearToggle, btn);
      filters.year = String(year);
      applyFilters();
    };
    yearToggle.appendChild(btn);
  });
}

// --------------------
// Filters
// --------------------
function applyFilters() {
  view = [...allPapers];

  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  view = view.filter(p => norm(p.stream) === norm(filters.stream));

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

  view.sort((a, b) => (filters.sort === "newest" ? b.year - a.year : a.year - b.year));

  render();
}

// --------------------
// Render Cards
// --------------------
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
    const title = p.paper_names.join(" / ");
    const code = p.paper_codes.join(" / ");
    const pdfUrl = resolvePdfUrl(p);

    const card = document.createElement("div");
    card.className = "paper-card";

    card.onclick = () => {
      window.location.href = `paper.html?code=${p.paper_codes[0]}`;
    };

    card.innerHTML = `
      <h3 class="paper-name">${title}</h3>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream} • Sem ${p.semester} • ${p.year}
      </div>
      <a class="open-pdf" href="${pdfUrl}" target="_blank" onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

// --------------------
// UI Helpers
// --------------------
function setActive(group, btn) {
  group.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// --------------------
// Bind Controls
// --------------------
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
  filters.search = norm(e.target.value);
  applyFilters();
});

document.getElementById("sortSelect").addEventListener("change", e => {
  filters.sort = e.target.value;
  applyFilters();
});

// --------------------
// Init
// --------------------
(async function init() {
  await loadPapers();
  buildYearToggle();
  applyFilters();
})();LCJleHAiOjE3NjkzNDI4OTh9.74KSrWCL9Am8nxo3TjR9wR_ZijD0_ooDomsrTuQwFA4",
  "au_cbcs_phshcc502t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc502t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDJ0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.p4Oby2yh5VuWn4yzK8aqDeh_ecBYGK0PEPF4x8PN7wQ",
  "au_cbcs_phshcc601t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.KoSpIaq7zUYZDyTsbkENYK-_K_iHSfeGkwyAzcTF7r4",
  "au_cbcs_phshcc601t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.s08WsPKBNkMjccmYcJsml3aSpnPtjQ-dlTnbF064JiY",
  "au_cbcs_phshcc601t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.bHfv5TOQUY4e_Omfo3HanP_8T3zS53XM3e4vEyaJm04",
  "au_cbcs_phshcc602t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.vAXLDkZlbAQN1iY5Qrl7Gew7REa8nGUieqBUVyJGBB8",
  "au_cbcs_phshcc602t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.aOFKPwK9m-63MGmyK24an_SDBfVVl0bSexLsnTLbrZY",
  "au_cbcs_phshcc602t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.Vv_SOqWCfeFOarLzo0oW5MknTxeuWIK3aHrpqJwk8ho",
  "au_fyug_phydsc101t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc101t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.NAxEsOHaQ5jR8FcHjitetVGs0cQ_4tDIHAxcvdHnLTk",
  "au_fyug_phydsc101t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc101t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MTAwLCJleHAiOjE3NjkzNDI5MDB9.nBoBjkzWVNb9k9VhvC8FWKu6eFIiJOqjDoLFU6Z_aMI",
  "au_fyug_phydsc102t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc102t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDJ0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MTAwLCJleHAiOjE3NjkzNDI5MDB9.BbwtsUNjnY5wut__2E9o6_Ae0Rl9mPSpPySvajPeGow"
};

// Resolve PDF URL (applies overrides when present)
function resolvePdfUrl(paperEntry) {
  let base = paperEntry.pdf.split("/").pop();
  base = base.replace(/_pdf$/i, "");
  if (!base.endsWith(".pdf")) base += ".pdf";
  base = base.toLowerCase();

  const withAu = base.startsWith("au_") ? base : "au_" + base;
  const candidates = [
    withAu,
    base,
    base.replace(/^au_/, "")
  ];

  for (const key of candidates) {
    if (PDF_OVERRIDES[key]) return PDF_OVERRIDES[key];
  }

  console.warn("Missing override for", candidates[0], "fallback:", paperEntry.pdf);
  return paperEntry.pdf;
}

// --------------------
// Helpers
// --------------------
const norm = v => String(v || "").toLowerCase();

// --------------------
// Load JSON
// --------------------
async function loadPapers() {
  const res = await fetch(DATA_URL);
  allPapers = await res.json();
}

// --------------------
// Year Toggle
// --------------------
function buildYearToggle() {
  const yearToggle = document.getElementById("yearToggle");
  yearToggle.innerHTML = "";

  const years = [...new Set(allPapers.map(p => p.year))]
    .sort((a, b) => b - a);

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    setActive(yearToggle, allBtn);
    filters.year = "ALL";
    applyFilters();
  };
  yearToggle.appendChild(allBtn);

  years.forEach(year => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = year;
    btn.onclick = () => {
      setActive(yearToggle, btn);
      filters.year = String(year);
      applyFilters();
    };
    yearToggle.appendChild(btn);
  });
}

// --------------------
// Filters
// --------------------
function applyFilters() {
  view = [...allPapers];

  // Programme
  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  // Stream (JSON uses lowercase)
  view = view.filter(p => norm(p.stream) === norm(filters.stream));

  // Year
  if (filters.year !== "ALL") {
    view = view.filter(p => String(p.year) === filters.year);
  }

  // Search
  if (filters.search) {
    view = view.filter(p =>
      norm(p.paper_names.join(" ")).includes(filters.search) ||
      norm(p.paper_codes.join(" ")).includes(filters.search) ||
      String(p.year).includes(filters.search)
    );
  }

  // Sort
  view.sort((a, b) =>
    filters.sort === "newest" ? b.year - a.year : a.year - b.year
  );

  render();
}

// --------------------
// Render Cards
// --------------------
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
    const title = p.paper_names.join(" / ");
    const code = p.paper_codes.join(" / ");
    const pdfUrl = resolvePdfUrl(p);

    const card = document.createElement("div");
    card.className = "paper-card";

    card.onclick = () => {
      window.location.href = `paper.html?code=${p.paper_codes[0]}`;
    };

    card.innerHTML = `
      <h3 class="paper-name">${title}</h3>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream} • Sem ${p.semester} • ${p.year}
      </div>
      <a class="open-pdf" href="${pdfUrl}" target="_blank" onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

// --------------------
// UI Helpers
// --------------------
function setActive(group, btn) {
  group.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// --------------------
// Bind Controls
// --------------------
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
  filters.search = norm(e.target.value);
  applyFilters();
});

document.getElementById("sortSelect").addEventListener("change", e => {
  filters.sort = e.target.value;
  applyFilters();
});

// --------------------
// Init
// --------------------
(async function init() {
  await loadPapers();
  buildYearToggle();
  applyFilters();
})();
