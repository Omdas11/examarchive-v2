/**
 * ExamArchive v2 — Paper Page
 * FINAL STABLE VERSION (Repo-only, schema-aligned)
 */

const BASE = "https://omdas11.github.io/examarchive-v2";
const PAPERS_URL = `${BASE}/data/papers.json`;
const SYLLABUS_BASE = `${BASE}/data/syllabus/`;
const RQ_BASE = `${BASE}/data/repeated-questions/`;

const params = new URLSearchParams(window.location.search);
const CODE = params.get("code");

if (!CODE) {
  document.querySelector(".paper-page").innerHTML =
    "<p class='coming-soon'>Invalid paper link.</p>";
  throw new Error("Missing paper code");
}

// ---------------- Helpers ----------------
const norm = v => String(v || "").toLowerCase();

function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? Number(m[1]) : 0;
}

// ---------------- Load Paper ----------------
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  // Match by first paper code
  const matches = all.filter(p =>
    p.paper_codes && p.paper_codes[0] === CODE
  );

  if (!matches.length) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Paper not found.</p>";
    return;
  }

  // Sort newest → oldest
  const sorted = [...matches].sort(
    (a, b) => extractYear(b.pdf) - extractYear(a.pdf)
  );

  const base = sorted[0];

  // ---------- Header ----------
  document.getElementById("paperTitle").textContent =
    base.paper_names.join(" / ");

  document.getElementById("paperCode").textContent =
    base.paper_codes.join(" / ");

  document.getElementById("paperMeta").textContent =
    `${base.university} • ${base.programme} • ${base.stream.toUpperCase()} • Sem ${base.semester}`;

  // ---------- Latest PDF ----------
  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = base.pdf;
  latestBtn.textContent = `Open Latest PDF (${extractYear(base.pdf)}) →`;

  // ---------- Available Papers ----------
  const list = document.getElementById("availablePapers");
  list.innerHTML = "";

  sorted.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${p.pdf}" target="_blank">
        ${extractYear(p.pdf)} Question Paper →
      </a>
    `;
    list.appendChild(li);
  });

  // ---------- Optional Sections ----------
  loadOptional(
    `${SYLLABUS_BASE}${base.paper_codes[0]}.json`,
    "syllabus-container",
    "no-syllabus"
  );

  loadOptional(
    `${RQ_BASE}${base.paper_codes[0]}.json`,
    "repeated-container"
  );
}

// ---------------- Optional loaders ----------------
async function loadOptional(url, containerId, fallbackId) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const data = await res.json();
    document.getElementById(containerId).textContent =
      JSON.stringify(data, null, 2);
  } catch {
    if (fallbackId) {
      const el = document.getElementById(fallbackId);
      if (el) el.hidden = false;
    }
  }
}

// ---------------- Init ----------------
loadPaper();rage/v1/object/sign/papers/au_cbcs_phshcc502t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDJ0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.74KSrWCL9Am8nxo3TjR9wR_ZijD0_ooDomsrTuQwFA4",
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

// ---------------- Helpers ----------------
function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? m[1] : "—";
}

function extractShort(code) {
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

function extractSemester(code) {
  const m = code.match(/(\d)(0[1-8])/);
  if (!m) return "—";
  return `Sem ${m[2][1]}`;
}

// Resolve PDF URL (applies overrides when present)
function resolvePdfUrl(paperEntry) {
  // Normalize filename
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

// ---------------- Load Paper ----------------
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  const matches = all.filter(p =>
    extractShort(p.paper_code) === SHORT_CODE.toUpperCase()
  );

  if (!matches.length) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Paper not found.</p>";
    return;
  }

  const base = matches[0];
  const semester = extractSemester(base.paper_code);

  // Header
  document.getElementById("paperTitle").textContent =
    base.paper_name || "Paper title pending";

  document.getElementById("paperCode").textContent =
    extractShort(base.paper_code);

  document.getElementById("paperMeta").textContent =
    `Assam University • ${base.programme} • ${base.stream.toUpperCase()} • ${semester}`;

  // Latest PDF
  const sorted = [...matches].sort(
    (a, b) => extractYear(b.pdf) - extractYear(a.pdf)
  );

  const latest = sorted[0];
  const latestUrl = resolvePdfUrl(latest);

  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = latestUrl;
  latestBtn.textContent = `Open Latest PDF (${extractYear(latest.pdf)}) →`;

  // Available papers
  const list = document.getElementById("availablePapers");
  list.innerHTML = "";

  sorted.forEach(p => {
    const url = resolvePdfUrl(p);
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${url}" target="_blank">
        ${extractYear(p.pdf)} Question Paper →
      </a>
    `;
    list.appendChild(li);
  });

  // Optional sections
  loadOptional(
    `${SYLLABUS_BASE}${base.paper_code}.json`,
    "syllabus-container",
    "no-syllabus"
  );

  loadOptional(
    `${RQ_BASE}${base.paper_code}.json`,
    "repeated-container"
  );
}

