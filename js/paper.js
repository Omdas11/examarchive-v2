// paper.js — Phase 1 simplified structure (unit-based, numbered)

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
   REPEATED QUESTIONS
========================= */
function renderRepeatedQuestions(sections) {
  const container = document.getElementById("repeated-container");
  if (!container) return;

  container.innerHTML = "";

  let globalQuestionNumber = 1;

  sections.forEach(section => {
    section.units.forEach(unit => {
      const unitBlock = document.createElement("div");
      unitBlock.className = "rq-unit";

      unitBlock.innerHTML = `
        <div class="rq-unit-header">
          ${unit.unit}
        </div>
        <div class="rq-unit-content"></div>
      `;

      const content = unitBlock.querySelector(".rq-unit-content");

      /* -------- Section A questions (simple) -------- */
      if (section.section === "A" && unit.questions) {
        unit.questions.forEach(q => {
          const qDiv = document.createElement("div");
          qDiv.className = "rq-question";

          qDiv.innerHTML = `
            <span class="rq-number">${globalQuestionNumber}.</span>
            <span class="rq-text">${q.question}</span>
            <span class="rq-marks">${q.marks}</span>
          `;

          content.appendChild(qDiv);
          globalQuestionNumber++;
        });
      }

      /* -------- Section B questions (choices with a/b) -------- */
      if (section.section === "B" && unit.choices) {
        unit.choices.forEach((choice, index) => {
          const choiceBlock = document.createElement("div");
          choiceBlock.className = "rq-choice";

          const qNoDiv = document.createElement("div");
          qNoDiv.className = "rq-number rq-long-number";
          qNoDiv.textContent = `${choice.question_no}.`;
          choiceBlock.appendChild(qNoDiv);

          choice.parts.forEach(part => {
            const partDiv = document.createElement("div");
            partDiv.className = "rq-part";

            const breakup =
              Array.isArray(part.breakup) && part.breakup.length
                ? part.breakup.join("+")
                : part.marks;

            partDiv.innerHTML = `
              <span class="rq-part-label">(${part.label})</span>
              <span class="rq-text">${part.question}</span>
              <span class="rq-marks">${breakup}</span>
            `;

            choiceBlock.appendChild(partDiv);
          });

          content.appendChild(choiceBlock);

          // OR separator
          if (unit.choices.length > 1 && index < unit.choices.length - 1) {
            const orDiv = document.createElement("div");
            orDiv.className = "rq-or";
            orDiv.textContent = "OR";
            content.appendChild(orDiv);
          }
        });
      }

      container.appendChild(unitBlock);
    });
  });
}
