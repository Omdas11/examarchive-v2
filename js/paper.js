/**
 * ExamArchive v2 — Paper Page
 * FINAL CLEAN CARD-BASED VERSION
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

// ---------------- Helpers ----------------
function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? Number(m[1]) : 0;
}

// ---------------- Unified Resolver ----------------
async function resolvePaperData(type, paper) {
  const universitySlug = paper.university.toLowerCase().replace(/\s+/g, "-");
  const basePath = `/examarchive-v2/data/${type}/${universitySlug}/${paper.subject}/${paper.programme.toLowerCase()}/`;

  for (const code of paper.paper_codes) {
    try {
      const res = await fetch(`${basePath}${code}.json`);
      if (res.ok) return { status: "found", data: await res.json() };
    } catch {}
  }
  return { status: "not_found" };
}

// ================= SYLLABUS =================
function renderSyllabus(data) {
  const container = document.getElementById("syllabus-container");
  container.innerHTML = "";

  data.units.forEach((u, i) => {
    const card = document.createElement("div");
    card.className = "unit-card";

    const header = document.createElement("div");
    header.className = "unit-header";
    header.textContent = `Unit ${i + 1}${u.title ? " • " + u.title : ""}`;

    const body = document.createElement("div");
    body.className = "unit-body";
    body.hidden = true;
    body.innerHTML = `
      <ul>
        ${u.topics.map(t => `<li>${t}</li>`).join("")}
      </ul>
    `;

    header.onclick = () => body.hidden = !body.hidden;

    card.append(header, body);
    container.appendChild(card);
  });
}

// ================= REPEATED QUESTIONS =================
function renderRepeatedQuestions(data) {
  const container = document.getElementById("repeated-container");
  container.innerHTML = "";

  const unitMap = {};
  let globalQNo = 1;

  // ---- Merge units across sections ----
  data.sections.forEach(section => {
    section.units.forEach(unit => {
      if (!unitMap[unit.unit]) unitMap[unit.unit] = [];
      unitMap[unit.unit].push(unit);
    });
  });

  Object.entries(unitMap).forEach(([unitName, unitBlocks]) => {
    const card = document.createElement("div");
    card.className = "unit-card";

    const header = document.createElement("div");
    header.className = "unit-header";
    header.textContent = unitName;

    const body = document.createElement("div");
    body.className = "unit-body";
    body.hidden = true;

    const list = document.createElement("ol");
    list.className = "rq-list";

    unitBlocks.forEach(unit => {
      // Section A style
      if (unit.questions) {
        unit.questions.forEach(q => {
          const li = document.createElement("li");
          li.innerHTML = `
            <span class="q-text">${globalQNo++}. ${q.question}</span>
            <span class="q-marks">${q.marks}</span>
          `;
          list.appendChild(li);
        });
      }

      // Section B style
      if (unit.choices) {
        unit.choices.forEach(choice => {
          choice.parts.forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `
              <span class="q-text">${globalQNo++}. (${p.label}) ${p.question}</span>
              <span class="q-marks">${p.marks}</span>
            `;
            list.appendChild(li);
          });
        });
      }
    });

    body.appendChild(list);
    header.onclick = () => body.hidden = !body.hidden;

    card.append(header, body);
    container.appendChild(card);
  });
}

// ---------------- Load Paper ----------------
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
    list.innerHTML += `<li><a href="${p.pdf}" target="_blank">${extractYear(p.pdf)} Question Paper →</a></li>`;
  });

  const syllabus = await resolvePaperData("syllabus", base);
  if (syllabus.status === "found") renderSyllabus(syllabus.data);

  const rq = await resolvePaperData("repeated-questions", base);
  if (rq.status === "found") renderRepeatedQuestions(rq.data);
}

// ---------------- Init ----------------
loadPaper();