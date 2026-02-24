/**
 * ExamArchive v2 — Paper Page
 * Phase 6: Uses Appwrite file_url stored in DB (no Supabase signed URLs for PDFs)
 */

const params = new URLSearchParams(window.location.search);
const CODE = params.get("code");
const PAPER_ID = params.get("id");

if (!CODE && !PAPER_ID) {
  document.querySelector(".paper-page").innerHTML =
    "<p class='coming-soon'>Invalid paper link. Missing paper code or ID.</p>";
  throw new Error("Missing paper code or ID");
}

/* ---------- Helpers ---------- */
function semesterToRoman(n) {
  const map = ["I","II","III","IV","V","VI","VII","VIII"];
  return map[n - 1] || n;
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ================= LOAD PAPER FROM BACKEND ================= */
async function loadPaper() {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      document.querySelector(".paper-page").innerHTML =
        "<p class='coming-soon'>Unable to connect to backend.</p>";
      return;
    }

    let submissions = [];

    if (PAPER_ID) {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', PAPER_ID)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        document.querySelector(".paper-page").innerHTML =
          "<p class='coming-soon'>Paper not found.</p>";
        return;
      }
      submissions = [data];
    } else if (CODE) {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('paper_code', CODE)
        .eq('status', 'published')
        .order('year', { ascending: false });

      if (error || !data || data.length === 0) {
        document.querySelector(".paper-page").innerHTML =
          "<p class='coming-soon'>No published papers found for this code.</p>";
        return;
      }
      submissions = data;
    }

    const selected = submissions[0];
    // Sanitize subject code to prevent path traversal
    const rawCode = selected.paper_code || CODE;
    const subjectCode = rawCode.replace(/[^a-zA-Z0-9_\-]/g, '');

    /* ---------- Header ---------- */
    document.getElementById("paperTitle").textContent =
      selected.paper_name || selected.paper_code || 'Untitled Paper';
    document.getElementById("paperCode").textContent =
      selected.paper_code || '';

    const meta = document.getElementById("paperMeta");
    const metaParts = [];
    if (selected.year) metaParts.push(`Year: ${selected.year}`);
    if (selected.file_size) metaParts.push(`Size: ${formatFileSize(selected.file_size)}`);
    if (selected.published_at) metaParts.push(`Published: ${new Date(selected.published_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    meta.innerHTML = `<span class="meta-line">${metaParts.join(' · ')}</span>`;

    /* ---------- Latest PDF (Appwrite file_url) ---------- */
    const latestBtn = document.getElementById("latestPdfLink");
    const latestPdfUrl = selected.file_url || (selected.approved_path
      ? await _getLegacySignedUrl(supabase, selected.approved_path)
      : null);

    if (latestPdfUrl) {
      latestBtn.href = latestPdfUrl;
      latestBtn.textContent = `Open PDF${selected.year ? ' (' + selected.year + ')' : ''} →`;
    } else {
      latestBtn.style.display = 'none';
    }

    /* ---------- Available Papers ---------- */
    const listEl = document.getElementById("availablePapers");
    listEl.innerHTML = "";

    for (const paper of submissions) {
      const li = document.createElement('li');
      li.className = 'paper-row';

      const pdfUrl = paper.file_url || (paper.approved_path
        ? await _getLegacySignedUrl(supabase, paper.approved_path)
        : null);

      if (pdfUrl) {
        li.innerHTML = `
          <span>${paper.year || 'N/A'} Question Paper</span>
          <a href="${pdfUrl}" target="_blank" class="link-red">Open →</a>
        `;
      } else {
        li.innerHTML = `
          <span>${paper.year || 'N/A'} Question Paper</span>
          <span class="text-muted">Unavailable</span>
        `;
      }

      listEl.appendChild(li);
    }

    /* ---------- Syllabus (dynamic from storage) ---------- */
    await loadSyllabus(supabase, subjectCode);

    /* ---------- Repeated Questions (dynamic from storage) ---------- */
    await loadRepeatedQuestions(supabase, subjectCode);

    /* ---------- Notes & Resources (dynamic from storage) ---------- */
    await loadNotesResources(supabase, subjectCode);

  } catch (err) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Error loading paper.</p>";
  }
}

/* ================= SYLLABUS ================= */
/* ---------- Legacy helper: Supabase signed URL for pre-migration rows ---------- */
async function _getLegacySignedUrl(supabase, path) {
  if (!path || !supabase) return null;
  try {
    const { data, error } = await supabase.storage
      .from('uploads-approved')
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

async function loadSyllabus(supabase, subjectCode) {
  const container = document.getElementById('syllabus-container');
  const noSyllabus = document.getElementById('no-syllabus');
  if (!container) return;

  try {
    // Try to load syllabus from data/syllabus/{code}.json
    const res = await fetch(`./data/syllabus/${subjectCode}.json`);
    if (res.ok) {
      const syllabusData = await res.json();
      if (syllabusData && (syllabusData.units || syllabusData.topics || syllabusData.content)) {
        container.innerHTML = renderSyllabusContent(syllabusData);
        if (noSyllabus) noSyllabus.hidden = true;
        return;
      }
    }
  } catch {
    // Not available locally
  }

  // Fallback: syllabus not available
  container.innerHTML = '';
  if (noSyllabus) noSyllabus.hidden = false;
}

function renderSyllabusContent(data) {
  if (data.units && Array.isArray(data.units)) {
    return data.units.map((unit, i) => {
      const safeTitle = unit.title ? escapeHtml(unit.title) : '';
      const topicsHtml = unit.topics
        ? `<ul>${unit.topics.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
        : '';
      return `
      <div class="syllabus-unit">
        <h4>Unit ${i + 1}: ${safeTitle}</h4>
        ${topicsHtml}
      </div>
    `;
    }).join('');
  }
  if (data.content) {
    return `<div class="syllabus-content">${escapeHtml(data.content)}</div>`;
  }
  return '<p class="coming-soon">Syllabus data format not recognized.</p>';
}

