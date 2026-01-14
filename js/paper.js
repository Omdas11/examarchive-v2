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
   REPEATED QUESTIONS (YEAR-WISE, CONTINUOUS)
========================= */
function renderRepeatedQuestions(sections) {
  const container = document.getElementById("repeated-container");
  if (!container || !Array.isArray(sections)) return;

  container.innerHTML = "";

  let qNo = 1; // ✅ GLOBAL continuous counter

  sections.forEach(section => {
    if (!Array.isArray(section.units)) return;

    section.units.forEach(unit => {
      const block = document.createElement("div");
      block.className = "rq-unit";

      block.innerHTML = `
        <div class="rq-unit-header">${unit.unit}</div>
        <div class="rq-unit-content" hidden></div>
      `;

      const content = block.querySelector(".rq-unit-content");

      /* ---------- SECTION A (SHORT QUESTIONS) ---------- */
      if (section.section === "A" && Array.isArray(unit.questions)) {
        const yearMap = {};

        unit.questions.forEach(q => {
          const years = q.years && q.years.length ? q.years : ["Unknown"];
          years.forEach(y => {
            yearMap[y] ||= [];
            yearMap[y].push(q);
          });
        });

        Object.keys(yearMap).sort().forEach(year => {
          content.insertAdjacentHTML(
            "beforeend",
            `<div class="rq-year">${year}</div>`
          );

          yearMap[year].forEach(q => {
            content.insertAdjacentHTML(
              "beforeend",
              `
              <div class="rq-question">
                <span class="rq-number">${qNo++}.</span>
                <span class="rq-text">${q.question}</span>
                <span class="rq-marks">${q.marks || ""}</span>
              </div>
              `
            );
          });
        });
      }

      /* ---------- SECTION B (LONG QUESTIONS) ---------- */
      if (section.section === "B" && Array.isArray(unit.choices)) {
        const yearMap = {};

        unit.choices.forEach(choice => {
          const years = choice.years && choice.years.length ? choice.years : ["Unknown"];
          years.forEach(y => {
            yearMap[y] ||= [];
            yearMap[y].push(choice);
          });
        });

        Object.keys(yearMap).sort().forEach(year => {
          content.insertAdjacentHTML(
            "beforeend",
            `<div class="rq-year">${year}</div>`
          );

          yearMap[year].forEach(choice => {
            const baseNo = qNo++;

            if (Array.isArray(choice.parts) && choice.parts.length) {
              choice.parts.forEach((part, idx) => {
                const sub = ["i", "ii", "iii", "iv"][idx] || idx + 1;

                content.insertAdjacentHTML(
                  "beforeend",
                  `
                  <div class="rq-part">
                    <span class="rq-number">${baseNo}.${sub}</span>
                    <span class="rq-text">${part.question}</span>
                    <span class="rq-marks">${
                      Array.isArray(part.breakup)
                        ? part.breakup.join("+")
                        : part.marks || ""
                    }</span>
                  </div>
                  `
                );

                if (idx === 0 && choice.parts.length > 1) {
                  content.insertAdjacentHTML(
                    "beforeend",
                    `<div class="rq-or">OR</div>`
                  );
                }
              });
            }
          });
        });
      }

      block.querySelector(".rq-unit-header").onclick = () => {
        content.hidden ^= true;
      };

      container.appendChild(block);
    });
  });
      }
