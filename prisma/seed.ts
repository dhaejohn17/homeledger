/**
 * Seed script — `npm run db:seed` (runs via tsx).
 * Creates a demo household with realistic Philippine data so the app is
 * immediately explorable. Safe to re-run: it resets the demo user first.
 */
import { PrismaClient, type AccountType, type TransactionType } from "@prisma/client";
import { hash } from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../lib/constants";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@homeledger.app";
const DEMO_PASSWORD = "demo1234";

// Accounts with their opening balances (before sample transactions apply).
const ACCOUNTS: { name: string; type: AccountType; opening: number }[] = [
  { name: "BPI Savings", type: "SAVINGS", opening: 185_000 },
  { name: "BDO Checking", type: "BANK", opening: 42_500 },
  { name: "GCash", type: "EWALLET", opening: 6_800 },
  { name: "Maya", type: "EWALLET", opening: 2_400 },
  { name: "Cash", type: "CASH", opening: 3_500 },
];

type TxnSeed = {
  account: string;
  type: TransactionType;
  amount: number;
  category?: string;
  description: string;
  monthsAgo: number;
  day: number;
};

// A repeating monthly pattern, expanded across the last 5 months below.
function monthlyPattern(monthsAgo: number): TxnSeed[] {
  return [
    { account: "BDO Checking", type: "INCOME", amount: 62_000, category: "Salary", description: "Monthly salary", monthsAgo, day: 15 },
    { account: "GCash", type: "INCOME", amount: 8_500, category: "Business", description: "Online shop earnings", monthsAgo, day: 20 },
    { account: "BDO Checking", type: "EXPENSE", amount: 18_000, category: "Rent", description: "Apartment rent", monthsAgo, day: 5 },
    { account: "GCash", type: "EXPENSE", amount: 3_240, category: "Utilities", description: "Meralco electricity", monthsAgo, day: 8 },
    { account: "GCash", type: "EXPENSE", amount: 1_499, category: "Utilities", description: "PLDT fibr internet", monthsAgo, day: 9 },
    { account: "Cash", type: "EXPENSE", amount: 4_350, category: "Groceries", description: "SM Supermarket", monthsAgo, day: 6 },
    { account: "BDO Checking", type: "EXPENSE", amount: 3_980, category: "Groceries", description: "Puregold weekly", monthsAgo, day: 19 },
    { account: "GCash", type: "EXPENSE", amount: 890, category: "Transportation", description: "Grab rides", monthsAgo, day: 12 },
    { account: "Maya", type: "EXPENSE", amount: 1_260, category: "Dining", description: "Jollibee + Mang Inasal", monthsAgo, day: 14 },
    { account: "GCash", type: "EXPENSE", amount: 749, category: "Entertainment", description: "Netflix + Spotify", monthsAgo, day: 3 },
    { account: "Cash", type: "EXPENSE", amount: 620, category: "Health", description: "Mercury Drug", monthsAgo, day: 22 },
    { account: "BDO Checking", type: "EXPENSE", amount: 2_500, category: "Shopping", description: "Lazada order", monthsAgo, day: 24 },
  ];
}

async function main() {
  console.log("Seeding HomeLedger demo data…");

  // Reset: remove any existing demo user (cascades to wallets/accounts/txns).
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const passwordHash = await hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      name: "Demo Household",
      email: DEMO_EMAIL,
      passwordHash,
      ownedWallets: {
        create: {
          name: "Household Fund",
          type: "SHARED",
          description: "Shared family budget",
          accounts: { create: ACCOUNTS.map((a) => ({ name: a.name, type: a.type, balance: a.opening })) },
          categories: { create: DEFAULT_CATEGORIES },
        },
      },
    },
    include: { ownedWallets: { include: { accounts: true } } },
  });

  const wallet = user.ownedWallets[0];
  const categories = await prisma.category.findMany({ where: { walletId: wallet.id } });
  const catId = (name: string) => categories.find((c) => c.name === name)?.id ?? null;
  const acct = (name: string) => wallet.accounts.find((a) => a.name === name)!;

  // Build five months of transactions.
  const txns: TxnSeed[] = [];
  for (let m = 4; m >= 0; m--) txns.push(...monthlyPattern(m));

  // A few one-off extras for texture.
  txns.push(
    { account: "BPI Savings", type: "INCOME", amount: 15_000, category: "Gift", description: "Christmas bonus share", monthsAgo: 2, day: 18 },
    { account: "Cash", type: "EXPENSE", amount: 1_850, category: "Dining", description: "Family dinner out", monthsAgo: 1, day: 28 },
    { account: "GCash", type: "EXPENSE", amount: 3_200, category: "Education", description: "Online course", monthsAgo: 3, day: 11 },
  );

  // Track resulting balance deltas per account.
  const delta = new Map<string, number>();

  for (const t of txns) {
    const account = acct(t.account);
    const d = new Date();
    d.setMonth(d.getMonth() - t.monthsAgo, t.day);
    d.setHours(10, 0, 0, 0);

    await prisma.transaction.create({
      data: {
        accountId: account.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        categoryId: t.category ? catId(t.category) : null,
        date: d,
      },
    });

    const change = t.type === "INCOME" ? t.amount : -t.amount;
    delta.set(account.id, (delta.get(account.id) ?? 0) + change);
  }

  // Apply net deltas on top of opening balances.
  for (const [accountId, change] of delta) {
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: change } },
    });
  }

  // Budgets (monthly).
  await prisma.budget.createMany({
    data: [
      { walletId: wallet.id, categoryId: catId("Groceries"), amount: 10_000, period: "MONTHLY" },
      { walletId: wallet.id, categoryId: catId("Dining"), amount: 4_000, period: "MONTHLY" },
      { walletId: wallet.id, categoryId: catId("Transportation"), amount: 2_500, period: "MONTHLY" },
      { walletId: wallet.id, categoryId: catId("Utilities"), amount: 6_000, period: "MONTHLY" },
    ],
  });

  // Savings goals.
  await prisma.savingsGoal.createMany({
    data: [
      {
        walletId: wallet.id,
        name: "Emergency Fund",
        targetAmount: 200_000,
        currentAmount: 120_000,
        deadline: new Date(new Date().getFullYear() + 1, 11, 31),
      },
      {
        walletId: wallet.id,
        name: "Boracay Trip",
        targetAmount: 60_000,
        currentAmount: 22_500,
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 5, 1),
      },
    ],
  });

  console.log(`✓ Seeded demo user  →  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`✓ Wallet "${wallet.name}" with ${wallet.accounts.length} accounts and ${txns.length} transactions`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
