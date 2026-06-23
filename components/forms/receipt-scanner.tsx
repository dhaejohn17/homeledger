"use client";

import * as React from "react";
import { useActionState } from "react";
import { UploadCloud, ScanLine, Loader2, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { createTransactionFromReceipt, type ActionResult } from "@/actions/finance";

type Account = { id: string; name: string };
type Category = { id: string; name: string; type: string };

type Draft = {
  merchantName: string | null;
  date: string | null;
  total: number | null;
  suggestedCategory: string | null;
};

type ScanResponse = {
  draft: Draft;
  rawText: string;
  fileUrl: string;
  usedAi: boolean;
};

const initial: ActionResult = { ok: false };
const today = () => new Date().toISOString().slice(0, 10);

export function ReceiptScanner({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [scan, setScan] = React.useState<ScanResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState(createTransactionFromReceipt, initial);
  const expenseCats = categories.filter((c) => c.type === "EXPENSE");

  // Map the model's suggested category name to one of our category ids.
  const suggestedId = React.useMemo(() => {
    if (!scan?.draft.suggestedCategory) return "";
    const match = expenseCats.find(
      (c) => c.name.toLowerCase() === scan.draft.suggestedCategory!.toLowerCase(),
    );
    return match?.id ?? "";
  }, [scan, expenseCats]);

  React.useEffect(() => {
    if (state.ok) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function reset() {
    setPreview(null);
    setScan(null);
    setError(null);
    setScanning(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    setError(null);
    setScan(null);
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/receipts/scan", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't scan that receipt.");
        return;
      }
      setScan(data as ScanResponse);
    } catch {
      setError("Something went wrong while scanning. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <Card>
      <CardBody className="p-5">
        {!preview ? (
          <label
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-2/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-surface-2/60"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg">
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="font-display text-base font-semibold text-ink">
              Drop a receipt photo here
            </span>
            <span className="mt-1 max-w-xs text-sm text-ink-muted">
              or click to browse. We&apos;ll read the merchant, date, and total for you. JPG or PNG, up
              to 10MB.
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
        ) : (
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            {/* Preview */}
            <div className="space-y-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-line bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Receipt preview" className="h-full w-full object-cover" />
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="w-full">
                <RefreshCw className="h-3.5 w-3.5" /> Choose another
              </Button>
            </div>

            {/* Review / status */}
            <div>
              {scanning ? (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="mt-3 font-medium text-ink">Reading your receipt…</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Running OCR, then letting the local model structure it.
                  </p>
                </div>
              ) : error ? (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                  <p className="font-medium text-negative">{error}</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={reset}>
                    Try again
                  </Button>
                </div>
              ) : scan ? (
                <form action={formAction} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 border-primary/20 bg-primary-soft text-primary-soft-fg">
                      {scan.usedAi ? (
                        <>
                          <Sparkles className="h-3 w-3" /> Read by AI
                        </>
                      ) : (
                        <>
                          <ScanLine className="h-3 w-3" /> Read by OCR
                        </>
                      )}
                    </Badge>
                    <span className="text-xs text-ink-faint">Review &amp; confirm below</span>
                  </div>

                  {/* hidden carry-through fields */}
                  <input type="hidden" name="fileUrl" value={scan.fileUrl} />
                  <input type="hidden" name="merchantName" value={scan.draft.merchantName ?? ""} />
                  <input type="hidden" name="rawOcrData" value={scan.rawText} />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="r-amount">Total (₱)</Label>
                      <Input
                        id="r-amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={scan.draft.total ?? ""}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="r-date">Date</Label>
                      <Input
                        id="r-date"
                        name="date"
                        type="date"
                        defaultValue={scan.draft.date ?? today()}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="r-desc">Merchant / note</Label>
                    <Input
                      id="r-desc"
                      name="description"
                      defaultValue={scan.draft.merchantName ?? ""}
                      placeholder="e.g. SM Supermarket"
                      maxLength={120}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="r-account">Account</Label>
                      <Select id="r-account" name="accountId" required defaultValue={accounts[0]?.id}>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="r-category">Category</Label>
                      <Select id="r-category" name="categoryId" defaultValue={suggestedId}>
                        <option value="">Uncategorized</option>
                        {expenseCats.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {state.error && <p className="text-sm text-negative">{state.error}</p>}

                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" onClick={reset}>
                      Discard
                    </Button>
                    <SubmitButton>
                      <CheckCircle2 className="h-4 w-4" /> Log expense
                    </SubmitButton>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
