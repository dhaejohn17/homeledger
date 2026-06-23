import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccessibleWallets, getActiveWalletId } from "@/lib/data";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wallets = await getAccessibleWallets(session.user.id);
  const activeWalletId = await getActiveWalletId(session.user.id);

  return (
    <AppShell
      wallets={wallets.map((w) => ({ id: w.id, name: w.name, type: w.type, balance: w.balance }))}
      activeWalletId={activeWalletId}
      user={{ name: session.user.name, email: session.user.email }}
    >
      {children}
    </AppShell>
  );
}
