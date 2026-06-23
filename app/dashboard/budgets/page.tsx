import { Target, Flag, Inbox } from "lucide-react";
import {
  requireUserId,
  getActiveWallet,
  getCategories,
  getBudgetsWithSpend,
  getGoals,
} from "@/lib/data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BudgetDialog } from "@/components/forms/budget-dialog";
import { GoalDialog } from "@/components/forms/goal-dialog";
import { GoalContribute } from "@/components/forms/goal-contribute";
import { ConfirmDelete } from "@/components/forms/confirm-delete";
import { deleteBudget, deleteGoal } from "@/actions/finance";
import { formatPeso } from "@/lib/format";
import { PERIOD_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const userId = await requireUserId();
  const wallet = await getActiveWallet(userId);
  if (!wallet) {
    return <EmptyState icon={Inbox} title="No wallet selected" description="Create a wallet first." />;
  }

  const [categories, budgets, goals] = await Promise.all([
    getCategories(wallet.id),
    getBudgetsWithSpend(wallet.id),
    getGoals(wallet.id),
  ]);
  const cats = categories.map((c) => ({ id: c.id, name: c.name, type: c.type }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Budgets &amp; Goals</h1>
        <p className="mt-1 text-sm text-ink-muted">Keep spending in check and save toward what matters.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Budgets */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Budgets</h2>
            <BudgetDialog categories={cats} />
          </div>

          {budgets.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No budgets yet"
              description="Set a monthly limit for groceries, dining, or overall spending to stay on track."
            />
          ) : (
            <div className="space-y-3">
              {budgets.map((b) => {
                const over = b.spent > b.amount;
                const pct = Math.min(b.pct, 1) * 100;
                return (
                  <Card key={b.id}>
                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: `${b.categoryColor ?? "#15533a"}1a`,
                              color: b.categoryColor ?? "var(--primary)",
                            }}
                          >
                            <Target className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-medium text-ink">{b.categoryName}</p>
                            <p className="text-xs text-ink-faint">{PERIOD_LABELS[b.period]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="tnum text-sm font-semibold text-ink">{formatPeso(b.spent)}</p>
                            <p className="tnum text-xs text-ink-faint">of {formatPeso(b.amount)}</p>
                          </div>
                          <ConfirmDelete id={b.id} action={deleteBudget} />
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`h-full rounded-full ${over ? "bg-negative" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className={`mt-1.5 text-right text-xs font-medium ${over ? "text-negative" : "text-ink-muted"}`}>
                        {over
                          ? `Over by ${formatPeso(b.spent - b.amount)}`
                          : `${Math.round((b.spent / b.amount) * 100) || 0}% used`}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Goals */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Savings goals</h2>
            <GoalDialog />
          </div>

          {goals.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="No goals yet"
              description="Create a savings goal — an emergency fund, a trip, a new gadget — and track your progress."
            />
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const pct = g.targetAmount > 0 ? Math.min(g.currentAmount / g.targetAmount, 1) : 0;
                const done = g.currentAmount >= g.targetAmount;
                return (
                  <Card key={g.id}>
                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-ink">{g.name}</p>
                          {g.deadline && (
                            <p className="text-xs text-ink-faint">
                              by {new Date(g.deadline).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="tnum text-sm font-semibold text-ink">
                            {formatPeso(g.currentAmount)}{" "}
                            <span className="font-normal text-ink-faint">/ {formatPeso(g.targetAmount)}</span>
                          </span>
                          <ConfirmDelete id={g.id} action={deleteGoal} />
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`h-full rounded-full ${done ? "bg-positive" : "bg-accent"}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-ink-muted">
                        {done ? "Goal reached 🎉" : `${Math.round(pct * 100)}% there`}
                      </p>
                      {!done && (
                        <div className="mt-3">
                          <GoalContribute goalId={g.id} />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
