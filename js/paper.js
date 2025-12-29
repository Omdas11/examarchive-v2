// paper.js — ExamArchive v2 (Syllabus Dropdown + Download)

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const paperCode = params.get("code");

  if (!paperCode) {
    console.error("No paper code provided in URL");
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
      return;
    }

    matches.sort((a, b) => b.year - a.year);
    const latest = matches[0];

    /* =========================
       UPDATE PAPER HEADER
    ========================== */
    document.querySelector(".paper-code").textContent = latest.paper_code;
    document.querySelector(".paper-title").textContent = latest.paper_name;

    const metaContainer = document.querySelector(".paper-meta");
    metaContainer.innerHTML = `
      <span class="chip">${latest.programme}</span>
      <span class="chip">Semester ${latest.semester}</span>
      <span class="chip">${latest.course_type}</span>
      <span class="chip">${latest.subject}</span>
    `;

    const latestBtn = document.querySelector(".btn-red");
    latestBtn.href = latest.pdf;

    /* =========================
       AVAILABLE QUESTION PAPERS
    ========================== */
    const list = document.querySelector(".paper-list");
    list.innerHTML = "";

    matches.forEach(paper => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${paper.year}</span>
        <a href="${paper.pdf}" class="link-red" target="_blank">
          Open PDF →
        </a>
      `;
      list.appendChild(li);
    });

    /* =========================
       LOAD SYLLABUS (FYUG ONLY)
    ========================== */
    if (paperCode.startsWith("PHYDSC")) {
      loadSyllabus(paperCode);
    } else {
      const container = document.getElementById("syllabus-container");
      if (container) {
        container.innerHTML =
          "<p class='coming-soon'>Syllabus not available for this paper yet.</p>";
      }
    }

  } catch (err) {
    console.error("Failed to load paper data:", err);
  }
});

/* =========================
   SYLLABUS LOADER
========================== */
async function loadSyllabus(paperCode) {
  const syllabusPath =
    `data/syllabus/assam-university/physics/fyug/${paperCode}.json`;

  try {
    const res = await fetch(syllabusPath);
    if (!res.ok) throw new Error("Syllabus not found");

    const syllabus = await res.json();

/* ===== ADD THIS BLOCK ===== */
const info = document.getElementById("syllabus-info");
if (info) {
  info.innerHTML = `
    <span>${syllabus.credits} Credits</span>
    &nbsp;•&nbsp;
    <span>Last updated: ${syllabus.last_updated}</span>
  `;
}
/* ===== END ===== */

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
   RENDER SYLLABUS (DROPDOWN)
========================== */
function renderSyllabus(units, syllabus, paperCode) {
  const container = document.getElementById("syllabus-container");
  if (!container) return;

  container.innerHTML = "";

  units.forEach((unit, index) => {
    const div = document.createElement("div");
    div.className = "syllabus-unit";

    div.innerHTML = `
      <button class="unit-header">
        <span class="unit-title">
          Unit ${index + 1}: ${unit.title}
        </span>
        <span class="unit-actions">
         <button class="unit-download" title="Download unit">
           <img src="assets/icons/download.png" alt="Download">
         </button>
         <span class="unit-arrow"></span>
        </span>
      </button>

      <div class="unit-content">
        <ul>
          ${unit.topics.map(t => `<li>${t}</li>`).join("")}
        </ul>
      </div>
    `;

    // Toggle expand / collapse
    div.querySelector(".unit-header").addEventListener("click", e => {
      if (e.target.classList.contains("unit-download")) return;
      div.classList.toggle("active");
    });

    // Download single unit
    div.querySelector(".unit-download").addEventListener("click", e => {
      e.stopPropagation();
      downloadUnit(unit, index + 1, paperCode);
    });

    container.appendChild(div);
  });

  // Download full syllabus
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
