/**
 * ExamArchive v2 — Paper Page (RESTORED & ALIGNED)
 * Works with existing paper.html layout
 */

const PAPERS_URL = "./data/papers.json";
const SYLLABUS_BASE = "./data/syllabus/";
const RQ_BASE = "./data/repeated-questions/";

const params = new URLSearchParams(window.location.search);
const SHORT_CODE = params.get("code");

if (!SHORT_CODE) {
  document.querySelector(".paper-page").innerHTML =
    "<p class='coming-soon'>Invalid paper link.</p>";
  throw new Error("Missing paper code");
}

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
  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = latest.pdf;
  latestBtn.textContent = `Open Latest PDF (${extractYear(latest.pdf)}) →`;

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
