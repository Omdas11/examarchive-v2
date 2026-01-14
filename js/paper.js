document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const paperCode = params.get("code");
  if (!paperCode) return;

  const downloadBtn = document.getElementById("download-full");
  const noSyllabusMsg = document.getElementById("no-syllabus");

  if (downloadBtn) downloadBtn.style.display = "none";
  if (noSyllabusMsg) noSyllabusMsg.hidden = true;

  try {
    /* =========================
       LOAD PAPERS.JSON
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
    const syllabusPath = `data/syllabus/assam-university/physics/fyug/${paperCode}.json`;
    const syllabusRes = await fetch(syllabusPath);

    if (syllabusRes.ok) {
      const syllabusData = await syllabusRes.json();
      renderSyllabus(syllabusData);

      if (downloadBtn) {
        downloadBtn.style.display = "inline-flex";
        downloadBtn.onclick = () => window.open(syllabusPath, "_blank");
      }
    } else {
      if (noSyllabusMsg) noSyllabusMsg.hidden = false;
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
   PAPER HEADER
========================= */
function renderPaperHeaderFromPapers(papers) {
  const latest = papers[0];

  document.getElementById("paperTitle").textContent = latest.paper_name;
  document.getElementById("paperCode").textContent = latest.paper_code;

  document.getElementById("paperMeta").innerHTML = `
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
   AVAILABLE PAPERS
========================= */
function renderAvailablePapers(papers) {
  const list = document.getElementById("availablePapers");
  list.innerHTML = "";

  papers.forEach(p => {
    const li = document.createElement("li");
    li.className = "paper-row";

    li.innerHTML = `
      <span>${p.year}</span>
      <a href="${p.pdf}" class="link-red" target="_blank" rel="noopener">
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
    const heading =
      unit.unit && unit.title
        ? `${unit.unit} · ${unit.title}`
        : unit.unit || unit.title || "";

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
   REPEATED QUESTIONS (FIXED)
========================= */
function renderRepeatedQuestions(sections) {
  const container = document.getElementById("repeated-container");
  if (!container || !Array.isArray(sections)) return;

  container.innerHTML = "";

  const unitMap = {};
  let shortCounter = 1;

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

    /* ---- Section A (short) ---- */
    data.short.forEach(q => {
      content.insertAdjacentHTML(
        "beforeend",
        `
        <div class="rq-question">
          <span class="rq-number">${shortCounter++}.</span>
          <span class="rq-text">${q.question}</span>
          <span class="rq-marks">${q.marks || ""}</span>
        </div>
        `
      );
    });

    /* ---- Section B (long, FIXED) ---- */
    data.long.forEach((choice, idx) => {
      const mainNo = choice.question_no;

      choice.parts.forEach((part, pIndex) => {
        const sub = pIndex === 0 ? "i" : "ii";

        content.insertAdjacentHTML(
          "beforeend",
          `
          <div class="rq-part">
            <span class="rq-number">${mainNo}.${sub}</span>
            <span class="rq-text">${part.question}</span>
            <span class="rq-marks">${
              Array.isArray(part.breakup)
                ? part.breakup.join("+")
                : part.marks || ""
            }</span>
          </div>
          `
        );

        if (pIndex === 0) {
          content.insertAdjacentHTML(
            "beforeend",
            `<div class="rq-or">OR</div>`
          );
        }
      });

      if (idx < data.long.length - 1) {
        content.insertAdjacentHTML(
          "beforeend",
          `<div class="rq-choice-gap"></div>`
        );
      }
    });

    block.querySelector(".rq-unit-header").onclick = () => {
      content.hidden ^= true;
    };

    container.appendChild(block);
  });
}
