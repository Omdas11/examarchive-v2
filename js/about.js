document.addEventListener("DOMContentLoaded", async () => {

  /* ==================================================
     HELPERS
     ================================================== */
  function formatIST(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;

    return (
      d.toLocaleString("en-IN", {
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
     LIVE STATS FROM DATABASE
     ================================================== */
  async function loadLiveStats() {
    try {
      if (!window.waitForSupabase) return;
      const supabase = await window.waitForSupabase();
      if (!supabase) return;

      // Count published papers
      const { count: publishedCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Count distinct contributors
      const { data: contributors } = await supabase
        .from('submissions')
        .select('user_id');
      const uniqueContributors = new Set((contributors || []).map(c => c.user_id)).size;

      // Count total requests
      const { count: totalRequests } = await supabase
        .from('paper_requests')
        .select('*', { count: 'exact', head: true });

      // Total uploads
      const { count: totalUploads } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      // Update DOM
      const publishedEl = document.querySelector('[data-stat="published"]');
      const contributorsEl = document.querySelector('[data-stat="contributors"]');
      const totalRequestsEl = document.querySelector('[data-stat="total-requests"]');
      const totalUploadsEl = document.querySelector('[data-stat="total-uploads"]');

      if (publishedEl) publishedEl.textContent = publishedCount ?? '0';
      if (contributorsEl) contributorsEl.textContent = uniqueContributors || '0';
      if (totalRequestsEl) totalRequestsEl.textContent = totalRequests ?? '0';
      if (totalUploadsEl) totalUploadsEl.textContent = totalUploads ?? '0';
    } catch (err) {
      // Silently handle stats loading errors
    }
  }

  // Load live stats
  loadLiveStats();

  /* ==================================================
     RATE-LIMIT SAFE SYSTEM UPDATE (GitHub)
     ================================================== */
  const COMMIT_CACHE_KEY = "examarchive:lastCommit";
  const COMMIT_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

  async function getLastSystemUpdate() {
    try {
      const cached = JSON.parse(localStorage.getItem(COMMIT_CACHE_KEY));
      if (cached && Date.now() - cached.time < COMMIT_CACHE_TTL) {
        return cached.date;
      }

      const repo = "omdas11/examarchive-v2";
      const res = await fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=1`
      );

      if (!res.ok) throw new Error("GitHub rate limit");

      const data = await res.json();
      const date = data[0]?.commit?.committer?.date;

      if (date) {
        localStorage.setItem(
          COMMIT_CACHE_KEY,
          JSON.stringify({ date, time: Date.now() })
        );
      }

      return date || null;

    } catch {
      return null;
    }
  }

  /* ==================================================
     PROJECT STATUS (backend-driven)
     ================================================== */
  try {
    /* System update = cached GitHub commit */
    const lastCommit = await getLastSystemUpdate();
    const systemUpdateEl = document.querySelector('[data-stat="system-update"]');
    if (systemUpdateEl) {
      systemUpdateEl.textContent = lastCommit ? formatIST(lastCommit) : "—";
    }

    /* Content update from status.json if available */
    try {
      const statusRes = await fetch("./data/about/status.json");
      if (statusRes.ok) {
        const status = await statusRes.json();

        const papersEl = document.querySelector('[data-stat="papers"]');
        const pdfsEl = document.querySelector('[data-stat="pdfs"]');
        const subjectsEl = document.querySelector('[data-stat="subjects"]');
        const contentUpdateEl = document.querySelector('[data-stat="content-update"]');

        if (papersEl) papersEl.textContent = status.totals?.papers ?? "—";
        if (pdfsEl) pdfsEl.textContent = status.totals?.pdfs ?? "—";
        if (subjectsEl) subjectsEl.textContent = status.totals?.subjects ?? "—";
        if (contentUpdateEl) contentUpdateEl.textContent = formatIST(status.generated_at);
      }
    } catch (e) {
      // status.json is optional - backend stats are primary
    }

  } catch (err) {
    console.error("❌ About status error:", err);
  }

  /* ==================================================
     PROJECT TIMELINE (ALWAYS RUN)
     ================================================== */
  try {
    const timelineEl = document.querySelector(".timeline");
    if (!timelineEl) return;

    const res = await fetch("./data/about/timeline.json");
    if (!res.ok) throw new Error("timeline.json missing");

    const timeline = await res.json();
    timelineEl.innerHTML = "";

    if (!Array.isArray(timeline) || !timeline.length) {
      timelineEl.innerHTML =
        "<p class='section-note'>No milestones added yet.</p>";
      return;
    }

    timeline
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

    /* Reveal animation */
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(timelineEl);
    timelineEl
      .querySelectorAll(".timeline-item")
      .forEach(el => observer.observe(el));

  } catch (err) {
    console.error("❌ Timeline render error:", err);
  }
});
