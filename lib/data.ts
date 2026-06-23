import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const ACTIVE_WALLET_COOKIE = "hl_active_wallet";

/** Returns the signed-in user's id, or redirects to /login. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

/** Wallets the user owns or belongs to, with a computed balance + counts. */
export async function getAccessibleWallets(userId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: {
      accounts: { select: { balance: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return wallets.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    type: w.type,
    ownerId: w.ownerId,
    members: w._count.members,
    role: w.ownerId === userId ? "OWNER" : "MEMBER",
    balance: w.accounts.reduce((sum, a) => sum + a.balance, 0),
  }));
}

/** The id of the wallet currently in focus (cookie, falling back to first). */
export async function getActiveWalletId(userId: string): Promise<string | null> {
  const wallets = await getAccessibleWallets(userId);
  if (wallets.length === 0) return null;
  const cookieStore = await cookies();
  const chosen = cookieStore.get(ACTIVE_WALLET_COOKIE)?.value;
  if (chosen && wallets.some((w) => w.id === chosen)) return chosen;
  return wallets[0].id;
}

export async function getActiveWallet(userId: string) {
  const id = await getActiveWalletId(userId);
  if (!id) return null;
  return prisma.wallet.findUnique({
    where: { id },
    include: { accounts: { orderBy: { createdAt: "asc" } } },
  });
}

/** Categories available to a wallet: its own plus global defaults. */
export async function getCategories(walletId: string) {
  return prisma.category.findMany({
    where: { OR: [{ walletId }, { walletId: null }] },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function getAccounts(walletId: string) {
  return prisma.account.findMany({
    where: { walletId },
    orderBy: { createdAt: "asc" },
  });
}

export type TransactionFilter = { accountId?: string; search?: string };

export async function getTransactions(walletId: string, filter: TransactionFilter = {}) {
  return prisma.transaction.findMany({
    where: {
      account: { walletId },
      ...(filter.accountId ? { accountId: filter.accountId } : {}),
      ...(filter.search
        ? { description: { contains: filter.search, mode: "insensitive" } }
        : {}),
    },
    include: { account: true, category: true },
    orderBy: { date: "desc" },
    take: 200,
  });
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Everything the dashboard overview needs, scoped to the active wallet. */
export async function getDashboardData(walletId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [accounts, txns] = await Promise.all([
    prisma.account.findMany({ where: { walletId } }),
    prisma.transaction.findMany({
      where: { account: { walletId }, date: { gte: sixMonthsAgo } },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const monthStart = startOfMonth();
  const thisMonth = txns.filter((t) => t.date >= monthStart);
  const monthlyIncome = thisMonth
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthlyExpenses = thisMonth
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;

  // 6-month income vs expense series.
  const months: { key: string; name: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleString("en-PH", { month: "short" }),
      income: 0,
      expense: 0,
    });
  }
  for (const t of txns) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (!bucket) continue;
    if (t.type === "INCOME") bucket.income += Math.abs(t.amount);
    else if (t.type === "EXPENSE") bucket.expense += Math.abs(t.amount);
  }

  // Expense breakdown by category this month.
  const byCategory = new Map<string, number>();
  for (const t of thisMonth) {
    if (t.type !== "EXPENSE") continue;
    const name = t.category?.name ?? "Uncategorized";
    byCategory.set(name, (byCategory.get(name) ?? 0) + Math.abs(t.amount));
  }
  const categoryBreakdown = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const recent = txns.slice(0, 6).map((t) => ({
    id: t.id,
    name: t.description ?? t.category?.name ?? "Transaction",
    category: t.category?.name ?? "Uncategorized",
    account: t.account.name,
    amount: t.type === "INCOME" ? Math.abs(t.amount) : -Math.abs(t.amount),
    type: t.type,
    date: t.date,
  }));

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    monthlyFlow: months.map(({ name, income, expense }) => ({ name, income, expense })),
    categoryBreakdown,
    recent,
    accountCount: accounts.length,
  };
}

/** Budgets with this-month spend per category. */
export async function getBudgetsWithSpend(walletId: string) {
  const monthStart = startOfMonth();
  const [budgets, txns] = await Promise.all([
    prisma.budget.findMany({ where: { walletId }, include: { category: true } }),
    prisma.transaction.findMany({
      where: { account: { walletId }, type: "EXPENSE", date: { gte: monthStart } },
    }),
  ]);

  return budgets.map((b) => {
    const spent = txns
      .filter((t) => (b.categoryId ? t.categoryId === b.categoryId : true))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return {
      id: b.id,
      amount: b.amount,
      period: b.period,
      categoryName: b.category?.name ?? "Overall",
      categoryColor: b.category?.color ?? null,
      spent,
      pct: b.amount > 0 ? Math.min(spent / b.amount, 1.5) : 0,
    };
  });
}

export async function getGoals(walletId: string) {
  return prisma.savingsGoal.findMany({
    where: { walletId },
    orderBy: { deadline: "asc" },
  });
}

export async function getReceipts(walletId: string) {
  return prisma.receipt.findMany({
    where: { transaction: { account: { walletId } } },
    include: { transaction: { include: { account: true, category: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Aggregates for the reports page over the last `monthsBack` months. */
export async function getReportData(walletId: string, monthsBack = 12) {
  const start = new Date();
  start.setMonth(start.getMonth() - (monthsBack - 1), 1);
  start.setHours(0, 0, 0, 0);

  const [accounts, txns] = await Promise.all([
    prisma.account.findMany({ where: { walletId } }),
    prisma.transaction.findMany({
      where: { account: { walletId }, date: { gte: start } },
      include: { category: true, account: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Monthly income / expense / net series.
  const months: { key: string; name: string; income: number; expense: number; net: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleString("en-PH", { month: "short" }),
      income: 0,
      expense: 0,
      net: 0,
    });
  }

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory = new Map<string, { value: number; color: string | null }>();

  for (const t of txns) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    const amt = Math.abs(t.amount);
    if (t.type === "INCOME") {
      totalIncome += amt;
      if (bucket) bucket.income += amt;
    } else if (t.type === "EXPENSE") {
      totalExpense += amt;
      if (bucket) bucket.expense += amt;
      const name = t.category?.name ?? "Uncategorized";
      const prev = byCategory.get(name);
      byCategory.set(name, { value: (prev?.value ?? 0) + amt, color: t.category?.color ?? null });
    }
  }
  for (const m of months) m.net = m.income - m.expense;

  const categoryBreakdown = [...byCategory.entries()]
    .map(([name, v]) => ({ name, value: v.value, color: v.color }))
    .sort((a, b) => b.value - a.value);

  // Spend per account (expenses only).
  const accountSpend = accounts
    .map((a) => ({
      name: a.name,
      balance: a.balance,
      spent: txns
        .filter((t) => t.accountId === a.id && t.type === "EXPENSE")
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    }))
    .sort((x, y) => y.spent - x.spent);

  const net = totalIncome - totalExpense;
  const avgMonthlyExpense = totalExpense / monthsBack;

  return {
    months: months.map(({ name, income, expense, net }) => ({ name, income, expense, net })),
    categoryBreakdown,
    accountSpend,
    totalIncome,
    totalExpense,
    net,
    avgMonthlyExpense,
    txnCount: txns.length,
    monthsBack,
  };
}
