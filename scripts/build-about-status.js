/**
 * build-about-status.js
 *
 * Generates /data/about/status.json
 * with programme → subject breakdown
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAPERS = path.join(ROOT, "data/papers.json");
const OUTPUT = path.join(ROOT, "data/about/status.json");

function fail(msg) {
  console.error("❌ build-about-status:", msg);
  process.exit(1);
}

if (!fs.existsSync(PAPERS)) fail("papers.json missing");

const papers = JSON.parse(fs.readFileSync(PAPERS, "utf8"));

const totals = {
  papers: papers.length,
  pdfs: papers.filter(p => p.pdf).length,
  subjects: new Set(papers.map(p => p.subject)).size
};

// programme → subject → count
const map = {};

papers.forEach(p => {
  const programme = p.programme || "UNKNOWN";
  const subject = (p.subject || "unknown").toUpperCase();

  if (!map[programme]) map[programme] = {};
  map[programme][subject] = (map[programme][subject] || 0) + 1;
});

// Flatten for UI
const items = [];

Object.entries(map).forEach(([programme, subjects]) => {
  Object.entries(subjects).forEach(([subject, count]) => {
    items.push({
      name: `${programme}:${subject}`,
      count
    });
  });
});

const output = {
  generated_at: new Date().toISOString(),

  totals,

  breakdown: {
    group_by: "programme_subject",
    items
  }
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log("✅ about/status.json generated");
