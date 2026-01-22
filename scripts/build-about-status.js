/**
 * build-about-status.js
 *
 * Generates /data/about/status.json
 * from /data/papers.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAPERS_FILE = path.join(ROOT, "data/papers.json");
const OUTPUT_FILE = path.join(ROOT, "data/about/status.json");

function fail(msg) {
  console.error("❌ Status generator error:");
  console.error(msg);
  process.exit(1);
}

const papers = JSON.parse(fs.readFileSync(PAPERS_FILE, "utf8"));

/* ---------- Totals ---------- */
const totals = {
  papers: papers.length,
  pdfs: papers.filter(p => p.pdf).length,
  subjects: new Set(papers.map(p => p.subject)).size
};

/* ---------- Breakdown by programme ---------- */
const byProgramme = {};

papers.forEach(p => {
  const prog = p.programme || "Unknown";
  const subj = p.subject || "Unknown";

  if (!byProgramme[prog]) {
    byProgramme[prog] = { total: 0, subjects: {} };
  }

  byProgramme[prog].total += 1;
  byProgramme[prog].subjects[subj] =
    (byProgramme[prog].subjects[subj] || 0) + 1;
});

/* ---------- Output ---------- */
const output = {
  generated_at: new Date().toISOString(),
  totals,
  breakdown: {
    by_programme: byProgramme
  }
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log("✅ About status generated");
