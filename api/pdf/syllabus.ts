import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // 1️⃣ Load HTML template
    const templatePath = path.join(
      process.cwd(),
      "templates/pdf/syllabus.html"
    );
    let html = fs.readFileSync(templatePath, "utf-8");

    // 2️⃣ TEMP data (safe hardcoded test)
    html = html
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

        <div class="pdf-unit">
          <h3>UNIT II: DIFFERENTIAL CALCULUS</h3>
          <p class="pdf-hours">(14 Hours)</p>
          <p>Limits, continuity, differentiation and applications.</p>
        </div>
        `
      )
      .replace(
        /{{REFERENCES}}/g,
        `
        <li>H.K. Dass – Mathematical Physics</li>
        <li>Arfken & Weber – Mathematical Methods for Physicists</li>
        `
      )
      .replace(
        /{{TIMESTAMP}}/g,
        new Date().toLocaleString("en-IN", { hour12: false })
      )
      .replace(/{{PAGE}}/g, "1");

    // 3️⃣ Launch Chromium on Vercel
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // 4️⃣ Load content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // 5️⃣ Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // 6️⃣ Send response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=syllabus.pdf"
    );

    res.status(200).send(pdfBuffer);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: "PDF generation failed",
      details: err.message,
    });
  }
}
