/**
 * build-about-status.js
 *
 * Generates /data/about/status.json
 * from /data/papers.json
 *
 * Structure:
 * - totals
 * - breakdown by programme → subject
 * - generated_at timestamp (authoritative content update time)
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAPERS_FILE = path.join(ROOT, "data/papers.json");
const OUTPUT_FILE = path.join(ROOT, "data/about/status.json");

function fail(msg) {
  console.error("❌ About status generator error:");
  console.error(msg);
  process.exit(1);
}

/* ---------------- Load papers.json ---------------- */

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

/* ---------------- Compute totals ---------------- */

const totalPapers = papers.length;
const totalPDFs = papers.filter(p => typeof p.pdf === "string").length;

/* ---------------- Programme → Subject breakdown ---------------- */

const programmeMap = {};

papers.forEach(paper => {
  const programme = paper.programme || "UNKNOWN";
  const subject = paper.subject || "unknown";

  if (!programmeMap[programme]) {
    programmeMap[programme] = {
      total: 0,
      subjects: {}
    };
  }

  programmeMap[programme].total += 1;

  programmeMap[programme].subjects[subject] =
    (programmeMap[programme].subjects[subject] || 0) + 1;
});

/* Normalize breakdown structure */
const programmes = {};

Object.keys(programmeMap).forEach(programme => {
  const subjects = Object.keys(programmeMap[programme].subjects)
    .sort()
    .map(name => ({
      name,
      count: programmeMap[programme].subjects[name]
    }));

  programmes[programme] = {
    total: programmeMap[programme].total,
    subjects
  };
});

/* ---------------- Build output ---------------- */

const output = {
  generated_at: new Date().toISOString(),

  totals: {
    papers: totalPapers,
    pdfs: totalPDFs,
    subjects: new Set(papers.map(p => p.subject)).size
  },

  breakdown: {
    programmes
  }
};

/* ---------------- Write status.json ---------------- */

try {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );
} catch {
  fail("Unable to write status.json");
}

console.log("✅ About status generated successfully.");
