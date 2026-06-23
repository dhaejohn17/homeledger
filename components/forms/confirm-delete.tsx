"use client";

import * as React from "react";
import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import type { ActionResult } from "@/actions/finance";
import { cn } from "@/lib/utils";

export function ConfirmDelete({
  id,
  action,
  className,
  size = 16,
}: {
  id: string;
  action: (id: string) => Promise<ActionResult>;
  className?: string;
  size?: number;
}) {
  const [armed, setArmed] = React.useState(false);
  const [pending, start] = useTransition();

  React.useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <button
        onClick={() => start(() => action(id).then(() => undefined))}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md bg-negative-soft px-2 py-1 text-xs font-medium text-negative"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Confirm
      </button>
    );
  }

  return (
    <button
      onClick={() => setArmed(true)}
      aria-label="Delete"
      className={cn("rounded-md p-1.5 text-ink-faint transition-colors hover:bg-negative-soft hover:text-negative", className)}
    >
      <Trash2 style={{ height: size, width: size }} />
    </button>
  );
}
