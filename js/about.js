document.addEventListener("DOMContentLoaded", async () => {

  /* ==================================================
     HELPERS
     ================================================== */
  function formatIST(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }) + " IST";
  }

  /* ==================================================
     PROJECT STATUS
     ================================================== */
  let status;
  try {
    const res = await fetch("./data/about/status.json");
    if (!res.ok) throw new Error("status.json not found");
    status = await res.json();
  } catch {
    return;
  }

  document.querySelector('[data-stat="papers"]').textContent =
    status.totals?.papers ?? "—";

  document.querySelector('[data-stat="pdfs"]').textContent =
    status.totals?.pdfs ?? "—";

  document.querySelector('[data-stat="subjects"]').textContent =
    status.totals?.subjects ?? "—";

  document.querySelector('[data-stat="content-update"]').textContent =
    formatIST(status.generated_at);

  document.querySelector('[data-stat="system-update"]').textContent =
    formatIST(status.generated_at);

  /* ==================================================
     PDFs BREAKDOWN
     ================================================== */
  const breakdownWrapper = document.getElementById("pdfBreakdown");
  const toggleBtn = document.getElementById("toggleBreakdown");

  if (toggleBtn && breakdownWrapper) {
    toggleBtn.classList.add("breakdown-toggle");

    toggleBtn.onclick = () => {
      breakdownWrapper.classList.toggle("hidden");
    };

    const byProgramme = status.breakdown?.by_programme || {};

    Object.entries(byProgramme).forEach(([programme, data]) => {
      const block = document.createElement("div");
      block.className = "programme-block";

      block.innerHTML = `
        <div class="programme-header">
          <span>${programme}</span>
          <span class="count-circle">${data.total}</span>
        </div>
      `;

      const list = document.createElement("ul");
      list.className = "subject-list";

      Object.entries(data.subjects).forEach(([subject, count]) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${subject.toUpperCase()}</span>
          <span class="count-circle small">${count}</span>
        `;
        list.appendChild(li);
      });

      block.appendChild(list);
      breakdownWrapper.appendChild(block);
    });
  }

  /* ==================================================
     PROJECT TIMELINE
     ================================================== */
  const timelineEl = document.querySelector(".timeline");
  if (!timelineEl) return;

  let timeline;
  try {
    const res = await fetch("./data/about/timeline.json");
    if (!res.ok) throw new Error("timeline.json not found");
    timeline = await res.json();
  } catch {
    timelineEl.innerHTML =
      "<p class='section-note'>Timeline unavailable.</p>";
    return;
  }

  if (!Array.isArray(timeline) || timeline.length === 0) {
    timelineEl.innerHTML =
      "<p class='section-note'>No milestones added yet.</p>";
    return;
  }

  timelineEl.innerHTML = "";
  timelineEl.classList.add("is-visible");

  timeline
    .slice()
    .reverse()
    .forEach(item => {
      const div = document.createElement("div");
      div.className = "timeline-item";

      div.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <h4>${item.title}</h4>
          <span class="timeline-date">${item.date}</span>
          <p>${item.description}</p>
        </div>
      `;

      timelineEl.appendChild(div);
      requestAnimationFrame(() => div.classList.add("is-visible"));
    });
});
