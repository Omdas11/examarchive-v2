/**
 * build-about-timeline.js
 *
 * Generates /data/about/timeline.json
 * from /data/about/timeline.yaml
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = process.cwd();
const INPUT_FILE = path.join(ROOT, "data/about/timeline.yaml");
const OUTPUT_FILE = path.join(ROOT, "data/about/timeline.json");

function fail(message) {
  console.error("❌ About timeline generator error:");
  console.error(message);
  process.exit(1);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// ---------- Load YAML ----------
if (!fs.existsSync(INPUT_FILE)) {
  fail(`Missing input file: ${INPUT_FILE}`);
}

let raw;
try {
  raw = fs.readFileSync(INPUT_FILE, "utf8");
} catch {
  fail("Unable to read timeline.yaml");
}

let data;
try {
  data = yaml.load(raw);
} catch {
  fail("Invalid YAML format in timeline.yaml");
}

if (!Array.isArray(data) || data.length === 0) {
  fail("timeline.yaml must contain a non-empty list");
}

// ---------- Validate & Normalize ----------
const output = data.map((item, index) => {
  if (!isNonEmptyString(item.title)) {
    fail(`Missing title at entry ${index + 1}`);
  }
  if (!isNonEmptyString(item.date)) {
    fail(`Missing date at entry ${index + 1}`);
  }
  if (!isNonEmptyString(item.description)) {
    fail(`Missing description at entry ${index + 1}`);
  }

  const importance = item.importance || "normal";
  if (!["major", "normal"].includes(importance)) {
    fail(`Invalid importance at entry ${index + 1}`);
  }

  return {
    title: item.title.trim(),
    date: item.date.trim(),
    description: item.description.trim(),
    importance,
    order: index + 1
  };
});

// ---------- Write JSON ----------
try {
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );
} catch {
  fail("Unable to write timeline.json");
}

console.log("✅ About timeline generated successfully.");
