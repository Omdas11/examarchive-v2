document.addEventListener("DOMContentLoaded", async () => {

  /* ================================
     HELPERS
     ================================ */

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

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /* ================================
     PROJECT STATUS
     ================================ */

  const statusSection = document.querySelector(".about-status");
  if (!statusSection) return;

  try {
    const statusRes = await fetch("./data/about/status.json");
    if (!statusRes.ok) throw new Error("Status data not found");

    const status = await statusRes.json();

    document.querySelector('[data-stat="papers"]').textContent =
      status.totals.papers;

    document.querySelector('[data-stat="pdfs"]').textContent =
      status.totals.pdfs;

    document.querySelector('[data-stat="subjects"]').textContent =
      status.totals.subjects;

    /* ---------- Last Content Update ---------- */
    document.querySelector('[data-stat="content-update"]').textContent =
      formatIST(status.generated_at);

    /* ---------- Last System Update (GitHub API) ---------- */
    try {
      const repo = "omdas11/examarchive-v2";
      const apiRes = await fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=1`
      );
      const commits = await apiRes.json();
      const lastCommitDate = commits[0]?.commit?.committer?.date;

      document.querySelector('[data-stat="system-update"]').textContent =
        formatIST(lastCommitDate);
    } catch {
      document.querySelector('[data-stat="system-update"]').textContent = "—";
    }

    /* ================================
       PDFs BREAKDOWN (Single Card)
       ================================ */

    if (status.breakdown?.programmes) {
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-breakdown";

      const header = document.createElement("h3");
      header.textContent = "PDFs Breakdown";
      wrapper.appendChild(header);

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "breakdown-toggle";
      toggleBtn.textContent = "View Breakdown of PDFs";
      wrapper.appendChild(toggleBtn);

      const panel = document.createElement("div");
      panel.className = "breakdown-panel";
      panel.hidden = true;

      Object.entries(status.breakdown.programmes).forEach(([programme, data]) => {
        const section = document.createElement("div");
        section.className = "breakdown-programme";

        section.innerHTML = `
          <h4>${programme} (${data.total})</h4>
        `;

        const list = document.createElement("ul");
        data.subjects.forEach(item => {
          const li = document.createElement("li");
          li.innerHTML = `
            <span>${capitalize(item.name)}</span>
            <span>${item.count}</span>
          `;
          list.appendChild(li);
        });

        section.appendChild(list);
        panel.appendChild(section);
      });

      toggleBtn.onclick = () => {
        panel.hidden = !panel.hidden;
      };

      wrapper.appendChild(panel);
      statusSection.appendChild(wrapper);
    }

  } catch (err) {
    console.error(err);
  }

});
