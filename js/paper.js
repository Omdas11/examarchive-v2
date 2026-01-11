// paper.js — Phase 1.1 (unit-wise collapsible)

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

function renderPaperHeader(data) {
  const titleEl = document.querySelector(".paper-title");
  const codeEl = document.querySelector(".paper-code");

  if (titleEl) titleEl.textContent = data.paper_name;
  if (codeEl) codeEl.textContent = data.paper_code;
}

function renderRepeatedQuestions(sections) {
  const container = document.getElementById("repeated-container");
  if (!container) return;
  container.innerHTML = "";

  let globalNumber = 1;

  sections.forEach(section => {
    section.units.forEach(unit => {
      const unitBlock = document.createElement("div");
      unitBlock.className = "rq-unit";

      unitBlock.innerHTML = `
        <div class="rq-unit-header">${unit.unit}</div>
        <div class="rq-unit-content" hidden></div>
      `;

      const content = unitBlock.querySelector(".rq-unit-content");

      // Section A
      if (section.section === "A" && unit.questions) {
        unit.questions.forEach(q => {
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
      }

      // Section B
      if (section.section === "B" && unit.choices) {
        unit.choices.forEach((choice, idx) => {
          const choiceBlock = document.createElement("div");
          choiceBlock.className = "rq-choice";

          choiceBlock.innerHTML = `
            <div class="rq-number rq-long-number">${choice.question_no}.</div>
          `;

          choice.parts.forEach(part => {
            const breakup =
              Array.isArray(part.breakup) ? part.breakup.join("+") : part.marks;

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

          if (unit.choices.length > 1 && idx < unit.choices.length - 1) {
            const orDiv = document.createElement("div");
            orDiv.className = "rq-or";
            orDiv.textContent = "OR";
            content.appendChild(orDiv);
          }
        });
      }

      // TOGGLE (this is the missing piece)
      unitBlock.querySelector(".rq-unit-header").addEventListener("click", () => {
        content.hidden = !content.hidden;
      });

      container.appendChild(unitBlock);
    });
  });
}
