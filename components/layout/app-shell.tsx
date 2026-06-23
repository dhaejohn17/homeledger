"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  ScanLine,
  PieChart,
  Bot,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletSwitcher } from "@/components/layout/wallet-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallets", href: "/dashboard/wallets", icon: Wallet },
  { name: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { name: "Budgets & Goals", href: "/dashboard/budgets", icon: Target },
  { name: "Receipts", href: "/dashboard/receipts", icon: ScanLine },
  { name: "Reports", href: "/dashboard/reports", icon: PieChart },
  { name: "AI Assistant", href: "/dashboard/assistant", icon: Bot },
];

type WalletOption = { id: string; name: string; type: string; balance: number };

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary-soft-fg"
                : "text-ink-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-ink-faint group-hover:text-ink-muted")} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === "/dashboard/settings";
  return (
    <div className="border-t border-line p-3">
      <Link
        href="/dashboard/settings"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-primary-soft text-primary-soft-fg" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        <Settings className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-ink-faint")} />
        Settings
      </Link>
    </div>
  );
}

export function AppShell({
  wallets,
  activeWalletId,
  user,
  children,
}: {
  wallets: WalletOption[];
  activeWalletId: string | null;
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Logo href="/dashboard" />
        </div>
        <NavLinks />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-line bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Logo href="/dashboard" />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="text-ink-faint">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawer(false)} />
            <SidebarFooter onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-2 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <WalletSwitcher wallets={wallets} activeId={activeWalletId} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
