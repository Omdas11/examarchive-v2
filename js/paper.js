// paper.js — Correct unit-merged renderer for Repeated Questions

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const paperCode = params.get("code");
  if (!paperCode) return;

  try {
    const res = await fetch(
      `data/repeated-questions/assam-university/physics/fyug/${paperCode}.json`
    );
    if (!res.ok) throw new Error("Repeated questions JSON not found");

    const data = await res.json();

    renderPaperHeader(data);
    renderRepeatedQuestions(data.sections);

  } catch (err) {
    console.error(err);
    const container = document.getElementById("repeated-container");
    if (container) {
      container.innerHTML =
        "<p class='coming-soon'>Repeated questions not available.</p>";
    }
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
   REPEATED QUESTIONS (MERGED UNITS)
========================= */
function renderRepeatedQuestions(sections) {
  const container = document.getElementById("repeated-container");
  if (!container) return;
  container.innerHTML = "";

  /* --------------------------------
     1. Merge Section A & B by Unit
  -------------------------------- */
  const unitMap = {};

  sections.forEach(section => {
    section.units.forEach(unit => {
      if (!unitMap[unit.unit]) {
        unitMap[unit.unit] = {
          unit: unit.unit,
          short: [],
          long: []
        };
      }

      // Section A → short questions
      if (section.section === "A" && unit.questions) {
        unitMap[unit.unit].short.push(...unit.questions);
      }

      // Section B → long questions
      if (section.section === "B" && unit.choices) {
        unitMap[unit.unit].long.push(...unit.choices);
      }
    });
  });

  /* --------------------------------
     2. Render each Unit ONCE
  -------------------------------- */
  let globalNumber = 1;

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
      const qDiv = document.createElement("div");
      qDiv.className = "rq-question";

      qDiv.innerHTML = `
        <span class="rq-number">${globalNumber}.</span>
        <span class="rq-text">${q.question}</span>
        <span class="rq-marks">${q.marks}</span>
      `;
      content.appendChild(qDiv);
      globalNumber++;
    });

    // Long questions (choices)
    unitData.long.forEach((choice, idx) => {
      const choiceBlock = document.createElement("div");
      choiceBlock.className = "rq-choice";

      const qNoDiv = document.createElement("div");
      qNoDiv.className = "rq-number rq-long-number";
      qNoDiv.textContent = `${choice.question_no}.`;
      choiceBlock.appendChild(qNoDiv);

      choice.parts.forEach(part => {
        const breakup =
          Array.isArray(part.breakup) && part.breakup.length
            ? part.breakup.join("+")
            : part.marks;

        const partDiv = document.createElement("div");
        partDiv.className = "rq-part";
        partDiv.innerHTML = `
          <span class="rq-part-label">(${part.label})</span>
          <span class="rq-text">${part.question}</span>
          <span class="rq-marks">${breakup}</span>
        `;
        choiceBlock.appendChild(partDiv);
      });

      content.appendChild(choiceBlock);

      if (unitData.long.length > 1 && idx < unitData.long.length - 1) {
        const orDiv = document.createElement("div");
        orDiv.className = "rq-or";
        orDiv.textContent = "OR";
        content.appendChild(orDiv);
      }
    });

    // Toggle unit (same UX as syllabus)
    unitBlock.querySelector(".rq-unit-header").addEventListener("click", () => {
      content.hidden = !content.hidden;
    });

    container.appendChild(unitBlock);
  });
}
