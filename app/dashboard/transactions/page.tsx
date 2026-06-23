import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Search, Inbox } from "lucide-react";
import {
  requireUserId,
  getActiveWallet,
  getCategories,
  getTransactions,
} from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";
import { deleteTransaction } from "@/actions/finance";
import { formatPeso, formatDate } from "@/lib/format";
import { TXN_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ICONS = {
  INCOME: { Icon: ArrowDownRight, cls: "bg-positive-soft text-positive" },
  EXPENSE: { Icon: ArrowUpRight, cls: "bg-negative-soft text-negative" },
  TRANSFER: { Icon: ArrowLeftRight, cls: "bg-surface-2 text-ink-muted" },
} as const;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; q?: string }>;
}) {
  const userId = await requireUserId();
  const wallet = await getActiveWallet(userId);
  if (!wallet) {
    return (
      <EmptyState icon={Inbox} title="No wallet selected" description="Create a wallet to record transactions." />
    );
  }

  const sp = await searchParams;
  const [categories, transactions] = await Promise.all([
    getCategories(wallet.id),
    getTransactions(wallet.id, { accountId: sp.account, search: sp.q }),
  ]);
  const accounts = wallet.accounts.map((a) => ({ id: a.id, name: a.name }));
  const cats = categories.map((c) => ({ id: c.id, name: c.name, type: c.type }));

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Transactions</h1>
          <p className="mt-1 text-sm text-ink-muted">Every movement of money in {wallet.name}.</p>
        </div>
        <TransactionDialog accounts={accounts} categories={cats} />
      </div>

      <Card className="overflow-hidden">
        {/* Filter bar — plain GET form, works without JS */}
        <form className="flex flex-col gap-3 border-b border-line bg-surface-2/40 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search notes…" className="pl-9" />
          </div>
          <Select name="account" defaultValue={sp.account ?? ""} className="sm:w-48">
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>

        {transactions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Inbox}
              title="No transactions found"
              description="Try clearing the filters, or add your first transaction to get started."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-medium">Transaction</th>
                  <th className="px-3 py-3 font-medium">Account</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell">Date</th>
                  <th className="px-3 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {transactions.map((t) => {
                  const { Icon, cls } = ICONS[t.type];
                  const signed = t.type === "INCOME" ? t.amount : -t.amount;
                  return (
                    <tr key={t.id} className="group transition-colors hover:bg-surface-2/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">
                              {t.description || t.category?.name || TXN_TYPE_LABELS[t.type]}
                            </p>
                            <p className="truncate text-xs text-ink-faint">
                              {t.category?.name ?? "Uncategorized"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-ink-muted">{t.account.name}</td>
                      <td className="hidden px-3 py-3.5 text-ink-muted md:table-cell">{formatDate(t.date)}</td>
                      <td
                        className={`tnum px-3 py-3.5 text-right font-medium ${
                          t.type === "INCOME" ? "text-positive" : "text-ink"
                        }`}
                      >
                        {signed > 0 ? "+" : ""}
                        {formatPeso(Math.abs(signed))}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="opacity-0 transition-opacity group-hover:opacity-100">
                          <ConfirmDelete id={t.id} action={deleteTransaction} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
