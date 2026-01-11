// paper.js — NEW schema renderer (sections + a/b support)

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const paperCode = params.get("code");

  if (!paperCode) return;

  try {
    const res = await fetch(
      `data/repeated-questions/assam-university/physics/fyug/${paperCode}.json`
    );
    if (!res.ok) throw new Error("JSON not found");

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

  sections.forEach(section => {
    const sectionBlock = document.createElement("div");
    sectionBlock.className = "rq-section";

    sectionBlock.innerHTML = `
      <h3 class="rq-section-title">Section ${section.section}</h3>
      ${section.instruction ? `<p class="rq-instruction">${section.instruction}</p>` : ""}
    `;

    section.units.forEach(unit => {
      const unitBlock = document.createElement("div");
      unitBlock.className = "rq-unit";

      unitBlock.innerHTML = `
        <div class="rq-header">
          <span class="rq-title">${unit.unit}</span>
        </div>
        <div class="rq-content"></div>
      `;

      const content = unitBlock.querySelector(".rq-content");

      // SECTION A
      if (section.section === "A") {
        const ol = document.createElement("ol");
        ol.className = "rq-list";

        unit.questions.forEach(q => {
          const li = document.createElement("li");
          li.className = "rq-question";

          li.innerHTML = `
            <div class="rq-text">${q.question}</div>
            <div class="rq-meta">Marks: ${q.marks}</div>
          `;
          ol.appendChild(li);
        });

        content.appendChild(ol);
      }

      // SECTION B
      if (section.section === "B") {
        unit.choices.forEach(choice => {
          const choiceBlock = document.createElement("div");
          choiceBlock.className = "rq-choice";

          choiceBlock.innerHTML = `
            <div class="rq-choice-title">
              Question ${choice.question_no}
            </div>
          `;

          choice.parts.forEach(part => {
            const partDiv = document.createElement("div");
            partDiv.className = "rq-part";

            partDiv.innerHTML = `
              <div class="rq-part-label">(${part.label})</div>
              <div class="rq-text">${part.question}</div>
              <div class="rq-meta">Marks: ${part.marks}</div>
            `;

            choiceBlock.appendChild(partDiv);
          });

          content.appendChild(choiceBlock);

          // OR divider if multiple choices
          if (unit.choices.length > 1 && choice !== unit.choices.at(-1)) {
            const orDiv = document.createElement("div");
            orDiv.className = "rq-or";
            orDiv.textContent = "OR";
            content.appendChild(orDiv);
          }
        });
      }

      // toggle open/close
      unitBlock.querySelector(".rq-header").addEventListener("click", () => {
        unitBlock.classList.toggle("active");
      });

      sectionBlock.appendChild(unitBlock);
    });

    container.appendChild(sectionBlock);
  });
}
