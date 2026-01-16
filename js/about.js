document.addEventListener("DOMContentLoaded", async () => {

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

          if (item.importance === "major") {
            entry.classList.add("is-major");
          }

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

      /* Timeline animation */
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

      observer.observe(timeline);
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
    const res = await fetch("./data/about/status.json");
    if (!res.ok) throw new Error("Status data not found");

    const status = await res.json();

    /* Fill totals */
    document.querySelector('[data-stat="papers"]').textContent =
      status.totals.papers;

    document.querySelector('[data-stat="pdfs"]').textContent =
      status.totals.pdfs;

    document.querySelector('[data-stat="subjects"]').textContent =
      status.totals.subjects;

    document.querySelector('[data-stat="content-update"]').textContent =
      status.last_content_update;

    document.querySelector('[data-stat="system-update"]').textContent =
      status.last_system_update;

    /* Build subject breakdown dropdown */
    if (status.breakdown && status.breakdown.items.length) {
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
    console.error(err);
  }

});
