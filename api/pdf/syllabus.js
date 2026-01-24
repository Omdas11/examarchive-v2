import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(`
      <html>
        <body style="font-family: serif; padding: 40px;">
          <h1>ExamArchive – PDF Test</h1>
          <p>If you see this, PDF generation works.</p>
        </body>
      </html>
    `);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=syllabus.pdf");
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "PDF generation failed",
      message: err.message,
    });
  }
}
