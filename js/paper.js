/**
 * ExamArchive v2 — Paper Page
 * Phase 9.2.8 - Fixed Supabase initialization timing
 * FINAL (Year-resolved, schema-correct, UX-polished + PDF downloads)
 * + AUTH PROTECTED: RQ and Notes require login
 * // PHASE 3: migrate RQ & syllabus to backend
 */

// PHASE 3: paper metadata should come from database, not JSON
const PAPERS_URL = "data/papers.json";

const params = new URLSearchParams(window.location.search);
const CODE = params.get("code");
const YEAR = Number(params.get("year"));

if (!CODE || !YEAR) {
  document.querySelector(".paper-page").innerHTML =
    "<p class='coming-soon'>Invalid paper link.</p>";
  throw new Error("Missing paper code or year");
}

/* ---------- Helpers ---------- */
function semesterToRoman(n) {
  const map = ["I","II","III","IV","V","VI","VII","VIII"];
  return map[n - 1] || n;
}

/* ---------- Unified Resolver ---------- */
async function resolvePaperData(type, paper) {
  const universitySlug = paper.university.toLowerCase().replace(/\s+/g, "-");
  const programme = paper.programme.toLowerCase();
  const subject = paper.subject.toLowerCase();

  const basePath =
    `data/${type}/${universitySlug}/${programme}/${subject}/`;

  for (const code of paper.paper_codes) {
    try {
      const res = await fetch(`${basePath}${code}.json`);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Loaded ${type} data for ${code}`);
        return { status: "found", data };
      }
    } catch {}
  }
  console.log(`ℹ️ No ${type} found for codes: ${paper.paper_codes.join(", ")}`);
  return { status: "not_found" };
}

/* ================= SYLLABUS ================= */
function renderSyllabus(data) {
  const container = document.getElementById("syllabus-container");
  container.innerHTML = "";

  if (!Array.isArray(data.units) || !data.units.length) {
    container.innerHTML =
      "<p class='coming-soon'>Syllabus not available.</p>";
    return;
  }

  data.units.forEach((u, idx) => {
    const unit = document.createElement("div");
    unit.className = "syllabus-unit";

    const header = document.createElement("div");
    header.className = "syllabus-header";
    header.innerHTML = `
      <span>Unit ${u.unit_no ?? idx + 1}${u.title ? " • " + u.title : ""}</span>
      ${typeof u.hours === "number"
        ? `<span class="syllabus-lectures">${u.hours} Hours</span>`
        : ""}
    `;

    const content = document.createElement("div");
    content.className = "syllabus-content";
    content.hidden = true;
    content.innerHTML = `
      <ul>
        ${(u.topics || []).map(t => `<li>${t}</li>`).join("")}
      </ul>
    `;

    header.onclick = () => (content.hidden = !content.hidden);

    unit.append(header, content);
    container.appendChild(unit);
  });
}

/* ================= REPEATED QUESTIONS ================= */
async function renderRepeatedQuestions(data) {
  const container = document.getElementById("repeated-container");
  container.innerHTML = "";

  // Check authentication
  const supabase = await window.waitForSupabase();
  let session = null;
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData?.session;
  }

  if (!session) {
    // User is not logged in - show login prompt
    container.innerHTML = `
      <div class="auth-required">
        <p class="auth-required-text">🔒 Sign in to view repeated questions</p>
        <button class="btn btn-primary" id="rq-sign-in-btn">
          Sign in with Google
        </button>
      </div>
    `;
    
    // Attach click handler to open avatar popup
    const signInBtn = document.getElementById("rq-sign-in-btn");
    signInBtn?.addEventListener("click", () => {
      openAvatarPopupWithHighlight();
    });
    return;
  }

  if (!Array.isArray(data.sections) || !data.sections.length) {
    container.innerHTML =
      "<p class='coming-soon'>Repeated questions not available.</p>";
    return;
  }

  let globalQno = 1;

  data.sections.forEach(section => {
    if (section.instruction) {
      const inst = document.createElement("p");
      inst.className = "rq-instruction";
      inst.textContent = section.instruction;
      container.appendChild(inst);
    }

    section.units.forEach(unitBlock => {
      const unit = document.createElement("div");
      unit.className = "rq-unit";

      const header = document.createElement("div");
      header.className = "rq-unit-header";
      header.textContent =
        unitBlock.unit_label || `Unit ${unitBlock.unit_no}`;

      const content = document.createElement("div");
      content.className = "rq-unit-content";
      content.hidden = true;

      if (Array.isArray(unitBlock.questions)) {
        unitBlock.questions.forEach(q => {
          const row = document.createElement("div");
          row.className = "rq-question";
          row.innerHTML = `
            <span class="rq-number">${globalQno++}.</span>
            <span>${q.text}</span>
            <span class="rq-marks">${q.marks}</span>
          `;
          content.appendChild(row);
        });
      }

      if (Array.isArray(unitBlock.choices)) {
        unitBlock.choices.forEach(choice => {
          const mainNo = globalQno++;
          choice.parts.forEach(p => {
            const row = document.createElement("div");
            row.className = "rq-part";
            row.innerHTML = `
              <span class="rq-number">${mainNo}.</span>
              <span>(${p.label}) ${p.text}</span>
              <span class="rq-marks">${p.marks}</span>
            `;
            content.appendChild(row);
          });
        });
      }

      header.onclick = () => (content.hidden = !content.hidden);

      unit.append(header, content);
      container.appendChild(unit);
    });
  });
}

/* ================= SYLLABUS PDF DOWNLOAD ================= */
async function setupSyllabusDownloads(paperCode) {
  const toggle = document.getElementById("syllabus-download-toggle");
  const menu = document.getElementById("syllabus-download-menu");
  const paragraph = document.getElementById("download-syllabus-paragraph");
  const list = document.getElementById("download-syllabus-list");

  if (!toggle || !menu || !paragraph || !list) return;

  paragraph.href = `assets/pdfs/syllabus/${paperCode}-paragraph.pdf`;
  list.href = `assets/pdfs/syllabus/${paperCode}-list.pdf`;

  toggle.onclick = e => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
  };

  // Auth check for download links
  const downloadLinks = [paragraph, list];
  downloadLinks.forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Check authentication
      const supabase = await window.waitForSupabase();
      let session = null;
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }

      if (!session) {
        // Guest user - open avatar popup with highlighted sign-in
        menu.classList.add("hidden");
        openAvatarPopupWithHighlight();
      } else {
        // Logged-in user - proceed with download
        window.open(link.href, "_blank");
      }
    });
  });

  document.addEventListener("click", e => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });
}

/* ================= LOAD PAPER ================= */
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  const selected = all.find(
    p => p.paper_codes?.includes(CODE) && p.year === YEAR
  );

  if (!selected) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Paper not found.</p>";
    return;
  }

  const related = all
    .filter(p => p.paper_codes?.includes(CODE))
    .sort((a, b) => b.year - a.year);

  /* ---------- Header ---------- */
  document.getElementById("paperTitle").textContent =
    selected.paper_names.join(" / ");
  document.getElementById("paperCode").textContent =
    selected.paper_codes.join(" / ");

  const meta = document.getElementById("paperMeta");
  meta.innerHTML = `
    <span class="meta-line">
      ${selected.university} • ${selected.programme} • ${selected.stream.toUpperCase()}
      • Semester ${semesterToRoman(selected.semester)}
    </span>
  `;

  /* ---------- Availability Badges ---------- */
  const badgeWrap = document.createElement("div");
  badgeWrap.className = "availability-badges";

  if (selected.has_rq === true) {
    const rq = document.createElement("span");
    rq.className = "availability-badge active";
    rq.textContent = "Repeated Questions";
    badgeWrap.appendChild(rq);
  }

  meta.appendChild(badgeWrap);

  /* ---------- Latest PDF ---------- */
  const latest = related[0];
  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = latest.pdf;
  latestBtn.textContent = `Open Latest PDF (${latest.year}) →`;

  /* ---------- Available Papers ---------- */
  const listEl = document.getElementById("availablePapers");
  listEl.innerHTML = "";
  related.forEach(p => {
    listEl.innerHTML += `
      <li class="paper-row">
        <span>${p.year} Question Paper</span>
        <a href="${p.pdf}" target="_blank" class="link-red">Open →</a>
      </li>
    `;
  });

  /* ---------- Syllabus ---------- */
  const syllabus = await resolvePaperData("syllabus", selected);
  if (syllabus.status === "found") {
    renderSyllabus(syllabus.data);
    setupSyllabusDownloads(selected.paper_codes[0]);
  }

  /* ---------- Repeated Questions ---------- */
  const rq = await resolvePaperData("repeated-questions", selected);
  if (rq.status === "found") await renderRepeatedQuestions(rq.data);
  
  /* ---------- Notes & Resources (Auth Protected) ---------- */
  await protectNotesSection();
}

/* ================= PROTECT NOTES SECTION ================= */
async function protectNotesSection() {
  const notesSection = Array.from(document.querySelectorAll('.paper-section')).find(s => 
    s.querySelector('h2')?.textContent.includes('Notes')
  );
  
  if (!notesSection) return;

  // Check authentication
  const supabase = await window.waitForSupabase();
  let session = null;
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData?.session;
  }

  if (!session) {
    // User is not logged in - replace content with login prompt
    const contentDiv = notesSection.querySelector('.skeleton-group, .coming-soon')?.parentElement;
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div class="auth-required">
          <p class="auth-required-text">🔒 Sign in to view notes & resources</p>
          <button class="btn btn-primary" id="notes-sign-in-btn">
            Sign in with Google
          </button>
        </div>
      `;
      
      // Attach click handler to open avatar popup
      const signInBtn = document.getElementById("notes-sign-in-btn");
      signInBtn?.addEventListener("click", () => {
        openAvatarPopupWithHighlight();
      });
    }
  }
}

/* ================= HELPER: OPEN AVATAR POPUP WITH HIGHLIGHT ================= */
function openAvatarPopupWithHighlight() {
  const avatarPopup = document.getElementById("avatar-popup");
  if (avatarPopup) {
    avatarPopup.classList.add("open");
    // Highlight Sign in button
    setTimeout(() => {
      const signInButton = document.getElementById("avatarSignInBtn");
      if (signInButton) {
        signInButton.focus();
        signInButton.classList.add('btn-pulse');
        // Remove animation after it completes
        setTimeout(() => {
          signInButton.classList.remove('btn-pulse');
        }, 1800); // 0.6s * 3 iterations
      }
    }, 100);
  }
}

/* ---------- Init ---------- */
loadPaper();