/* ================= REPEATED QUESTIONS ================= */
async function loadRepeatedQuestions(supabase, subjectCode) {
  const container = document.getElementById('repeated-container');
  if (!container) return;

  try {
    // Try to load from data/repeated-questions/{code}.json
    const res = await fetch(`./data/repeated-questions/${subjectCode}.json`);
    if (res.ok) {
      const rqData = await res.json();
      if (rqData && Array.isArray(rqData) && rqData.length > 0) {
        container.innerHTML = '';
        rqData.forEach((q, i) => {
          const itemEl = document.createElement('div');
          itemEl.className = 'rq-item';

          const numEl = document.createElement('span');
          numEl.className = 'rq-num';
          numEl.textContent = `${i + 1}.`;
          itemEl.appendChild(numEl);

          const textEl = document.createElement('span');
          textEl.className = 'rq-text';
          const questionText = (q && typeof q === 'object')
            ? (q.question || q.text || '')
            : (q != null ? String(q) : '');
          textEl.textContent = questionText;
          itemEl.appendChild(textEl);

          if (q && typeof q === 'object' && q.frequency) {
            const freqEl = document.createElement('span');
            freqEl.className = 'rq-freq';
            freqEl.textContent = `×${q.frequency}`;
            itemEl.appendChild(freqEl);
          }

          container.appendChild(itemEl);
        });
        return;
      }
    }
  } catch {
    // Not available
  }

  container.innerHTML = '<p class="coming-soon">No repeated questions available yet.</p>';
}

/* ================= NOTES & RESOURCES ================= */
async function loadNotesResources(supabase, subjectCode) {
  const section = document.querySelector('.paper-section:last-of-type');
  if (!section) return;

  const skeletonGroup = section.querySelector('.skeleton-group');
  const comingSoon = section.querySelector('.coming-soon');

  // Notes & Resources are not yet stored in Appwrite.
  // Show coming-soon state (feature planned for a future phase).
  if (skeletonGroup) skeletonGroup.style.display = 'none';
  if (comingSoon) comingSoon.style.display = 'block';
}

/* ---------- Init ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(loadPaper, 300));
} else {
  setTimeout(loadPaper, 300);
}
