"use client";

import * as React from "react";
import { useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { contributeToGoal } from "@/actions/finance";

export function GoalContribute({ goalId }: { goalId: string }) {
  const [value, setValue] = React.useState("");
  const [pending, start] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount");
      return;
    }
    setError(null);
    start(async () => {
      const res = await contributeToGoal(goalId, amount);
      if (res.ok) setValue("");
      else setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">₱</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add to goal"
          className="w-full rounded-lg border border-line bg-surface py-1.5 pl-6 pr-2 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
        />
      </div>
      <button
        onClick={submit}
        disabled={pending}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-60"
        aria-label="Add contribution"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </button>
      {error && <span className="text-xs text-negative">{error}</span>}
    </div>
  );
}
