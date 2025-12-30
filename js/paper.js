// paper.js — ExamArchive v2 (Paper Page + Syllabus UI)

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

    if (matches.length === 0) {
      console.warn("No papers found for:", paperCode);
    }

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
    if (openBtn && latest.pdf) {
      openBtn.href = latest.pdf;
    }

    /* =========================
       AVAILABLE QUESTION PAPERS
    ========================== */
    const list = document.querySelector(".paper-list");
    list.innerHTML = "";

    matches.forEach(paper => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${paper.year}</span>
        <a href="${paper.pdf}" target="_blank" class="link-red">
          Open PDF →
        </a>
      `;
      list.appendChild(li);
    });

    /* =========================
       LOAD SYLLABUS
    ========================== */
    loadSyllabus(paperCode);
    loadRepeatedQuestions(paperCode);

  } catch (err) {
    console.error("Failed to load paper page:", err);
  }
});

/* =========================
   SYLLABUS LOADER
========================== */
async function loadSyllabus(paperCode) {
  const path = `data/syllabus/assam-university/physics/fyug/${paperCode}.json`;

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Syllabus not found");

    const syllabus = await res.json();

    // Meta info
    const info = document.getElementById("syllabus-info");
    if (info) {
      info.innerHTML = `
        ${syllabus.credits} Credits •
        Syllabus updated on: ${syllabus.last_updated}
      `;
    }

    renderSyllabus(syllabus.units, syllabus, paperCode);

  } catch (err) {
    const container = document.getElementById("syllabus-container");
    if (container) {
      container.innerHTML =
        "<p class='coming-soon'>Syllabus not available for this paper yet.</p>";
    }
  }
}

/* =========================
   RENDER SYLLABUS (UI POLISHED)
========================== */
function renderSyllabus(units, syllabus, paperCode) {
  const container = document.getElementById("syllabus-container");
  container.innerHTML = "";

  units.forEach((unit, index) => {
    const div = document.createElement("div");
    div.className = "syllabus-unit";

    div.innerHTML = `
      <div class="unit-header">
        <button class="unit-toggle">
          <span class="unit-title">
            <span class="unit-name">
              Unit ${index + 1}: ${unit.title}
            </span>
            <span class="unit-lectures">
              · ${unit.lectures} lectures
            </span>
          </span>
        </button>

        <div class="unit-actions">
          <button class="unit-download" title="Download unit">
            <img src="assets/icons/download.png" alt="Download">
          </button>
          <span class="unit-arrow"></span>
        </div>
      </div>

      <div class="unit-content">
        <ul>
          ${unit.topics.map(t => `<li>${t}</li>`).join("")}
        </ul>
      </div>
    `;

    // Toggle by title
    div.querySelector(".unit-toggle").addEventListener("click", () => {
      div.classList.toggle("active");
    });

    // Toggle by arrow
    div.querySelector(".unit-arrow").addEventListener("click", () => {
      div.classList.toggle("active");
    });

    // Unit download
    div.querySelector(".unit-download").addEventListener("click", e => {
      e.stopPropagation();
      downloadUnit(unit, index + 1, paperCode);
    });

    container.appendChild(div);
  });

  // Full syllabus download
  const fullBtn = document.getElementById("download-full");
  if (fullBtn) {
    fullBtn.onclick = () => {
      const text = syllabusToText(syllabus);
      downloadFile(text, `${paperCode}-syllabus.txt`);
    };
  }
}

/* =========================
   DOWNLOAD HELPERS
========================== */
function downloadFile(content, filename, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function syllabusToText(syllabus) {
  let text = `${syllabus.paper_name}\n\n`;

  syllabus.units.forEach((unit, i) => {
    text += `Unit ${i + 1}: ${unit.title}\n`;
    unit.topics.forEach(t => {
      text += `- ${t}\n`;
    });
    text += "\n";
  });

  return text;
}

function downloadUnit(unit, unitNo, paperCode) {
  let text = `Unit ${unitNo}: ${unit.title}\n\n`;
  unit.topics.forEach(t => {
    text += `- ${t}\n`;
  });

  downloadFile(text, `${paperCode}-Unit-${unitNo}.txt`);
}
