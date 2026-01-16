document.addEventListener("DOMContentLoaded", async () => {
  const timelineContainer = document.querySelector(".timeline");

  if (!timelineContainer) return;

  try {
    const res = await fetch("./data/about/timeline.json");
    if (!res.ok) throw new Error("Timeline data not found");

    const milestones = await res.json();

    timelineContainer.innerHTML = "";

    milestones
      .slice()               // copy array
      .reverse()             // newest at top
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

        timelineContainer.appendChild(entry);
      });

  } catch (err) {
    timelineContainer.innerHTML =
      "<p class='muted'>Timeline unavailable.</p>";
    console.error(err);
  }
});
