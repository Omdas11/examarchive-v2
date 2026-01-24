import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const ROOT = process.cwd();
const SYLLABUS_DIR = path.join(ROOT, "data/syllabus");
const OUTPUT_DIR = path.join(ROOT, "assets/pdfs/syllabus");
const TEMPLATE = fs.readFileSync("templates/syllabus.html", "utf8");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// -------- helpers --------
function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) files = files.concat(walk(p));
    else if (p.endsWith(".json")) files.push(p);
  }
  return files;
}

function renderUnits(units, mode) {
  return units.map(u => `
    <div class="unit">
      <div class="unit-title">
        ${u.title}
        <span class="hours">(${u.hours} Hours)</span>
      </div>
      ${
        mode === "list"
          ? `<ul class="checklist">${(u.topics || []).map(t => `<li>${t}</li>`).join("")}</ul>`
          : `<div class="paragraph">${(u.topics || []).join(", ")}</div>`
      }
    </div>
  `).join("");
}

function renderObjectives(obj) {
  if (!obj) return "";
  return `<h2>Objectives</h2><div class="paragraph">${obj}</div>`;
}

function renderReferences(refs) {
  if (!refs || refs.length === 0) return "";
  return `
    <h2>References</h2>
    <ol class="references">
      ${refs.map(r => `<li>${r}</li>`).join("")}
    </ol>
  `;
}

async function generateForMode(page, data, mode) {
  const html = TEMPLATE
    .replace("{{TITLE}}", data.meta.title)
    .replace("{{CODE}}", data.meta.code)
    .replace("{{UNIVERSITY}}", data.meta.university)
    .replace("{{PROGRAMME}}", data.meta.programme)
    .replace("{{SEMESTER}}", data.meta.semester)
    .replace("{{CREDITS}}", data.meta.credits)
    .replace("{{OBJECTIVES}}", renderObjectives(data.objectives))
    .replace("{{UNITS}}", renderUnits(data.units, mode))
    .replace("{{REFERENCES}}", renderReferences(data.references));

  await page.setContent(html, { waitUntil: "networkidle0" });

  const out = path.join(
    OUTPUT_DIR,
    `${data.meta.code}-${mode}.pdf`
  );

  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true
  });

  console.log(`✓ ${data.meta.code}-${mode}.pdf`);
}

// -------- main --------
(async () => {
  console.log("🚀 Generating dual syllabus PDFs");

  const files = walk(SYLLABUS_DIR);
  if (!files.length) {
    console.warn("⚠️ No syllabus JSON files found");
    return;
  }

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    await generateForMode(page, data, "paragraph");
    await generateForMode(page, data, "list");
  }

  await browser.close();
  console.log("🎉 Dual PDFs generated");
})();