// ---------------- Optional loaders ----------------
async function loadOptional(url, containerId, fallbackId) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const data = await res.json();
    document.getElementById(containerId).textContent =
      JSON.stringify(data, null, 2);
  } catch {
    if (fallbackId) {
      document.getElementById(fallbackId).hidden = false;
    }
  }
}

// ---------------- Init ----------------
loadPaper();rhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc502t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDJ0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.74KSrWCL9Am8nxo3TjR9wR_ZijD0_ooDomsrTuQwFA4",
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

// ---------------- Helpers ----------------
function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? m[1] : "—";
}

function extractShort(code) {
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

function extractSemester(code) {
  // e.g. PHSDSE601T → Sem 6
  const m = code.match(/(\d)(0[1-8])/);
  if (!m) return "—";
  return `Sem ${m[2][1]}`;
}

// Resolve PDF URL (applies overrides when present)
function resolvePdfUrl(paperEntry) {
  // Normalize filename
  let base = paperEntry.pdf.split("/").pop();   // e.g. cbcs_phsdse601t_2025_pdf
  base = base.replace(/_pdf$/i, "");            // -> cbcs_phsdse601t_2025
  if (!base.endsWith(".pdf")) base += ".pdf";   // -> cbcs_phsdse601t_2025.pdf
  base = base.toLowerCase();

  const withAu = base.startsWith("au_") ? base : "au_" + base;
  const candidates = [
    withAu,
    base,                      // without au_
    base.replace(/^au_/, "")   // just in case it already had au_
  ];

  for (const key of candidates) {
    if (PDF_OVERRIDES[key]) return PDF_OVERRIDES[key];
  }

  console.warn("Missing override for", candidates[0], "fallback:", paperEntry.pdf);
  return paperEntry.pdf;
}

// ---------------- Load Paper ----------------
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  const matches = all.filter(p =>
    extractShort(p.paper_code) === SHORT_CODE.toUpperCase()
  );

  if (!matches.length) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Paper not found.</p>";
    return;
  }

  const base = matches[0];
  const semester = extractSemester(base.paper_code);

  // Header
  document.getElementById("paperTitle").textContent =
    base.paper_name || "Paper title pending";

  document.getElementById("paperCode").textContent =
    extractShort(base.paper_code);

  document.getElementById("paperMeta").textContent =
    `Assam University • ${base.programme} • ${base.stream.toUpperCase()} • ${semester}`;

  // Latest PDF
  const sorted = [...matches].sort(
    (a, b) => extractYear(b.pdf) - extractYear(a.pdf)
  );

  const latest = sorted[0];
  const latestUrl = resolvePdfUrl(latest);

  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = latestUrl;
  latestBtn.textContent = `Open Latest PDF (${extractYear(latest.pdf)}) →`;

  // Available papers
  const list = document.getElementById("availablePapers");
  list.innerHTML = "";

  sorted.forEach(p => {
    const url = resolvePdfUrl(p);
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${url}" target="_blank">
        ${extractYear(p.pdf)} Question Paper →
      </a>
    `;
    list.appendChild(li);
  });

  // Optional sections
  loadOptional(
    `${SYLLABUS_BASE}${base.paper_code}.json`,
    "syllabus-container",
    "no-syllabus"
  );

  loadOptional(
    `${RQ_BASE}${base.paper_code}.json`,
    "repeated-container"
  );
}

// ---------------- Optional loaders ----------------
async function loadOptional(url, containerId, fallbackId) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const data = await res.json();
    document.getElementById(containerId).textContent =
      JSON.stringify(data, null, 2);
  } catch {
    if (fallbackId) {
      document.getElementById(fallbackId).hidden = false;
    }
  }
}

// ---------------- Init ----------------
loadPaper();
