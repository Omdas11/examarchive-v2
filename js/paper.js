/**
 * ExamArchive v2 — Paper Page
 * FINAL VERSION (Schema-aligned: uses hours, not lectures)
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

  if (!Array.isArray(data.units) || !data.units.length) {
    container.innerHTML =
      "<p class='coming-soon'>Syllabus not available yet.</p>";
    return;
  }

  data.units.forEach((u, i) => {
    const unit = document.createElement("div");
    unit.className = "syllabus-unit";

    const header = document.createElement("div");
    header.className = "syllabus-header";

    // Left: Unit title
    const title = document.createElement("span");
    title.textContent = `Unit ${u.unit_no ?? i + 1}${u.title ? " • " + u.title : ""}`;
    header.appendChild(title);

    // Right: Contact hours badge (schema-correct)
    if (typeof u.hours === "number") {
      const hours = document.createElement("span");
      hours.className = "syllabus-lectures";
      hours.textContent = `${u.hours} Hours`;
      header.appendChild(hours);
    }

    const content = document.createElement("div");
    content.className = "syllabus-content";
    content.hidden = true;

    if (Array.isArray(u.topics) && u.topics.length) {
      content.innerHTML = `
        <ul>
          ${u.topics.map(t => `<li>${t}</li>`).join("")}
        </ul>
      `;
    } else {
      content.innerHTML = "<p>No topics listed.</p>";
    }

    header.onclick = () => {
      content.hidden = !content.hidden;
    };

    unit.append(header, content);
    container.appendChild(unit);
  });
}

// ================= REPEATED QUESTIONS =================
function renderRepeatedQuestions(data) {
  const container = document.getElementById("repeated-container");
  container.innerHTML = "";

  if (!data.sections || !data.sections.length) {
    container.innerHTML =
      "<p class='coming-soon'>Repeated questions not available yet.</p>";
    return;
  }

  const unitMap = {};
  let qNo = 1;

  // Merge units across sections
  data.sections.forEach(section => {
    section.units.forEach(unit => {
      if (!unitMap[unit.unit]) unitMap[unit.unit] = [];
      unitMap[unit.unit].push(unit);
    });
  });

  Object.entries(unitMap).forEach(([unitName, unitBlocks]) => {
    const unit = document.createElement("div");
    unit.className = "rq-unit";

    const header = document.createElement("div");
    header.className = "rq-unit-header";
    header.textContent = unitName;

    const content = document.createElement("div");
    content.className = "rq-unit-content";
    content.hidden = true;

    unitBlocks.forEach(block => {
      // Section A
      if (Array.isArray(block.questions)) {
        block.questions.forEach(q => {
          const row = document.createElement("div");
          row.className = "rq-question";
          row.innerHTML = `
            <span class="rq-number">${qNo++}.</span>
            <span>${q.question}</span>
            <span class="rq-marks">${q.marks}</span>
          `;
          content.appendChild(row);
        });
      }

      // Section B (choices)
      if (Array.isArray(block.choices)) {
        block.choices.forEach(choice => {
          choice.parts.forEach(p => {
            const row = document.createElement("div");
            row.className = "rq-part";
            row.innerHTML = `
              <span class="rq-number">${qNo++}.</span>
              <span>(${p.label}) ${p.question}</span>
              <span class="rq-marks">${p.marks}</span>
            `;
            content.appendChild(row);
          });
        });
      }
    });

    header.onclick = () => {
      content.hidden = !content.hidden;
    };

    unit.append(header, content);
    container.appendChild(unit);
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
    list.innerHTML += `
      <li class="paper-row">
        <span>${extractYear(p.pdf)} Question Paper</span>
        <a href="${p.pdf}" target="_blank" class="link-red">Open →</a>
      </li>
    `;
  });

  // Load syllabus
  const syllabus = await resolvePaperData("syllabus", base);
  if (syllabus.status === "found") {
    renderSyllabus(syllabus.data);
  } else {
    document.getElementById("syllabus-container").innerHTML =
      "<p class='coming-soon'>Syllabus not available yet.</p>";
  }

  // Load repeated questions
  const rq = await resolvePaperData("repeated-questions", base);
  if (rq.status === "found") {
    renderRepeatedQuestions(rq.data);
  } else {
    document.getElementById("repeated-container").innerHTML =
      "<p class='coming-soon'>Repeated questions not available yet.</p>";
  }
}

// ---------------- Init ----------------
loadPaper();
