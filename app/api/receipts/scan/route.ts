import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ocrImage, heuristicParse, type ReceiptDraft } from "@/lib/ocr";
import { extractJson } from "@/lib/ollama";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `You extract structured data from Philippine store receipts.
Return ONLY a JSON object with these keys:
- "merchantName": store name (string) or null
- "date": the purchase date as "YYYY-MM-DD" (string) or null
- "total": the final total amount paid as a number (no currency symbol) or null
- "suggestedCategory": one of Groceries, Dining, Transportation, Utilities, Rent, Health, Entertainment, Shopping, Education, Bills, Other
Use the grand total / amount due, not subtotals. Output JSON only.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Please upload an image (JPG or PNG). PDF receipts aren't supported yet." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Persist the upload so it can be attached to the transaction.
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const fileName = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  let fileUrl = "";
  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    fileUrl = `/uploads/${fileName}`;
  } catch {
    // Non-fatal: still return the parsed draft even if saving failed.
  }

  let rawText = "";
  try {
    rawText = await ocrImage(buffer);
  } catch {
    return NextResponse.json(
      { error: "Couldn't read the image. Try a clearer, well-lit photo." },
      { status: 422 },
    );
  }

  // Structure with the local model; fall back to a regex heuristic.
  let draft = await extractJson<ReceiptDraft>(SYSTEM, `Receipt text:\n"""\n${rawText.slice(0, 4000)}\n"""`);
  let usedAi = true;
  if (!draft || (draft.total == null && draft.merchantName == null)) {
    draft = heuristicParse(rawText);
    usedAi = false;
  }

  return NextResponse.json({ draft, rawText: rawText.slice(0, 4000), fileUrl, usedAi });
}
