/**
 * build-about-status.js
 *
 * Generates /data/about/status.json
 * from /data/papers.json
 * Programme → Subject expandable breakdown
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

/* ---------- Load papers.json ---------- */
if (!fs.existsSync(PAPERS_FILE)) {
  fail("Missing data/papers.json");
}

let papers;
try {
  papers = JSON.parse(fs.readFileSync(PAPERS_FILE, "utf8"));
} catch {
  fail("Invalid JSON in papers.json");
}

if (!Array.isArray(papers)) {
  fail("papers.json must be an array");
}

/* ---------- Helpers ---------- */
const titleCase = str =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

/* ---------- Compute stats ---------- */

const totalPapers = papers.length;
const totalPDFs = papers.filter(p => p.pdf).length;

let latestPaperDate = null;

/*
  Structure:
  {
    CBCS: { total: 0, subjects: { Physics: 10, Commerce: 1 } },
    FYUG: { total: 0, subjects: { Physics: 3 } }
  }
*/
const programmeMap = {};

papers.forEach(paper => {
  const programme = paper.programme || "UNKNOWN";
  const subject = titleCase(paper.subject || "Unknown");

  if (!programmeMap[programme]) {
    programmeMap[programme] = {
      total: 0,
      subjects: {}
    };
  }

  programmeMap[programme].total += 1;
  programmeMap[programme].subjects[subject] =
    (programmeMap[programme].subjects[subject] || 0) + 1;

  if (paper.year) {
    const date = new Date(`${paper.year}-01-01`);
    if (!latestPaperDate || date > latestPaperDate) {
      latestPaperDate = date;
    }
  }
});

/* ---------- Convert to UI-friendly structure ---------- */

const breakdownItems = Object.keys(programmeMap)
  .sort()
  .map(programme => ({
    programme,
    count: programmeMap[programme].total,
    subjects: Object.keys(programmeMap[programme].subjects)
      .sort()
      .map(name => ({
        name,
        count: programmeMap[programme].subjects[name]
      }))
  }));

/* ---------- Build output ---------- */

const output = {
  generated_at: new Date().toISOString(),

  totals: {
    papers: totalPapers,
    pdfs: totalPDFs,
    subjects: new Set(
      papers.map(p => p.subject || "Unknown")
    ).size
  },

  breakdown: {
    group_by: "programme → subject",
    items: breakdownItems
  },

  last_content_update: latestPaperDate
    ? latestPaperDate.toISOString()
    : null
};

/* ---------- Write status.json ---------- */
try {
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );
} catch {
  fail("Unable to write status.json");
}

console.log("✅ About status generated successfully.");
