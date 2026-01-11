// paper.js — FINAL fixed version (syllabus + correct numbering)

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const paperCode = params.get("code");
  if (!paperCode) return;

  try {
    // Load syllabus
    const syllabusRes = await fetch(
      `data/syllabus/assam-university/physics/fyug/${paperCode}.json`
    );
    if (syllabusRes.ok) {
      const syllabusData = await syllabusRes.json();
      renderSyllabus(syllabusData);
    }

    // Load repeated questions
    const rqRes = await fetch(
      `data/repeated-questions/assam-university/physics/fyug/${paperCode}.json`
    );
    if (!rqRes.ok) throw new Error("Repeated questions JSON not found");

    const rqData = await rqRes.json();
    renderPaperHeader(rqData);
    renderRepeatedQuestions(rqData.sections);

  } catch (err) {
    console.error(err);
  }
});

/* =========================
   PAPER HEADER
========================= */
function renderPaperHeader(data) {
  const titleEl = document.querySelector(".paper-title");
  const codeEl = document.querySelector(".paper-code");

  if (titleEl) titleEl.textContent = data.paper_name;
  if (codeEl) codeEl.textContent = data.paper_code;
}

/* =========================
   SYLLABUS (RESTORED)
========================= */
function renderSyllabus(data) {
  const container = document.getElementById("syllabus-container");
  if (!container || !data.units) return;

  container.innerHTML = "";

  data.units.forEach(unit => {
    const block = document.createElement("div");
    block.className = "syllabus-unit";

    block.innerHTML = `
      <div class="syllabus-header">
        ${unit.unit} · ${unit.title}
      </div>
      <div class="syllabus-content" hidden>
        <ul>
          ${(unit.topics || []).map(t => `<li>${t}</li>`).join("")}
        </ul>
      </div>
    `;

    block.querySelector(".syllabus-header").onclick = () => {
      const content = block.querySelector(".syllabus-content");
      content.hidden = !content.hidden;
    };

    container.appendChild(block);
  });
}
/* =========================
   REPEATED QUESTIONS (FIXED)
========================= */
function renderRepeatedQuestions(sections) {
  const container = document.getElementById("repeated-container");
  if (!container) return;
  container.innerHTML = "";

  // Merge Section A & B by unit
  const unitMap = {};

  sections.forEach(section => {
    section.units.forEach(unit => {
      if (!unitMap[unit.unit]) {
        unitMap[unit.unit] = { unit: unit.unit, short: [], long: [] };
      }

      if (section.section === "A" && unit.questions) {
        unitMap[unit.unit].short.push(...unit.questions);
      }

      if (section.section === "B" && unit.choices) {
        unitMap[unit.unit].long.push(...unit.choices);
      }
    });
  });

  let counter = 1;

  Object.values(unitMap).forEach(unitData => {
    const unitBlock = document.createElement("div");
    unitBlock.className = "rq-unit";

    unitBlock.innerHTML = `
      <div class="rq-unit-header">${unitData.unit}</div>
      <div class="rq-unit-content" hidden></div>
    `;

    const content = unitBlock.querySelector(".rq-unit-content");

    // Short questions
    unitData.short.forEach(q => {
      content.insertAdjacentHTML(
        "beforeend",
        `
        <div class="rq-question">
          <span class="rq-number">${counter}.</span>
          <span class="rq-text">${q.question}</span>
          <span class="rq-marks">${q.marks}</span>
        </div>
        `
      );
      counter++;
    });

    // Long questions
    unitData.long.forEach((choice, idx) => {
      const choiceBlock = document.createElement("div");
      choiceBlock.className = "rq-choice";

      choiceBlock.innerHTML = `
        <div class="rq-number rq-long-number">${counter}.</div>
      `;

      choice.parts.forEach(part => {
        const breakup = Array.isArray(part.breakup)
          ? part.breakup.join("+")
          : part.marks;

        choiceBlock.insertAdjacentHTML(
          "beforeend",
          `
          <div class="rq-part">
            <span class="rq-part-label">(${part.label})</span>
            <span class="rq-text">${part.question}</span>
            <span class="rq-marks">${breakup}</span>
          </div>
          `
        );
      });

      content.appendChild(choiceBlock);
      counter++;

      if (unitData.long.length > 1 && idx < unitData.long.length - 1) {
        content.insertAdjacentHTML(
          "beforeend",
          `<div class="rq-or">OR</div>`
        );
      }
    });

    unitBlock.querySelector(".rq-unit-header").onclick = () => {
      content.hidden = !content.hidden;
    };

    container.appendChild(unitBlock);
  });
}
