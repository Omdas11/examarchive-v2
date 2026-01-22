document.addEventListener("DOMContentLoaded", async () => {

  /* ==================================================
     HELPERS
     ================================================== */

  function formatIST(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
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

  try {
    const res = await fetch("./data/about/status.json");
    if (!res.ok) throw new Error("status.json not found");

    const status = await res.json();

    document.querySelector('[data-stat="papers"]').textContent =
      status.totals?.papers ?? "—";

    document.querySelector('[data-stat="pdfs"]').textContent =
      status.totals?.pdfs ?? "—";

    document.querySelector('[data-stat="subjects"]').textContent =
      status.totals?.subjects ?? "—";

    // Use status.json timestamps (reliable on GitHub Pages)
    document.querySelector('[data-stat="content-update"]').textContent =
      formatIST(status.generated_at);

    document.querySelector('[data-stat="system-update"]').textContent =
      formatIST(status.generated_at);

    /* ---------- PDFs Breakdown ---------- */
    if (status.breakdown?.by_programme) {
      const section = document.createElement("section");
      section.className = "about-breakdown";

      section.innerHTML = `
        <h2>PDFs Breakdown</h2>
        <button class="breakdown-toggle">View breakdown of PDFs</button>
        <div class="breakdown-box" hidden></div>
      `;

      const box = section.querySelector(".breakdown-box");
      const toggle = section.querySelector(".breakdown-toggle");

      toggle.onclick = () => {
        box.hidden = !box.hidden;
      };

      Object.entries(status.breakdown.by_programme).forEach(([programme, data]) => {
        const block = document.createElement("div");
        block.className = "breakdown-programme";

        block.innerHTML = `<h3>${programme} (${data.total})</h3>`;

        const ul = document.createElement("ul");
        Object.entries(data.subjects).forEach(([subject, count]) => {
          const li = document.createElement("li");
          li.textContent = `${subject} — ${count}`;
          ul.appendChild(li);
        });

        block.appendChild(ul);
        box.appendChild(block);
      });

      document.querySelector(".about-status").appendChild(section);
    }

  } catch (err) {
    console.error("Status load failed:", err);
  }

  /* ==================================================
     PROJECT TIMELINE (ALWAYS RENDER)
     ================================================== */

  const timelineEl = document.querySelector(".timeline");

  try {
    const res = await fetch("./data/about/timeline.json");
    if (!res.ok) throw new Error("timeline.json not found");

    const items = await res.json();
    timelineEl.innerHTML = "";

    items.forEach(item => {
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
    });

  } catch (err) {
    timelineEl.innerHTML =
      "<p class='section-note'>Timeline unavailable.</p>";
    console.error("Timeline load failed:", err);
  }

});
