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

/* ---------- Compute stats ---------- */

const totalPapers = papers.length;
const totalPDFs = papers.filter(p => p.pdf).length;

const subjectMap = {};
let latestYear = null;

papers.forEach(paper => {
  const subject = paper.subject || "Unknown";

  subjectMap[subject] = (subjectMap[subject] || 0) + 1;

  if (paper.year) {
    if (!latestYear || paper.year > latestYear) {
      latestYear = paper.year;
    }
  }
});

/* Convert subject map to sorted list */
const subjects = Object.keys(subjectMap)
  .sort()
  .map(name => ({
    name,
    count: subjectMap[name]
  }));

/* ---------- Build output ---------- */

const output = {
  generated_at: new Date().toISOString(),

  totals: {
    papers: totalPapers,
    pdfs: totalPDFs,
    subjects: subjects.length
  },

  breakdown: {
    group_by: "subject",
    items: subjects
  },

  last_content_update: latestYear
    ? `Papers up to ${latestYear}`
    : "—",

  last_system_update: new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
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
