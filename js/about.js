/**
 * ExamArchive v2 — About Page Logic
 * FINAL STABLE VERSION
 *
 * Data sources:
 *  - /data/about/timeline.json   (generated from YAML)
 *  - /data/about/status.json     (generated from papers.json)
 *  - GitHub API (last system update)
 */

document.addEventListener("DOMContentLoaded", async () => {

  /* ==================================================
     HELPERS
     ================================================== */

  function formatIST(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);

    return (
      date.toLocaleString("en-IN", {
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

  /* ==================================================
     PROJECT TIMELINE
     ================================================== */

  const timelineEl = document.querySelector(".timeline");

  if (timelineEl) {
    try {
      const res = await fetch("./data/about/timeline.json");
      if (!res.ok) throw new Error("Timeline data not found");

      const milestones = await res.json();
      timelineEl.innerHTML = "";

      milestones
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

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(timelineEl);
      document
        .querySelectorAll(".timeline-item")
        .forEach(item => observer.observe(item));

    } catch (err) {
      timelineEl.innerHTML =
        "<p class='section-note'>Timeline unavailable.</p>";
      console.error(err);
    }
  }

  /* ==================================================
     PROJECT STATUS
     ================================================== */

  const statusSection = document.querySelector(".about-status");
  if (!statusSection) return;

  try {
    const res = await fetch("./data/about/status.json");
    if (!res.ok) throw new Error("Status data not found");

    const status = await res.json();

    /* ---------- Totals ---------- */

    document.querySelector('[data-stat="papers"]').textContent =
      status.totals?.papers ?? "—";

    document.querySelector('[data-stat="pdfs"]').textContent =
      status.totals?.pdfs ?? "—";

    document.querySelector('[data-stat="subjects"]').textContent =
      status.totals?.subjects ?? "—";

    /* ---------- Last Content Update ---------- */

    document.querySelector('[data-stat="content-update"]').textContent =
      formatIST(status.last_content_update);

    /* ---------- Last System Update (GitHub) ---------- */

    try {
      const repo = "omdas11/examarchive-v2";
      const apiRes = await fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=1`
      );

      if (!apiRes.ok) throw new Error("GitHub API error");

      const commits = await apiRes.json();
      const lastCommitDate = commits[0]?.commit?.committer?.date;

      document.querySelector('[data-stat="system-update"]').textContent =
        formatIST(lastCommitDate);

    } catch {
      document.querySelector('[data-stat="system-update"]').textContent = "—";
    }

    /* ---------- Programme → Subject Breakdown ---------- */

    if (status.breakdown?.items?.length) {
      const container = document.createElement("div");
      container.className = "status-breakdowns";

      status.breakdown.items.forEach(programme => {
        const details = document.createElement("details");
        details.className = "status-breakdown";

        const summary = document.createElement("summary");
        summary.textContent = `${programme.programme} (${programme.count})`;
        details.appendChild(summary);

        const list = document.createElement("ul");
        list.className = "status-breakdown-list";

        programme.subjects.forEach(sub => {
          const li = document.createElement("li");
          li.innerHTML = `
            <span>${sub.name}</span>
            <span>${sub.count}</span>
          `;
          list.appendChild(li);
        });

        details.appendChild(list);
        container.appendChild(details);
      });

      statusSection.appendChild(container);
    }

  } catch (err) {
    console.error("About status error:", err);
  }

});
