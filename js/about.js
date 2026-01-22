/**
 * ExamArchive v2 — About Page Script
 * FINAL STABLE VERSION
 * Aligned with /data/about/* JSON files
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

  const timeline = document.querySelector(".timeline");

  if (timeline) {
    try {
      const res = await fetch("./data/about/timeline.json");
      if (!res.ok) throw new Error("Timeline data not found");

      const milestones = await res.json();
      timeline.innerHTML = "";

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

          timeline.appendChild(entry);
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

      document
        .querySelectorAll(".timeline-item")
        .forEach(item => observer.observe(item));

    } catch (err) {
      timeline.innerHTML =
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
    /* ---------- Load status.json ---------- */
    const statusRes = await fetch("./data/about/status.json");
    if (!statusRes.ok) throw new Error("Status data not found");

    const status = await statusRes.json();

    /* ---------- Totals ---------- */
    document.querySelector('[data-stat="papers"]').textContent =
      status.totals?.papers ?? "—";

    document.querySelector('[data-stat="pdfs"]').textContent =
      status.totals?.pdfs ?? "—";

    document.querySelector('[data-stat="subjects"]').textContent =
      status.totals?.subjects ?? "—";

    /* ---------- Last Content Update ---------- */
    try {
      const contentRes = await fetch("./data/about/content-meta.json");
      if (!contentRes.ok) throw new Error("Content meta not found");

      const contentMeta = await contentRes.json();

      document.querySelector('[data-stat="content-update"]').textContent =
        formatIST(contentMeta.last_content_update);

    } catch {
      document.querySelector('[data-stat="content-update"]').textContent = "—";
    }

    /* ---------- Last System Update (GitHub API) ---------- */
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

    /* ---------- Subject-wise breakdown ---------- */
    if (status.breakdown && Array.isArray(status.breakdown.items)) {
      const breakdownContainer = document.createElement("details");
      breakdownContainer.className = "status-breakdown";

      const summary = document.createElement("summary");
      summary.textContent = "View subject-wise breakdown";
      breakdownContainer.appendChild(summary);

      const list = document.createElement("ul");
      list.className = "status-breakdown-list";

      status.breakdown.items.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${item.name}</span>
          <span>${item.count}</span>
        `;
        list.appendChild(li);
      });

      breakdownContainer.appendChild(list);
      statusSection.appendChild(breakdownContainer);
    }

  } catch (err) {
    console.error("About status error:", err);
  }

});
