/**
 * ExamArchive v2 — Syllabus PDF Generator
 * FINAL GitHub Actions compatible version
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const ROOT = process.cwd();

const SYLLABUS_DIR = path.join(ROOT, "data", "syllabus");
const TEMPLATE_PATH = path.join(ROOT, "templates", "syllabus.html");
const OUTPUT_DIR = path.join(ROOT, "assets", "pdfs", "syllabus");

// Ensure output dir
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Load template
const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

// ---------- Helpers ----------
function renderUnits(units = []) {
  return units
    .map(
      (u) => `
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

  if (Array.isArray(refs)) {
    return refs.map((r) => `<li>${r}</li>`).join("");
  }

  if (typeof refs === "object") {
    return Object.values(refs)
      .flat()
      .map((r) => `<li>${r}</li>`)
      .join("");
  }

  if (typeof refs === "string") {
    return `<li>${refs}</li>`;
  }

  return "";
}

// ---------- Main ----------
(async () => {
  console.log("🚀 Starting syllabus PDF generator");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome", // ⭐ THIS IS THE FIX
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const files = fs.readdirSync(SYLLABUS_DIR).filter(f => f.endsWith(".json"));

  if (!files.length) {
    console.log("⚠️ No syllabus JSON files found");
    await browser.close();
    return;
  }

  for (const file of files) {
    const data = JSON.parse(
      fs.readFileSync(path.join(SYLLABUS_DIR, file), "utf8")
    );

    const html = template
      .replace("{{TITLE}}", data.meta?.title || "")
      .replace("{{CODE}}", data.meta?.code || "")
      .replace(
        "{{META}}",
        `${data.meta?.programme || ""} | Semester ${data.meta?.semester || ""} | Credits: ${data.meta?.credits || ""}<br>${data.meta?.university || ""}`
      )
      .replace("{{OBJECTIVES}}", data.objectives || "")
      .replace("{{UNITS}}", renderUnits(data.units))
      .replace("{{REFERENCES}}", renderReferences(data.references));

    await page.setContent(html, { waitUntil: "networkidle0" });

    const outPath = path.join(
      OUTPUT_DIR,
      `${data.meta?.code || file.replace(".json", "")}.pdf`
    );

    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
    });

    console.log("📄 Generated:", outPath);
  }

  await browser.close();
  console.log("✅ All PDFs generated");
})();
