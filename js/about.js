document.addEventListener("DOMContentLoaded", async () => {

  /* ==================================================
     HELPERS
     ================================================== */
  function formatIST(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;

    return (
      d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
      }) + " IST"
    );
  }

/* ---------- STATUS ---------- */
const statusRes = await fetch("./data/about/status.json");
const status = await statusRes.json();

/* Totals */
document.querySelector('[data-stat="papers"]').textContent =
  status.totals.papers;

document.querySelector('[data-stat="pdfs"]').textContent =
  status.totals.pdfs;

document.querySelector('[data-stat="subjects"]').textContent =
  status.totals.subjects;

/* ---------- Last Content Update ---------- */
/* Uses build-about-status.js timestamp */
document.querySelector('[data-stat="content-update"]').textContent =
  formatIST(status.generated_at);

/* ---------- Last System Update (GitHub) ---------- */
try {
  const repo = "omdas11/examarchive-v2";
  const apiRes = await fetch(
    `https://api.github.com/repos/${repo}/commits?per_page=1`
  );

  if (!apiRes.ok) throw new Error("GitHub API failed");

  const commits = await apiRes.json();
  const lastCommitDate = commits[0]?.commit?.committer?.date;

  document.querySelector('[data-stat="system-update"]').textContent =
    formatIST(lastCommitDate);

} catch (err) {
  document.querySelector('[data-stat="system-update"]').textContent = "—";
}

    /* ==================================================
       PDFs BREAKDOWN (SINGLE ROUNDED BLOCK)
       ================================================== */
    const breakdownRoot = document.getElementById("pdfBreakdown");
    const toggleBtn = document.getElementById("toggleBreakdown");

    if (breakdownRoot && toggleBtn && status.breakdown?.by_programme) {
      toggleBtn.onclick = () => {
        breakdownRoot.classList.toggle("hidden");
      };

      breakdownRoot.innerHTML = "";

      Object.entries(status.breakdown.by_programme).forEach(
        ([programme, data]) => {
          const block = document.createElement("div");
          block.className = "programme-block";

          block.innerHTML = `
            <div class="programme-header">
              <span>${programme}</span>
              <span class="count-circle">${data.total}</span>
            </div>
            <ul class="subject-list">
              ${Object.entries(data.subjects)
                .map(
                  ([subject, count]) => `
                  <li>
                    <span>${subject.toUpperCase()}</span>
                    <span class="count-circle small">${count}</span>
                  </li>
                `
                )
                .join("")}
            </ul>
          `;

          breakdownRoot.appendChild(block);
        }
      );
    }

  } catch (err) {
    console.error("❌ About status error:", err);
  }

  /* ==================================================
     PROJECT TIMELINE (ALWAYS RUN)
     ================================================== */
  try {
    const timelineEl = document.querySelector(".timeline");
    if (!timelineEl) return;

    const res = await fetch("./data/about/timeline.json");
    if (!res.ok) throw new Error("timeline.json not found");

    const timeline = await res.json();

    timelineEl.innerHTML = "";

    if (!Array.isArray(timeline) || !timeline.length) {
      timelineEl.innerHTML =
        "<p class='section-note'>No milestones added yet.</p>";
      return;
    }

    timeline
      .slice()
      .reverse()
      .forEach(item => {
        const entry = document.createElement("div");
        entry.className = "timeline-item";

        entry.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <h4>${item.title}</h4>
            <span class="timeline-date">${item.date}</span>
            <p>${item.description}</p>
          </div>
        `;

        timelineEl.appendChild(entry);
      });

    /* Animate timeline */
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(timelineEl);
    timelineEl
      .querySelectorAll(".timeline-item")
      .forEach(el => observer.observe(el));

  } catch (err) {
    console.error("❌ Timeline render error:", err);
  }
});
