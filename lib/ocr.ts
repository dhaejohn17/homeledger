import { createWorker } from "tesseract.js";
import { parseAmount } from "./utils";

/** Run OCR over an image buffer. Returns the raw extracted text. */
export async function ocrImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}

export type ReceiptDraft = {
  merchantName: string | null;
  date: string | null; // ISO yyyy-mm-dd
  total: number | null;
  suggestedCategory: string | null;
};

/**
 * Last-resort parser used when the AI model is unavailable. Pulls a merchant
 * guess (first non-empty line), the largest "total"-ish amount, and a date.
 */
export function heuristicParse(text: string): ReceiptDraft {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const merchantName = lines[0]?.slice(0, 60) ?? null;

  // Prefer a line containing "total"; otherwise take the largest peso figure.
  let total: number | null = null;
  const totalLine = lines.find((l) => /total|amount due|balance/i.test(l));
  if (totalLine) {
    const amt = parseAmount(totalLine.replace(/.*?(?:total|amount due|balance)/i, ""));
    if (!Number.isNaN(amt)) total = amt;
  }
  if (total == null) {
    const amounts = (text.match(/\d[\d,]*\.\d{2}/g) || [])
      .map((m) => parseAmount(m))
      .filter((n) => !Number.isNaN(n));
    if (amounts.length) total = Math.max(...amounts);
  }

  // Date: look for common formats.
  let date: string | null = null;
  const m =
    text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) ||
    text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (m) {
    const d = new Date(m[0]);
    if (!Number.isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
  }

  return { merchantName, date, total, suggestedCategory: null };
}
