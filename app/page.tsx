import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ScanLine, Bot, PiggyBank } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/layout/logo";
import { formatPeso } from "@/lib/format";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-medium text-ink-muted hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-fg hover:bg-primary-hover"
          >
            Create account
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Local-first · runs on your machine
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Every peso,
            <br />
            <span className="text-primary">accounted for.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">
            HomeLedger keeps your household&apos;s money legible — cash, GCash, Maya and bank accounts
            in one ledger, with budgets, savings goals, and a private AI that reads your receipts.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-fg hover:bg-primary-hover"
            >
              Start your ledger <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 font-medium text-ink hover:bg-surface-2"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <ScanLine className="h-4 w-4 text-primary" /> Receipt OCR
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-primary" /> Local AI assistant
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PiggyBank className="h-4 w-4 text-primary" /> Budgets &amp; goals
            </span>
          </div>
        </div>

        {/* Signature: a ledger tape preview with tabular-mono figures. */}
        <div className="relative">
          <div className="ledger-rule absolute inset-0 rounded-2xl opacity-40" aria-hidden />
          <div className="relative rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-display text-sm font-semibold text-ink">Household Fund</span>
              <span className="text-xs text-ink-faint">June 2026</span>
            </div>
            <ul className="divide-y divide-line/70 text-sm">
              {[
                ["Monthly Salary", 65000, "Income"],
                ["SM Supermarket", -3240.5, "Groceries"],
                ["Meralco Bill", -2870, "Utilities"],
                ["Grab Ride", -310, "Transport"],
                ["To Vacation Fund", -5000, "Transfer"],
              ].map(([name, amt, cat]) => (
                <li key={name as string} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-ink">{name}</p>
                    <p className="text-xs text-ink-faint">{cat}</p>
                  </div>
                  <span
                    className={`tnum text-sm font-medium ${
                      (amt as number) > 0 ? "text-positive" : "text-ink"
                    }`}
                  >
                    {(amt as number) > 0 ? "+" : ""}
                    {formatPeso(Math.abs(amt as number))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Net this month
              </span>
              <span className="tnum text-lg font-semibold text-primary">{formatPeso(53579.5)}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
