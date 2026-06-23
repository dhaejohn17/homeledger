"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Wallet, Users } from "lucide-react";
import { setActiveWallet } from "@/actions/finance";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

type WalletOption = { id: string; name: string; type: string; balance: number };

export function WalletSwitcher({
  wallets,
  activeId,
}: {
  wallets: WalletOption[];
  activeId: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const ref = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const active = wallets.find((w) => w.id === activeId) ?? wallets[0];
  if (!active) return null;

  function choose(id: string) {
    setOpen(false);
    if (id === activeId) return;
    startTransition(async () => {
      await setActiveWallet(id);
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-left transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-fg">
          {active.type === "SHARED" ? <Users className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-tight text-ink">{active.name}</span>
          <span className="tnum block text-xs leading-tight text-ink-muted">{formatPeso(active.balance)}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-faint" />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Your wallets
          </p>
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => choose(w.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2",
                w.id === active.id && "bg-surface-2",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{w.name}</span>
                <span className="tnum block text-xs text-ink-muted">{formatPeso(w.balance)}</span>
              </span>
              {w.id === active.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
