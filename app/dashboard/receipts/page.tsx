import { ScanLine, Store, Inbox } from "lucide-react";
import { requireUserId, getActiveWallet, getCategories, getReceipts } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ReceiptScanner } from "@/components/forms/receipt-scanner";
import { formatPeso, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const userId = await requireUserId();
  const wallet = await getActiveWallet(userId);
  if (!wallet) {
    return (
      <EmptyState
        icon={ScanLine}
        title="No wallet selected"
        description="Create a wallet before scanning receipts."
      />
    );
  }

  const [categories, receipts] = await Promise.all([
    getCategories(wallet.id),
    getReceipts(wallet.id),
  ]);
  const accounts = wallet.accounts.map((a) => ({ id: a.id, name: a.name }));
  const cats = categories.map((c) => ({ id: c.id, name: c.name, type: c.type }));

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Receipts</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Snap a photo and we&apos;ll read it with on-device OCR, then structure it using your local
          model — no receipt data ever leaves your machine.
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Add an account first"
          description="You'll need at least one account in this wallet to log a scanned receipt against."
        />
      ) : (
        <ReceiptScanner accounts={accounts} categories={cats} />
      )}

      {/* History */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Scanned history</h2>
        {receipts.length === 0 ? (
          <Card>
            <div className="p-6">
              <EmptyState
                icon={Store}
                title="No receipts yet"
                description="Receipts you scan and confirm will show up here, linked to their transaction."
              />
            </div>
          </Card>
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {receipts.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-muted">
                  <Store className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {r.merchantName || r.transaction.description || "Receipt"}
                  </p>
                  <p className="truncate text-xs text-ink-faint">
                    {r.transaction.category?.name ?? "Uncategorized"} · {r.transaction.account.name} ·{" "}
                    {formatDate(r.transaction.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="hidden sm:inline-flex">{r.status.toLowerCase()}</Badge>
                  <span className="tnum font-medium text-ink">
                    {formatPeso(r.totalExtracted ?? r.transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
