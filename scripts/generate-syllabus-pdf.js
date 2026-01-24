import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const SYLLABUS_ROOT = "data/syllabus";
const OUTPUT_ROOT = "assets/pdfs/syllabus";

// ----------------------------------
// Recursively collect all JSON files
// ----------------------------------
function collectJsonFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(collectJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }

  return results;
}

// ----------------------------------
// Main
// ----------------------------------
(async () => {
  console.log("🚀 Starting syllabus PDF generator");

  const files = collectJsonFiles(SYLLABUS_ROOT);

  if (files.length === 0) {
    console.warn("⚠️ No syllabus JSON files found");
    return;
  }

  console.log(`📚 Found ${files.length} syllabus files`);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));

    const code = data?.meta?.code || path.basename(file, ".json");
    const outDir = path.join(OUTPUT_ROOT);
    const outFile = path.join(outDir, `${code}.pdf`);

    fs.mkdirSync(outDir, { recursive: true });

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #b00020; }
            .unit { margin-bottom: 12px; }
            .hours { color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>${data.meta.title}</h1>
          <p><strong>Code:</strong> ${data.meta.code}</p>
          <p><strong>University:</strong> ${data.meta.university}</p>
          <p><strong>Programme:</strong> ${data.meta.programme}</p>

          <h2>Objectives</h2>
          <p>${data.objectives || ""}</p>

          <h2>Units</h2>
          ${
            (data.units || []).map(u => `
              <div class="unit">
                <strong>${u.title}</strong>
                <div class="hours">(${u.hours} Hours)</div>
                <p>${(u.topics || []).join(", ")}</p>
              </div>
            `).join("")
          }

          <h2>References</h2>
          <ul>
            ${
              Array.isArray(data.references)
                ? data.references.map(r => `<li>${r}</li>`).join("")
                : ""
            }
          </ul>
        </body>
      </html>
    `;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: outFile, format: "A4" });

    console.log(`✅ Generated ${outFile}`);
    await page.close();
  }

  await browser.close();
  console.log("🎉 All PDFs generated");
})();
