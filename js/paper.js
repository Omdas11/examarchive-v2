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
function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? Number(m[1]) : 0;
}

// ------ Add unified paper data resolver --------

async function resolvePaperData(type, paper) {
  const basePath = `/examarchive-v2/data/${type}/${paper.university_slug}/${paper.subject}/${paper.programme.toLowerCase()}/`;

  // Always use paper_codes array
  if (!Array.isArray(paper.paper_codes)) {
    return { status: "not_found" };
  }

  for (const code of paper.paper_codes) {
    const url = `${basePath}${code}.json`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return {
          status: "found",
          code_used: code,
          data
        };
      }
    } catch (e) {
      // silently try next code
    }
  }

  return { status: "not_found" };
}

// ---------------- Load Paper ----------------
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  const matches = all.filter(
    p => p.paper_codes && p.paper_codes[0] === CODE
  );

  if (!matches.length) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Paper not found.</p>";
    return;
  }

  const sorted = [...matches].sort(
    (a, b) => extractYear(b.pdf) - extractYear(a.pdf)
  );

  const base = sorted[0];

  // Header
  document.getElementById("paperTitle").textContent =
    base.paper_names.join(" / ");

  document.getElementById("paperCode").textContent =
    base.paper_codes.join(" / ");

  document.getElementById("paperMeta").textContent =
    `${base.university} • ${base.programme} • ${base.stream.toUpperCase()} • Sem ${base.semester}`;

  // Latest PDF
  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = base.pdf;
  latestBtn.textContent = `Open Latest PDF (${extractYear(base.pdf)}) →`;

  // Available papers
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

  // Optional sections
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
loadPaper();
