// paper.js — ExamArchive v2

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  if (paperCode) {
  loadSyllabus(paperCode);
  }
  const paperCode = params.get("code");

  // Safety check
  if (!paperCode) {
    console.error("No paper code provided in URL");
    return;
  }

  try {
    // Load papers.json
    const res = await fetch("data/papers.json");
    const papers = await res.json();

    // Filter all entries matching this paper code
    const matches = papers.filter(
      p => p.paper_code === paperCode
    );

    if (matches.length === 0) {
      console.warn("No papers found for:", paperCode);
      return;
    }

    // Sort by year (latest first)
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

  } catch (err) {
    console.error("Failed to load paper data:", err);
  }
});

async function loadSyllabus(paperCode) {
  const syllabusPath = `/data/syllabus/assam-university/physics/fyug/${paperCode}.json`;

  try {
    const res = await fetch(syllabusPath);
    if (!res.ok) throw new Error("Syllabus not found");

    const syllabus = await res.json();

    const metaEl = document.getElementById("syllabus-meta");
    const contentEl = document.getElementById("syllabus-content");

    if (!metaEl || !contentEl) return;

    metaEl.innerHTML = `
      <p class="syllabus-meta">
        ${syllabus.syllabus_version} · Last updated: ${syllabus.last_updated}
      </p>
    `;

    let html = "";

    syllabus.units.forEach(unit => {
      html += `
        <div class="syllabus-unit">
          <h3>${unit.unit}: ${unit.title}</h3>
          <ul>
            ${unit.topics.map(topic => `<li>${topic}</li>`).join("")}
          </ul>
        </div>
      `;
    });

    contentEl.classList.remove("syllabus-loading");
    contentEl.innerHTML = html;

  } catch (err) {
    const el = document.getElementById("syllabus-content");
    if (el) el.innerHTML = "<p>Syllabus not available.</p>";
  }
}
