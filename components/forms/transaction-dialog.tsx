"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createTransaction, type ActionResult } from "@/actions/finance";

type Account = { id: string; name: string };
type Category = { id: string; name: string; type: string };
type TxnType = "INCOME" | "EXPENSE" | "TRANSFER";

const initial: ActionResult = { ok: false };
const today = () => new Date().toISOString().slice(0, 10);

export function TransactionDialog({
  accounts,
  categories,
  triggerLabel = "Add transaction",
  variant = "primary",
}: {
  accounts: Account[];
  categories: Category[];
  triggerLabel?: string;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<TxnType>("EXPENSE");
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [state, formAction] = useActionState(createTransaction, initial);

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  const cats = categories.filter((c) => c.type === type);
  const destAccounts = accounts.filter((a) => a.id !== accountId);

  const types: { value: TxnType; label: string }[] = [
    { value: "EXPENSE", label: "Expense" },
    { value: "INCOME", label: "Income" },
    { value: "TRANSFER", label: "Transfer" },
  ];

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} disabled={accounts.length === 0}>
        <Plus className="h-4 w-4" /> {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add a transaction"
        description="Record income, an expense, or a transfer between accounts."
      >
        <form action={formAction} className="space-y-4">
          {/* Type segmented control */}
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-surface-2 p-1">
            {types.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                  type === t.value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />

          <div>
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
          </div>

          <div>
            <Label htmlFor="accountId">{type === "TRANSFER" ? "From account" : "Account"}</Label>
            <Select
              id="accountId"
              name="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>

          {type === "TRANSFER" ? (
            <div>
              <Label htmlFor="toAccountId">To account</Label>
              <Select id="toAccountId" name="toAccountId" required defaultValue={destAccounts[0]?.id}>
                {destAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select id="categoryId" name="categoryId" defaultValue="">
                <option value="">Uncategorized</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today()} />
            </div>
            <div>
              <Label htmlFor="description">Note</Label>
              <Input id="description" name="description" placeholder="e.g. SM Supermarket" maxLength={120} />
            </div>
          </div>

          {state.error && <p className="text-sm text-negative">{state.error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Save transaction</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
