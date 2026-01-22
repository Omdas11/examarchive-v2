document.addEventListener("DOMContentLoaded", async () => {

  /* ---------- Helpers ---------- */
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

  /* ---------- STATUS ---------- */
  const statusRes = await fetch("./data/about/status.json");
  const status = await statusRes.json();

  document.querySelector('[data-stat="papers"]').textContent = status.totals.papers;
  document.querySelector('[data-stat="pdfs"]').textContent = status.totals.pdfs;
  document.querySelector('[data-stat="subjects"]').textContent = status.totals.subjects;
  document.querySelector('[data-stat="content-update"]').textContent =
    formatIST(status.generated_at);
  document.querySelector('[data-stat="system-update"]').textContent =
    formatIST(status.generated_at);

  /* ---------- PDFs Breakdown ---------- */
  const breakdownEl = document.getElementById("pdfBreakdown");
  const toggleBtn = document.getElementById("toggleBreakdown");

  toggleBtn.onclick = () => {
    breakdownEl.classList.toggle("hidden");
  };

  const byProg = status.breakdown.by_programme;

  Object.entries(byProg).forEach(([programme, data]) => {
    const section = document.createElement("div");
    section.className = "programme-block";

    const header = document.createElement("div");
    header.className = "programme-header";
    header.innerHTML = `
      <span>${programme}</span>
      <span class="count-circle">${data.total}</span>
    `;
    section.appendChild(header);

    const list = document.createElement("ul");
    list.className = "subject-list";

    Object.entries(data.subjects).forEach(([subject, count]) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${subject}</span>
        <span class="count-circle small">${count}</span>
      `;
      list.appendChild(li);
    });

    section.appendChild(list);
    breakdownEl.appendChild(section);
  });

  /* ---------- TIMELINE ---------- */
  const timelineEl = document.querySelector(".timeline");
  const timelineRes = await fetch("./data/about/timeline.json");
  const timeline = await timelineRes.json();

  if (!timeline.length) {
    timelineEl.innerHTML =
      "<p class='section-note'>No milestones added yet.</p>";
    return;
  }

  timeline.reverse().forEach(item => {
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
});
