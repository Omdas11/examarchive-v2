document.addEventListener("DOMContentLoaded", async () => {
  const timeline = document.querySelector(".timeline");
  if (!timeline) return;

  /* ---------------------------------
     Load timeline data
  --------------------------------- */
  try {
    const res = await fetch("./data/about/timeline.json");
    if (!res.ok) throw new Error("Timeline data not found");

    const milestones = await res.json();
    timeline.innerHTML = "";

    // Newest at top
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

  } catch (err) {
    timeline.innerHTML =
      "<p class='section-note'>Timeline unavailable.</p>";
    console.error(err);
    return;
  }

  /* ---------------------------------
     Scroll-based animation
  --------------------------------- */

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    {
      threshold: 0.2
    }
  );

  // Animate timeline line
  observer.observe(timeline);

  // Animate each timeline item
  document
    .querySelectorAll(".timeline-item")
    .forEach(item => observer.observe(item));
});
