// scripts/generate-syllabus-pdf.js

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const ROOT = process.cwd();
const SYLLABUS_DIR = path.join(ROOT, "data", "syllabus");
const OUTPUT_DIR = path.join(ROOT, "assets", "pdfs", "syllabus");
const TEMPLATE_PATH = path.join(ROOT, "templates", "syllabus.html");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const TEMPLATE = fs.readFileSync(TEMPLATE_PATH, "utf8");

// ---------------- Helpers ----------------

function findJsonFiles(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      res.push(...findJsonFiles(full));
    } else if (f.endsWith(".json")) {
      res.push(full);
    }
  }
  return res;
}

function renderList(items = []) {
  return items.map(i => `<li>${i}</li>`).join("\n");
}

function renderUnits(units = [], mode) {
  return units.map(u => {
    const content =
      mode === "list"
        ? `<ul>${u.topics.map(t => `<li>☐ ${t}</li>`).join("")}</ul>`
        : `<p>${u.topics.join(", ")}</p>`;

    return `
      <div class="unit">
        <h3>Unit ${u.unit_no}: ${u.title} (${u.hours} Hours)</h3>
        ${content}
      </div>
    `;
  }).join("\n");
}

function renderReferences(refs = {}) {
  const all = [
    ...(refs.textbooks || []),
    ...(refs.additional_reading || []),
    ...(refs.online_resources || [])
  ];

  return all
    .map(r => `<li>${r.title}${r.author ? " – " + r.author : ""}</li>`)
    .join("\n");
}

// ---------------- Main ----------------

(async () => {
  console.log("🚀 Generating syllabus PDFs");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const files = findJsonFiles(SYLLABUS_DIR);

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const code = data.meta.paper_code;

    for (const mode of ["paragraph", "list"]) {
      const html = TEMPLATE
        .replace(/{{paper_name}}/g, data.meta.paper_name)
        .replace(/{{paper_code}}/g, data.meta.paper_code)
        .replace(/{{programme}}/g, data.meta.programme)
        .replace(/{{semester}}/g, data.meta.semester)
        .replace(/{{credits}}/g, data.meta.credits)
        .replace(/{{university}}/g, data.meta.university)
        .replace(/{{objectives}}/g, renderList(data.objectives || []))
        .replace(/{{units}}/g, renderUnits(data.units || [], mode))
        .replace(/{{learning_outcomes}}/g, renderList(data.learning_outcomes || []))
        .replace(/{{references}}/g, renderReferences(data.references || {}));

      await page.setContent(html, { waitUntil: "load" });

      const out = path.join(OUTPUT_DIR, `${code}-${mode}.pdf`);
      await page.pdf({
        path: out,
        format: "A4",
        margin: { top: "40px", bottom: "60px", left: "40px", right: "40px" },
      });

      console.log("✓", path.basename(out));
    }
  }

  await browser.close();
  console.log("🎉 Done");
})();
