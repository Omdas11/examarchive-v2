/**
 * ExamArchive v2 — Paper Page
 * FINAL (Year-resolved, schema-correct, UX-polished + PDF downloads)
 */

const BASE = "https://omdas11.github.io/examarchive-v2";
const PAPERS_URL = `${BASE}/data/papers.json`;

const params = new URLSearchParams(window.location.search);
const CODE = params.get("code");
const YEAR = Number(params.get("year"));

if (!CODE || !YEAR) {
  document.querySelector(".paper-page").innerHTML =
    "<p class='coming-soon'>Invalid paper link.</p>";
  throw new Error("Missing paper code or year");
}

/* ---------- Helpers ---------- */
function semesterToRoman(n) {
  const map = ["I","II","III","IV","V","VI","VII","VIII"];
  return map[n - 1] || n;
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
      header.textContent =
        unitBlock.unit_label || `Unit ${unitBlock.unit_no}`;

      const content = document.createElement("div");
      content.className = "rq-unit-content";
      content.hidden = true;

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

/* ================= SYLLABUS PDF DOWNLOAD ================= */
function setupSyllabusDownloads(paperCode) {
  const btn = document.getElementById("syllabus-download-btn");
  const menu = document.getElementById("syllabus-download-menu");
  const pLink = document.getElementById("download-syllabus-paragraph");
  const lLink = document.getElementById("download-syllabus-list");

  if (!btn || !menu || !pLink || !lLink) return;

  const base = `${BASE}/assets/pdfs/syllabus/`;
  const paragraphPdf = `${base}${paperCode}-paragraph.pdf`;
  const listPdf = `${base}${paperCode}-list.pdf`;

  pLink.href = paragraphPdf;
  lLink.href = listPdf;

  // toggle menu
  btn.onclick = () => {
    menu.classList.toggle("hidden");
  };

  // close menu when clicking outside
  document.addEventListener("click", e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });
}

/* ================= LOAD PAPER ================= */
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  const selected = all.find(
    p => p.paper_codes?.includes(CODE) && p.year === YEAR
  );

  if (!selected) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Paper not found.</p>";
    return;
  }

  const related = all
    .filter(p => p.paper_codes?.includes(CODE))
    .sort((a, b) => b.year - a.year);

  /* ---------- Header ---------- */
  document.getElementById("paperTitle").textContent =
    selected.paper_names.join(" / ");
  document.getElementById("paperCode").textContent =
    selected.paper_codes.join(" / ");

  const meta = document.getElementById("paperMeta");
  meta.innerHTML = `
    <span class="meta-line">
      ${selected.university} • ${selected.programme} • ${selected.stream.toUpperCase()}
      • Semester ${semesterToRoman(selected.semester)}
    </span>
  `;

  /* ---------- Availability Badges ---------- */
  const badgeWrap = document.createElement("div");
  badgeWrap.className = "availability-badges";

  if (selected.has_rq === true) {
    const rq = document.createElement("span");
    rq.className = "availability-badge active";
    rq.textContent = "Repeated Questions";
    badgeWrap.appendChild(rq);
  }

  meta.appendChild(badgeWrap);

  /* ---------- Latest PDF ---------- */
  const latest = related[0];
  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = latest.pdf;
  latestBtn.textContent = `Open Latest PDF (${latest.year}) →`;

  /* ---------- Available Papers ---------- */
  const list = document.getElementById("availablePapers");
  list.innerHTML = "";
  related.forEach(p => {
    list.innerHTML += `
      <li class="paper-row">
        <span>${p.year} Question Paper</span>
        <a href="${p.pdf}" target="_blank" class="link-red">Open →</a>
      </li>
    `;
  });

  /* ---------- Syllabus ---------- */
  const syllabus = await resolvePaperData("syllabus", selected);
  if (syllabus.status === "found") {
    renderSyllabus(syllabus.data);
    setupSyllabusDownloads(selected.paper_codes[0]);
  }

  /* ---------- Repeated Questions ---------- */
  const rq = await resolvePaperData("repeated-questions", selected);
  if (rq.status === "found") renderRepeatedQuestions(rq.data);
}

/* ---------- Init ---------- */
loadPaper();
