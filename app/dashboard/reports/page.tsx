import { PieChart as PieIcon, TrendingUp, TrendingDown, Scale, Inbox } from "lucide-react";
import { requireUserId, getActiveWallet, getReportData } from "@/lib/data";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendChart, CategoryDonut } from "@/components/dashboard/reports-charts";
import { CHART_PALETTE as PALETTE } from "@/lib/constants";
import { formatPeso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const userId = await requireUserId();
  const wallet = await getActiveWallet(userId);
  if (!wallet) {
    return (
      <EmptyState
        icon={PieIcon}
        title="No wallet selected"
        description="Create a wallet to see reports."
      />
    );
  }

  const data = await getReportData(wallet.id, 12);
  const totalCat = data.categoryBreakdown.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Reports</h1>
        <p className="mt-1 text-sm text-ink-muted">
          The last 12 months across {wallet.name} · {data.txnCount} transactions.
        </p>
      </div>

      {data.txnCount === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Not enough data yet"
          description="Log a few transactions and your trends, category mix, and account breakdown will appear here."
        />
      ) : (
        <>
          {/* Stat row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Income · 12 mo" value={formatPeso(data.totalIncome)} icon={TrendingUp} tone="positive" />
            <Stat label="Expenses · 12 mo" value={formatPeso(data.totalExpense)} icon={TrendingDown} tone="negative" />
            <Stat
              label="Net · 12 mo"
              value={formatPeso(data.net)}
              icon={Scale}
              tone={data.net >= 0 ? "positive" : "negative"}
            />
            <Stat label="Avg monthly spend" value={formatPeso(data.avgMonthlyExpense)} icon={PieIcon} />
          </div>

          {/* Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Income, expense &amp; net</CardTitle>
              <span className="flex items-center gap-4 text-xs text-ink-muted">
                <Legend color="var(--positive)" label="Income" />
                <Legend color="var(--negative)" label="Expense" />
                <Legend color="var(--primary)" label="Net" />
              </span>
            </CardHeader>
            <CardBody>
              <TrendChart data={data.months} />
            </CardBody>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Category mix */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by category</CardTitle>
                <span className="text-xs text-ink-muted">12 months</span>
              </CardHeader>
              <CardBody>
                <CategoryDonut data={data.categoryBreakdown} />
                <ul className="mt-4 space-y-2">
                  {data.categoryBreakdown.slice(0, 6).map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: c.color ?? PALETTE[i % PALETTE.length] }}
                      />
                      <span className="flex-1 truncate text-ink">{c.name}</span>
                      <span className="tnum text-ink-muted">{formatPeso(c.value)}</span>
                      <span className="tnum w-12 text-right text-ink-faint">
                        {Math.round((c.value / totalCat) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            {/* Account breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>By account</CardTitle>
                <span className="text-xs text-ink-muted">Balance &amp; spend</span>
              </CardHeader>
              <CardBody>
                {data.accountSpend.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-muted">No accounts yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {data.accountSpend.map((a) => {
                      const max = data.accountSpend[0].spent || 1;
                      return (
                        <li key={a.name}>
                          <div className="mb-1 flex items-baseline justify-between text-sm">
                            <span className="font-medium text-ink">{a.name}</span>
                            <span className="text-xs text-ink-faint">
                              bal <span className="tnum text-ink-muted">{formatPeso(a.balance)}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${(a.spent / max) * 100}%` }}
                              />
                            </div>
                            <span className="tnum w-24 text-right text-sm text-ink">
                              {formatPeso(a.spent)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof PieIcon;
  tone?: "positive" | "negative";
}) {
  const toneCls =
    tone === "positive"
      ? "bg-positive-soft text-positive"
      : tone === "negative"
        ? "bg-negative-soft text-negative"
        : "bg-surface-2 text-ink-muted";
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneCls}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="tnum mt-3 text-2xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
