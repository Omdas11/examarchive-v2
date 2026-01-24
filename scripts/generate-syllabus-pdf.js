import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const SYLLABUS_DIR = "data/syllabus";
const OUTPUT_DIR = "assets/pdfs/syllabus";
const TEMPLATE_PATH = "templates/syllabus.html";

// ---------------- Helpers ----------------

function renderUnits(units = []) {
  return units
    .map(
      u => `
      <div class="unit">
        <strong>${u.title}</strong>
        <div class="hours">(${u.hours} Hours)</div>
        <p>${(u.topics || []).join(", ")}</p>
      </div>
    `
    )
    .join("");
}

function renderReferences(refs) {
  if (!refs) return "";

  // Case 1: array
  if (Array.isArray(refs)) {
    return refs.map(r => `<li>${r}</li>`).join("");
  }

  // Case 2: object (books, websites, etc.)
  if (typeof refs === "object") {
    return Object.values(refs)
      .flat()
      .map(r => `<li>${r}</li>`)
      .join("");
  }

  // Case 3: single string
  if (typeof refs === "string") {
    return `<li>${refs}</li>`;
  }

  return "";
}

// ---------------- Main ----------------

async function generatePDF(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  const html = template
    .replace("{{TITLE}}", data.paper_name || "")
    .replace("{{CODE}}", data.paper_code || "")
    .replace("{{META}}", `${data.programme || ""} | ${data.semester || ""}`)
    .replace("{{OBJECTIVES}}", data.objectives || "")
    .replace("{{UNITS}}", renderUnits(data.units))
    .replace("{{REFERENCES}}", renderReferences(data.references));

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const outFile = path.join(
    OUTPUT_DIR,
    `${data.paper_code || "syllabus"}.pdf`
  );

  await page.pdf({
    path: outFile,
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "20mm",
      right: "20mm",
    },
  });

  await browser.close();
  console.log("Generated:", outFile);
}

// ---------------- Runner ----------------

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SYLLABUS_DIR)
    .filter(f => f.endsWith(".json"));

  for (const file of files) {
    await generatePDF(path.join(SYLLABUS_DIR, file));
  }
})();
