// paper.js — ExamArchive v2 (Clean + Stable)

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const paperCode = params.get("code");

  if (!paperCode) {
    console.error("No paper code in URL");
    return;
  }

  try {
    /* =========================
       LOAD PAPERS.JSON
    ========================== */
    const res = await fetch("data/papers.json");
    const papers = await res.json();

    const matches = papers.filter(p => p.paper_code === paperCode);
    if (matches.length === 0) return;

    matches.sort((a, b) => b.year - a.year);
    const latest = matches[0];

    /* =========================
       PAPER HEADER
    ========================== */
    document.querySelector(".paper-code").textContent = latest.paper_code;
    document.querySelector(".paper-title").textContent = latest.paper_name;

    document.querySelector(".paper-meta").innerHTML = `
      <span class="chip">${latest.programme}</span>
      <span class="chip">Semester ${latest.semester}</span>
      <span class="chip">${latest.subject}</span>
    `;

    const openBtn = document.querySelector(".btn-red");
    if (openBtn && latest.pdf) openBtn.href = latest.pdf;

    /* =========================
       AVAILABLE PAPERS
    ========================== */
    const list = document.querySelector(".paper-list");
    list.innerHTML = "";

    matches.forEach(paper => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${paper.year}</span>
        <a href="${paper.pdf}" target="_blank" class="link-red">Open PDF →</a>
      `;
      list.appendChild(li);
    });

    loadSyllabus(paperCode);
    loadRepeatedQuestions(paperCode);

  } catch (err) {
    console.error("Paper page failed:", err);
  }
});

/* =========================
   SYLLABUS LOADER
========================== */
async function loadSyllabus(paperCode) {
  const path = `data/syllabus/assam-university/physics/fyug/${paperCode}.json`;
  const container = document.getElementById("syllabus-container");

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error();

    const syllabus = await res.json();
    renderSyllabus(syllabus.units, syllabus, paperCode);

  } catch {
    container.innerHTML =
      "<p class='coming-soon'>Syllabus not available for this paper yet.</p>";
  }
}

function renderSyllabus(units, syllabus, paperCode) {
  const container = document.getElementById("syllabus-container");
  container.innerHTML = "";

  units.forEach((unit, index) => {
    const div = document.createElement("div");
    div.className = "syllabus-unit";

    div.innerHTML = `
      <div class="unit-header">
        <span>Unit ${index + 1}: ${unit.title}</span>
        <span class="unit-arrow"></span>
      </div>
      <div class="unit-content">
        <ul>${unit.topics.map(t => `<li>${t}</li>`).join("")}</ul>
      </div>
    `;

    div.querySelector(".unit-header").onclick = () =>
      div.classList.toggle("active");

    container.appendChild(div);
  });
}

/* =========================
   REPEATED QUESTIONS LOADER
========================== */
async function loadRepeatedQuestions(paperCode) {
  const path = `data/repeated-questions/assam-university/physics/fyug/${paperCode}.json`;
  const container = document.getElementById("repeated-container");

  if (!container) return;

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error();

    const data = await res.json();
    renderRepeatedQuestions(data.units, container);

  } catch {
    container.innerHTML =
      "<p class='coming-soon'>Repeated questions not added yet.</p>";
  }
}

/* =========================
   RENDER REPEATED QUESTIONS
========================== */
function renderRepeatedQuestions(units, container) {
  container.innerHTML = "";

  units.forEach(unit => {
    if (!unit.questions || unit.questions.length === 0) return;

    const block = document.createElement("div");
    block.className = "rq-unit";

    block.innerHTML = `
      <div class="rq-header">
        <span class="rq-title">${unit.unit_title}</span>
        <span class="rq-arrow">▾</span>
      </div>

      <div class="rq-content">
        <ol class="rq-list">
          ${unit.questions.map(q => `
            <li class="rq-question">
              <div class="rq-text">${q.question}</div>
              <div class="rq-meta">
                <span>Years: ${q.years.join(", ")}</span>
                <span>Marks: ${Math.max(...q.marks)}</span>
              </div>
            </li>
          `).join("")}
        </ol>
      </div>
    `;

    block.querySelector(".rq-header").onclick = () =>
      block.classList.toggle("active");

    container.appendChild(block);
  });
}
