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
     PROJECT STATUS + BREAKDOWN
     ================================================== */
  try {
    const res = await fetch("./data/about/status.json");
    if (!res.ok) throw new Error("status.json not found");

    const status = await res.json();

    // ---- totals ----
    document.querySelector('[data-stat="papers"]').textContent =
      status.totals?.papers ?? "—";

    document.querySelector('[data-stat="pdfs"]').textContent =
      status.totals?.pdfs ?? "—";

    document.querySelector('[data-stat="subjects"]').textContent =
      status.totals?.subjects ?? "—";

    document.querySelector('[data-stat="content-update"]').textContent =
      status.generated_at ? formatIST(status.generated_at) : "—";

  } catch (err) {
    console.error("Status load failed:", err);
  }

  /* ==================================================
     PDFs BREAKDOWN (SINGLE RENDER)
     ================================================== */
  try {
    const res = await fetch("./data/about/status.json");
    if (!res.ok) throw new Error("status.json not found");

    const status = await res.json();
    const container = document.getElementById("breakdown-content");
    if (!container) return;

    container.innerHTML = "";

    const byProgramme = {};

    status.breakdown.items.forEach(item => {
      const [programme, subject] = item.name.split(":");
      if (!byProgramme[programme]) byProgramme[programme] = { total: 0, subjects: [] };
      byProgramme[programme].total += item.count;
      byProgramme[programme].subjects.push({
        name: subject,
        count: item.count
      });
    });

    Object.entries(byProgramme).forEach(([programme, data]) => {
      const block = document.createElement("div");
      block.className = "breakdown-programme";

      block.innerHTML = `
        <h4>${programme} (${data.total})</h4>
        <ul>
          ${data.subjects
            .map(s => `<li><span>${s.name}</span><span>${s.count}</span></li>`)
            .join("")}
        </ul>
      `;

      container.appendChild(block);
    });

  } catch (err) {
    console.error("Breakdown load failed:", err);
  }

  /* ==================================================
     PROJECT TIMELINE
     ================================================== */
  try {
    const timelineEl = document.querySelector(".timeline");
    if (!timelineEl) return;

    const res = await fetch("./data/about/timeline.json");
    if (!res.ok) throw new Error("timeline.json not found");

    const items = await res.json();
    timelineEl.innerHTML = "";

    items
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

  } catch (err) {
    console.error("Timeline load failed:", err);
  }

});
