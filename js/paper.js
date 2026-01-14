document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const paperCode = params.get("code");
  if (!paperCode) return;

  try {
    /* =========================
       LOAD PAPERS.JSON (SOURCE OF TRUTH)
    ========================= */
    const papersRes = await fetch("data/papers.json");
    const papers = await papersRes.json();

    const samePaper = papers
      .filter(p => p.paper_code === paperCode)
      .sort((a, b) => b.year - a.year);

    if (samePaper.length === 0) return;

    renderPaperHeaderFromPapers(samePaper);
    renderAvailablePapers(samePaper);

    /* =========================
       LOAD SYLLABUS
    ========================= */
    const syllabusRes = await fetch(
      `data/syllabus/assam-university/physics/fyug/${paperCode}.json`
    );

    const syllabusInfo = document.getElementById("syllabus-info");

    if (syllabusRes.ok) {
     const syllabusData = await syllabusRes.json();
     renderSyllabus(syllabusData);
    } else if (syllabusInfo) {
      syllabusInfo.innerHTML = `
       <p class="coming-soon">
        Syllabus will be added soon.
       </p>
    `;
    }

    /* =========================
       LOAD REPEATED QUESTIONS
    ========================= */
    const rqRes = await fetch(
      `data/repeated-questions/assam-university/physics/fyug/${paperCode}.json`
    );

    if (rqRes.ok) {
      const rqData = await rqRes.json();
      renderRepeatedQuestions(rqData.sections);
    }

  } catch (err) {
    console.error("Paper page error:", err);
  }
});

/* =========================
   PAPER HEADER (FROM PAPERS.JSON)
========================= */
function renderPaperHeaderFromPapers(papers) {
  const latest = papers[0];

  document.getElementById("paperTitle").textContent = latest.paper_name;
  document.getElementById("paperCode").textContent = latest.paper_code;

  const meta = document.getElementById("paperMeta");
  meta.innerHTML = `
    <span class="chip">${latest.programme}</span>
    <span class="chip">Semester ${latest.semester}</span>
    <span class="chip">${latest.course_type}</span>
    <span class="chip">${latest.subject}</span>
  `;

  const pdfLink = document.getElementById("latestPdfLink");
  pdfLink.href = latest.pdf;
  pdfLink.target = "_blank";
  pdfLink.rel = "noopener";
}

/* =========================
   AVAILABLE PAPERS (LINK ONLY)
========================= */
function renderAvailablePapers(papers) {
  const list = document.getElementById("availablePapers");
  list.innerHTML = "";

  papers.forEach(p => {
    const li = document.createElement("li");
    li.className = "paper-row";

    li.innerHTML = `
      <span>${p.year}</span>
      <a
        href="${p.pdf}"
        class="link-red"
        target="_blank"
        rel="noopener"
      >
        Open PDF →
      </a>
    `;

    list.appendChild(li);
  });
}

/* =========================
   SYLLABUS
========================= */
function renderSyllabus(data) {
  const container = document.getElementById("syllabus-container");
  if (!container || !Array.isArray(data.units)) return;

  container.innerHTML = "";

  data.units.forEach(unit => {
    const unitLabel =
      unit.unit ||
      unit.unit_no ||
      unit.unit_number ||
      "";

    const unitTitle =
      unit.title ||
      unit.topics_title ||
      unit.name ||
      "";

    const heading =
      unitLabel && unitTitle
        ? `${unitLabel} · ${unitTitle}`
        : unitLabel || unitTitle;

    const block = document.createElement("div");
    block.className = "syllabus-unit";

    block.innerHTML = `
      <div class="syllabus-header">${heading}</div>
      <div class="syllabus-content" hidden>
        <ul>
          ${(unit.topics || []).map(t => `<li>${t}</li>`).join("")}
        </ul>
      </div>
    `;

    block.querySelector(".syllabus-header").onclick = () => {
      block.querySelector(".syllabus-content").hidden ^= true;
    };

    container.appendChild(block);
  });
}

/* =========================
   REPEATED QUESTIONS
========================= */
function renderRepeatedQuestions(sections) {
  const container = document.getElementById("repeated-container");
  if (!container || !Array.isArray(sections)) return;

  container.innerHTML = "";

  const unitMap = {};
  let counter = 1;

  sections.forEach(section => {
    if (!Array.isArray(section.units)) return;

    section.units.forEach(unit => {
      unitMap[unit.unit] ||= { short: [], long: [] };

      if (section.section === "A" && unit.questions) {
        unitMap[unit.unit].short.push(...unit.questions);
      }

      if (section.section === "B" && unit.choices) {
        unitMap[unit.unit].long.push(...unit.choices);
      }
    });
  });

  Object.entries(unitMap).forEach(([unitName, data]) => {
    const block = document.createElement("div");
    block.className = "rq-unit";

    block.innerHTML = `
      <div class="rq-unit-header">${unitName}</div>
      <div class="rq-unit-content" hidden></div>
    `;

    const content = block.querySelector(".rq-unit-content");

    data.short.forEach(q => {
      content.insertAdjacentHTML(
        "beforeend",
        `
        <div class="rq-question">
          <span class="rq-number">${counter++}.</span>
          <span class="rq-text">${q.question}</span>
          <span class="rq-marks">${q.marks || ""}</span>
        </div>
        `
      );
    });

    data.long.forEach((choice, idx) => {
      const base = counter++;

      choice.parts.forEach(part => {
        content.insertAdjacentHTML(
          "beforeend",
          `
          <div class="rq-part">
            <span class="rq-number">${base}.</span>
            <span class="rq-text">${part.question}</span>
            <span class="rq-marks">${
              Array.isArray(part.breakup)
                ? part.breakup.join("+")
                : part.marks || ""
            }</span>
          </div>
          `
        );
      });

      if (idx < data.long.length - 1) {
        content.insertAdjacentHTML(
          "beforeend",
          `<div class="rq-or">OR</div>`
        );
      }
    });

    block.querySelector(".rq-unit-header").onclick = () => {
      content.hidden ^= true;
    };

    container.appendChild(block);
  });
}
