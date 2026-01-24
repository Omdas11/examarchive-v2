import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const SYLLABUS_ROOT = "data/syllabus";
const OUTPUT_DIR = "assets/pdfs/syllabus";
const TEMPLATE = fs.readFileSync("templates/syllabus.html", "utf8");

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (item.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

function renderObjectives(arr) {
  return `<ul>${arr.map(o => `<li>${o}</li>`).join("")}</ul>`;
}

function renderUnits(units, mode) {
  return units.map(u => `
    <div class="unit">
      <div class="unit-title">
        UNIT ${u.unit_no}: ${u.title}
      </div>
      <div class="hours">(${u.hours} Hours)</div>
      ${
        mode === "list"
          ? `<ul>${u.topics.map(t => `<li class="checkbox">${t}</li>`).join("")}</ul>`
          : `<p>${u.topics.join(", ")}</p>`
      }
    </div>
  `).join("");
}

function renderLearningOutcomes(arr) {
  return `<ul>${arr.map(o => `<li>${o}</li>`).join("")}</ul>`;
}

function renderReferences(refs) {
  const all = [
    ...(refs.textbooks || []),
    ...(refs.additional_reading || []),
    ...(refs.online_resources || [])
  ];

  return `<ol>${all.map(r =>
    `<li>${r.title}${r.author ? " — " + r.author : ""}${r.publisher ? " (" + r.publisher + ")" : ""}</li>`
  ).join("")}</ol>`;
}

async function generateOne(page, data, mode) {
  const html = TEMPLATE
    .replace("{{paper_name}}", data.meta.paper_name)
    .replace("{{programme}}", data.meta.programme)
    .replace("{{semester}}", data.meta.semester)
    .replace("{{credits}}", data.meta.credits)
    .replace("{{university}}", data.meta.university)
    .replace("{{paper_code}}", data.meta.paper_code)
    .replace("{{objectives}}", renderObjectives(data.objectives))
    .replace("{{units}}", renderUnits(data.units, mode))
    .replace("{{learning_outcomes}}", renderLearningOutcomes(data.learning_outcomes))
    .replace("{{references}}", renderReferences(data.references));

  await page.setContent(html, { waitUntil: "networkidle0" });

  const out = path.join(
    OUTPUT_DIR,
    `${data.meta.paper_code}-${mode}.pdf`
  );

  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true
  });

  console.log(`✓ ${data.meta.paper_code}-${mode}.pdf`);
}

(async () => {
  console.log("🚀 Generating syllabus PDFs");

  const files = walk(SYLLABUS_ROOT);
  if (!files.length) {
    console.log("⚠ No syllabus files found");
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    await generateOne(page, data, "paragraph");
    await generateOne(page, data, "list");
  }

  await browser.close();
  console.log("🎉 All PDFs generated");
})();
