import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Inbox,
} from "lucide-react";
import { requireUserId, getActiveWallet, getDashboardData, getCategories } from "@/lib/data";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { formatPeso, formatSignedPeso, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const wallet = await getActiveWallet(userId);

  if (!wallet) {
    return (
      <EmptyState
        icon={Wallet}
        title="No wallet yet"
        description="Create your first wallet to start tracking your household finances."
        action={
          <Link href="/dashboard/wallets">
            <Button>Go to wallets</Button>
          </Link>
        }
      />
    );
  }

  const [data, categories] = await Promise.all([
    getDashboardData(wallet.id),
    getCategories(wallet.id),
  ]);
  const accounts = wallet.accounts.map((a) => ({ id: a.id, name: a.name }));
  const cats = categories.map((c) => ({ id: c.id, name: c.name, type: c.type }));
  const maxCat = data.categoryBreakdown[0]?.value ?? 1;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{wallet.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">Your financial summary for this month.</p>
        </div>
        <TransactionDialog accounts={accounts} categories={cats} />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total balance" icon={Wallet} value={formatPeso(data.totalBalance)} accent />
        <StatCard label="Income · this month" icon={TrendingUp} value={formatPeso(data.monthlyIncome)} />
        <StatCard label="Expenses · this month" icon={TrendingDown} value={formatPeso(data.monthlyExpenses)} />
        <StatCard
          label="Savings rate"
          icon={PiggyBank}
          value={`${Math.round(data.savingsRate * 100)}%`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Cash flow */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash flow</CardTitle>
            <span className="flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-negative" /> Expense
              </span>
            </span>
          </CardHeader>
          <CardBody>
            <CashFlowChart data={data.monthlyFlow} />
          </CardBody>
        </Card>

        {/* Recent */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/dashboard/transactions" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="flex-1 p-0">
            {data.recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-muted">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.recent.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <TxnIcon type={tx.type} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{tx.name}</p>
                        <p className="truncate text-xs text-ink-faint">
                          {tx.category} · {formatDateShort(tx.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`tnum shrink-0 text-sm font-medium ${
                        tx.amount > 0 ? "text-positive" : "text-ink"
                      }`}
                    >
                      {formatSignedPeso(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Where your money went</CardTitle>
          <span className="text-xs text-ink-muted">This month · expenses</span>
        </CardHeader>
        <CardBody>
          {data.categoryBreakdown.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={Inbox}
                title="Nothing to break down yet"
                description="Once you log some expenses this month, you'll see your spending by category here."
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {data.categoryBreakdown.slice(0, 6).map((c) => (
                <li key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="tnum text-ink-muted">{formatPeso(c.value)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(c.value / maxCat) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  accent?: boolean;
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              accent ? "bg-primary-soft text-primary-soft-fg" : "bg-surface-2 text-ink-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="tnum mt-3 text-2xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  );
}

function TxnIcon({ type }: { type: string }) {
  const map = {
    INCOME: { Icon: ArrowDownRight, cls: "bg-positive-soft text-positive" },
    EXPENSE: { Icon: ArrowUpRight, cls: "bg-negative-soft text-negative" },
    TRANSFER: { Icon: ArrowLeftRight, cls: "bg-surface-2 text-ink-muted" },
  } as const;
  const { Icon, cls } = map[type as keyof typeof map] ?? map.EXPENSE;
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cls}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
