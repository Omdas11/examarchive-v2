/**
 * ExamArchive v2 — Paper Page
 * CLEAN REWRITE (RQ schema v1.1 compliant)
 *
 * Principles:
 * - Data drives rendering
 * - No inference, no guessing
 * - Order in JSON = order in UI
 */

const BASE = "https://omdas11.github.io/examarchive-v2";
const PAPERS_URL = `${BASE}/data/papers.json`;

const params = new URLSearchParams(window.location.search);
const CODE = params.get("code");

if (!CODE) {
  document.querySelector(".paper-page").innerHTML =
    "<p class='coming-soon'>Invalid paper link.</p>";
  throw new Error("Missing paper code");
}

/* ---------- Helpers ---------- */
function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? Number(m[1]) : "";
}

/* ---------- Unified Resolver ---------- */
async function resolvePaperData(type, paper) {
  const universitySlug = paper.university.toLowerCase().replace(/\s+/g, "-");
  const programme = paper.programme.toLowerCase();
  const subject = paper.subject.toLowerCase();

  const basePath =
    `/examarchive-v2/data/${type}/${universitySlug}/${programme}/${subject}/`;

  for (const code of paper.paper_codes) {
    try {
      const res = await fetch(`${basePath}${code}.json`);
      if (res.ok) return { status: "found", data: await res.json() };
    } catch {}
  }
  return { status: "not_found" };
}

  for (const code of paper.paper_codes) {
    try {
      const res = await fetch(`${basePath}${code}.json`);
      if (res.ok) return { status: "found", data: await res.json() };
    } catch {}
  }
  return { status: "not_found" };
}

/* ================= SYLLABUS ================= */
function renderSyllabus(data) {
  const container = document.getElementById("syllabus-container");
  container.innerHTML = "";

  if (!Array.isArray(data.units) || !data.units.length) {
    container.innerHTML =
      "<p class='coming-soon'>Syllabus not available.</p>";
    return;
  }

  data.units.forEach((u, idx) => {
    const unit = document.createElement("div");
    unit.className = "syllabus-unit";

    const header = document.createElement("div");
    header.className = "syllabus-header";
    header.innerHTML = `
      <span>Unit ${u.unit_no ?? idx + 1}${u.title ? " • " + u.title : ""}</span>
      ${typeof u.hours === "number"
        ? `<span class="syllabus-lectures">${u.hours} Hours</span>`
        : ""}
    `;

    const content = document.createElement("div");
    content.className = "syllabus-content";
    content.hidden = true;
    content.innerHTML = `
      <ul>
        ${(u.topics || []).map(t => `<li>${t}</li>`).join("")}
      </ul>
    `;

    header.onclick = () => (content.hidden = !content.hidden);

    unit.append(header, content);
    container.appendChild(unit);
  });
}

/* ================= REPEATED QUESTIONS ================= */
function renderRepeatedQuestions(data) {
  const container = document.getElementById("repeated-container");
  container.innerHTML = "";

  if (!Array.isArray(data.sections) || !data.sections.length) {
    container.innerHTML =
      "<p class='coming-soon'>Repeated questions not available.</p>";
    return;
  }

  let globalQno = 1;

  data.sections.forEach(section => {
    /* Section header (instruction only) */
    if (section.instruction) {
      const inst = document.createElement("p");
      inst.className = "rq-instruction";
      inst.textContent = section.instruction;
      container.appendChild(inst);
    }

    section.units.forEach(unitBlock => {
      const unit = document.createElement("div");
      unit.className = "rq-unit";

      const header = document.createElement("div");
      header.className = "rq-unit-header";
      header.textContent = unitBlock.unit_label || `Unit ${unitBlock.unit_no}`;

      const content = document.createElement("div");
      content.className = "rq-unit-content";
      content.hidden = true;

      /* -------- Standalone questions (Section A) -------- */
      if (Array.isArray(unitBlock.questions)) {
        unitBlock.questions.forEach(q => {
          const row = document.createElement("div");
          row.className = "rq-question";
          row.innerHTML = `
            <span class="rq-number">${globalQno++}.</span>
            <span>${q.text}</span>
            <span class="rq-marks">${q.marks}</span>
          `;
          content.appendChild(row);
        });
      }

      /* -------- Long questions with parts (Section B) -------- */
      if (Array.isArray(unitBlock.choices)) {
        unitBlock.choices.forEach(choice => {
          const mainNo = globalQno++;

          choice.parts.forEach(p => {
            const row = document.createElement("div");
            row.className = "rq-part";
            row.innerHTML = `
              <span class="rq-number">${mainNo}.</span>
              <span>(${p.label}) ${p.text}</span>
              <span class="rq-marks">${p.marks}</span>
            `;
            content.appendChild(row);
          });
        });
      }

      header.onclick = () => (content.hidden = !content.hidden);

      unit.append(header, content);
      container.appendChild(unit);
    });
  });
}

/* ================= LOAD PAPER ================= */
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  const matches = all.filter(p => p.paper_codes?.includes(CODE));
  if (!matches.length) return;

  const sorted = [...matches].sort(
    (a, b) => extractYear(b.pdf) - extractYear(a.pdf)
  );

  const base = sorted[0];

  document.getElementById("paperTitle").textContent =
    base.paper_names.join(" / ");
  document.getElementById("paperCode").textContent =
    base.paper_codes.join(" / ");
  document.getElementById("paperMeta").textContent =
    `${base.university} • ${base.programme} • ${base.stream.toUpperCase()} • Sem ${base.semester}`;

  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = base.pdf;
  latestBtn.textContent = `Open Latest PDF (${extractYear(base.pdf)}) →`;

  const list = document.getElementById("availablePapers");
  list.innerHTML = "";
  sorted.forEach(p => {
    list.innerHTML += `
      <li class="paper-row">
        <span>${extractYear(p.pdf)} Question Paper</span>
        <a href="${p.pdf}" target="_blank" class="link-red">Open →</a>
      </li>
    `;
  });

  const syllabus = await resolvePaperData("syllabus", base);
  if (syllabus.status === "found") renderSyllabus(syllabus.data);

  const rq = await resolvePaperData("repeated-questions", base);
  if (rq.status === "found") renderRepeatedQuestions(rq.data);
}

/* ---------- Init ---------- */
loadPaper();
