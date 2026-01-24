import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Placeholder API
 * Real PDF generation will be added next
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.status(200).json({
    status: "ok",
    message: "PDF syllabus endpoint placeholder",
    note: "Puppeteer logic will be added next"
  });
}
