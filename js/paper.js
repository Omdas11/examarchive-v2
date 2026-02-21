/**
 * ExamArchive v2 — Paper Page
 * Phase 3: Backend-driven paper loading
 * Loads paper from submissions table via paper code or ID
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
      // Load single paper by ID
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
      // Load papers by paper_code
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

    /* ---------- Latest PDF (signed URL) ---------- */
    const latestBtn = document.getElementById("latestPdfLink");
    if (selected.approved_path) {
      try {
        const { data: signedData, error: signErr } = await supabase.storage
          .from('uploads-approved')
          .createSignedUrl(selected.approved_path, 3600);

        if (!signErr && signedData?.signedUrl) {
          latestBtn.href = signedData.signedUrl;
          latestBtn.textContent = `Open PDF${selected.year ? ' (' + selected.year + ')' : ''} →`;
        } else {
          latestBtn.style.display = 'none';
        }
      } catch {
        latestBtn.style.display = 'none';
      }
    } else {
      latestBtn.style.display = 'none';
    }

    /* ---------- Available Papers ---------- */
    const listEl = document.getElementById("availablePapers");
    listEl.innerHTML = "";

    for (const paper of submissions) {
      const li = document.createElement('li');
      li.className = 'paper-row';

      if (paper.approved_path) {
        try {
          const { data: sData } = await supabase.storage
            .from('uploads-approved')
            .createSignedUrl(paper.approved_path, 3600);

          li.innerHTML = `
            <span>${paper.year || 'N/A'} Question Paper</span>
            <a href="${sData?.signedUrl || '#'}" target="_blank" class="link-red">Open →</a>
          `;
        } catch {
          li.innerHTML = `
            <span>${paper.year || 'N/A'} Question Paper</span>
            <span class="text-muted">Unavailable</span>
          `;
        }
      } else {
        li.innerHTML = `
          <span>${paper.year || 'N/A'} Question Paper</span>
          <span class="text-muted">Unavailable</span>
        `;
      }

      listEl.appendChild(li);
    }

    /* ---------- Hide syllabus/RQ/notes sections (backend not available) ---------- */
    const sections = document.querySelectorAll('.paper-section');
    sections.forEach(section => {
      const h2 = section.querySelector('h2');
      if (h2) {
        const text = h2.textContent.toLowerCase();
        if (text.includes('syllabus') || text.includes('repeated') || text.includes('notes')) {
          const content = section.querySelector('.coming-soon, .skeleton-group, #syllabus-container, #repeated-container');
          if (content) {
            section.querySelector('.coming-soon')?.removeAttribute('hidden');
            if (section.querySelector('#syllabus-container')) {
              section.querySelector('#syllabus-container').innerHTML = '';
              const noSyllabus = document.getElementById('no-syllabus');
              if (noSyllabus) noSyllabus.hidden = false;
            }
            if (section.querySelector('#repeated-container')) {
              section.querySelector('#repeated-container').innerHTML =
                '<p class="coming-soon">Repeated questions will be available soon.</p>';
            }
          }
        }
      }
    });

  } catch (err) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Error loading paper.</p>";
  }
}

/* ---------- Init ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(loadPaper, 300));
} else {
  setTimeout(loadPaper, 300);
}
