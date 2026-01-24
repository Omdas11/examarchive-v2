const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

module.exports = async function handler(req, res) {
  try {
    // 1️⃣ Load HTML template
    const templatePath = path.join(
      process.cwd(),
      "templates/pdf/syllabus.html"
    );

    const htmlTemplate = fs.readFileSync(templatePath, "utf-8");

    // 2️⃣ Inject TEMP test data
    const html = htmlTemplate
      .replace(/{{PAPER_TITLE}}/g, "MATHEMATICAL PHYSICS – I")
      .replace(/{{PAPER_CODE}}/g, "PHYDSC101T")
      .replace(/{{PROGRAMME}}/g, "FYUG")
      .replace(/{{SEMESTER}}/g, "I")
      .replace(/{{CREDITS}}/g, "3")
      .replace(/{{UNIVERSITY}}/g, "ASSAM UNIVERSITY")
      .replace(
        /{{OBJECTIVES}}/g,
        "The objective of this course is to equip students with the mathematical tools required for advanced study in physics."
      )
      .replace(
        /{{UNITS}}/g,
        `
        <div class="pdf-unit">
          <h3>UNIT I: VECTOR ALGEBRA</h3>
          <p class="pdf-hours">(12 Hours)</p>
          <p>Scalar and vector quantities, dot and cross products.</p>
        </div>
        `
      )
      .replace(
        /{{REFERENCES}}/g,
        `<li>H.K. Dass – Mathematical Physics</li>`
      )
      .replace(/{{TIMESTAMP}}/g, new Date().toLocaleString("en-IN", { hour12: false }))
      .replace(/{{PAGE}}/g, "1");

    // 3️⃣ Launch Chromium
    const executablePath =
      (await chromium.executablePath()) || "/usr/bin/chromium";

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 4️⃣ Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // 5️⃣ Send response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=syllabus.pdf");
    res.status(200).send(pdf);
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({
      error: "PDF generation failed",
      message: err.message,
    });
  }
};
