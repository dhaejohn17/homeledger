import {
  Wallet as WalletIcon,
  Users,
  Landmark,
  Smartphone,
  Banknote,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import { requireUserId, getAccessibleWallets, getActiveWallet } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletDialog } from "@/components/forms/wallet-dialog";
import { AccountDialog } from "@/components/forms/account-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";
import { deleteAccount } from "@/actions/finance";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { formatPeso } from "@/lib/format";
import type { AccountType } from "@prisma/client";

export const dynamic = "force-dynamic";

const ACCOUNT_ICON: Record<AccountType, typeof WalletIcon> = {
  CASH: Banknote,
  BANK: Landmark,
  EWALLET: Smartphone,
  SAVINGS: PiggyBank,
  CREDIT_CARD: CreditCard,
};

export default async function WalletsPage() {
  const userId = await requireUserId();
  const [wallets, active] = await Promise.all([
    getAccessibleWallets(userId),
    getActiveWallet(userId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Wallets</h1>
          <p className="mt-1 text-sm text-ink-muted">Personal and shared containers for your accounts.</p>
        </div>
        <WalletDialog />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.map((w) => {
          const isActive = active?.id === w.id;
          return (
            <Card
              key={w.id}
              className={isActive ? "ring-2 ring-primary/40" : undefined}
            >
              <div className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
                    {w.type === "SHARED" ? <Users className="h-5 w-5" /> : <WalletIcon className="h-5 w-5" />}
                  </span>
                  <Badge>{w.role}</Badge>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{w.name}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                  {w.type === "SHARED" ? (
                    <>
                      <Users className="h-3.5 w-3.5" /> {w.members} member{w.members === 1 ? "" : "s"}
                    </>
                  ) : (
                    "Only visible to you"
                  )}
                </p>
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Balance</p>
                  <p className="tnum mt-0.5 text-2xl font-semibold text-ink">{formatPeso(w.balance)}</p>
                </div>
                {isActive && (
                  <span className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Active wallet
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Accounts in the active wallet */}
      {active && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Accounts</h2>
              <p className="text-sm text-ink-muted">In {active.name}</p>
            </div>
            <AccountDialog />
          </div>

          <Card>
            <ul className="divide-y divide-line">
              {active.accounts.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-ink-muted">
                  No accounts yet. Add your first one to start tracking balances.
                </li>
              )}
              {active.accounts.map((a) => {
                const Icon = ACCOUNT_ICON[a.type];
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{a.name}</p>
                        <p className="text-xs text-ink-faint">{ACCOUNT_TYPE_LABELS[a.type]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`tnum text-sm font-medium ${a.balance < 0 ? "text-negative" : "text-ink"}`}>
                        {formatPeso(a.balance)}
                      </span>
                      <ConfirmDelete id={a.id} action={deleteAccount} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
