"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUserId, ACTIVE_WALLET_COOKIE, getActiveWalletId } from "@/lib/data";
import { assertWalletAccess, assertAccountAccess } from "@/lib/access";
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from "@/lib/constants";

export type ActionResult = { ok: boolean; error?: string };
const OK: ActionResult = { ok: true };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function refresh() {
  revalidatePath("/dashboard", "layout");
}

const amount = z.coerce.number().positive("Enter an amount greater than zero.");

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------
const walletSchema = z.object({
  name: z.string().trim().min(1, "Name your wallet.").max(60),
  type: z.enum(["PERSONAL", "SHARED"]),
  description: z.string().trim().max(160).optional(),
});

export async function createWallet(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = walletSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const wallet = await prisma.wallet.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description,
      ownerId: userId,
      accounts: { create: DEFAULT_ACCOUNTS.map((a) => ({ ...a, balance: 0 })) },
      categories: { create: DEFAULT_CATEGORIES },
    },
  });

  (await cookies()).set(ACTIVE_WALLET_COOKIE, wallet.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  refresh();
  return OK;
}

export async function setActiveWallet(walletId: string): Promise<void> {
  const userId = await requireUserId();
  await assertWalletAccess(userId, walletId);
  (await cookies()).set(ACTIVE_WALLET_COOKIE, walletId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  refresh();
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------
const accountSchema = z.object({
  name: z.string().trim().min(1, "Name the account.").max(60),
  type: z.enum(["CASH", "BANK", "EWALLET", "CREDIT_CARD", "SAVINGS"]),
  balance: z.coerce.number().default(0),
});

export async function createAccount(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const walletId = await getActiveWalletId(userId);
  if (!walletId) return fail("Create a wallet first.");
  await assertWalletAccess(userId, walletId);

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance") || 0,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.account.create({
    data: { walletId, name: parsed.data.name, type: parsed.data.type, balance: parsed.data.balance },
  });
  refresh();
  return OK;
}

export async function deleteAccount(accountId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await assertAccountAccess(userId, accountId);
  await prisma.account.delete({ where: { id: accountId } });
  refresh();
  return OK;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
const txnSchema = z.object({
  accountId: z.string().min(1, "Choose an account."),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount,
  categoryId: z.string().optional(),
  description: z.string().trim().max(120).optional(),
  date: z.string().optional(),
  toAccountId: z.string().optional(),
});

export async function createTransaction(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = txnSchema.safeParse({
    accountId: formData.get("accountId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    date: formData.get("date") || undefined,
    toAccountId: formData.get("toAccountId") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { accountId, type, amount: amt, categoryId, description, date, toAccountId } = parsed.data;
  const source = await assertAccountAccess(userId, accountId);
  const when = date ? new Date(date) : new Date();
  if (Number.isNaN(when.getTime())) return fail("That date doesn't look right.");

  try {
    if (type === "TRANSFER") {
      if (!toAccountId || toAccountId === accountId) {
        return fail("Pick a different destination account for the transfer.");
      }
      const dest = await assertAccountAccess(userId, toAccountId);
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            accountId,
            type: "TRANSFER",
            amount: amt,
            description: description ?? "Transfer",
            categoryId: categoryId || null,
            date: when,
          },
        }),
        prisma.account.update({ where: { id: source.id }, data: { balance: { decrement: amt } } }),
        prisma.account.update({ where: { id: dest.id }, data: { balance: { increment: amt } } }),
      ]);
    } else {
      const delta = type === "INCOME" ? amt : -amt;
      await prisma.$transaction([
        prisma.transaction.create({
          data: { accountId, type, amount: amt, description, categoryId: categoryId || null, date: when },
        }),
        prisma.account.update({ where: { id: source.id }, data: { balance: { increment: delta } } }),
      ]);
    }
  } catch {
    return fail("Couldn't save the transaction. Please try again.");
  }

  refresh();
  return OK;
}

export async function deleteTransaction(transactionId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const txn = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      account: { wallet: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } },
    },
  });
  if (!txn) return fail("Transaction not found.");

  // Reverse the balance effect (transfers only touched the source here).
  const delta = txn.type === "INCOME" ? -txn.amount : txn.amount;
  await prisma.$transaction([
    prisma.account.update({ where: { id: txn.accountId }, data: { balance: { increment: delta } } }),
    prisma.transaction.delete({ where: { id: txn.id } }),
  ]);
  refresh();
  return OK;
}

// ---------------------------------------------------------------------------
// Receipts → transaction
// ---------------------------------------------------------------------------
const receiptTxnSchema = z.object({
  accountId: z.string().min(1, "Choose an account."),
  amount,
  categoryId: z.string().optional(),
  description: z.string().trim().max(120).optional(),
  date: z.string().optional(),
  fileUrl: z.string().optional(),
  merchantName: z.string().optional(),
  rawOcrData: z.string().optional(),
});

/** Confirms a scanned receipt: writes an EXPENSE transaction + linked Receipt. */
export async function createTransactionFromReceipt(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = receiptTxnSchema.safeParse({
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    date: formData.get("date") || undefined,
    fileUrl: formData.get("fileUrl") || undefined,
    merchantName: formData.get("merchantName") || undefined,
    rawOcrData: formData.get("rawOcrData") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const d = parsed.data;
  const source = await assertAccountAccess(userId, d.accountId);
  const when = d.date ? new Date(d.date) : new Date();
  if (Number.isNaN(when.getTime())) return fail("That date doesn't look right.");

  try {
    await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          accountId: source.id,
          type: "EXPENSE",
          amount: d.amount,
          description: d.description ?? d.merchantName ?? "Receipt",
          categoryId: d.categoryId || null,
          date: when,
        },
      });
      await tx.account.update({
        where: { id: source.id },
        data: { balance: { decrement: d.amount } },
      });
      if (d.fileUrl) {
        await tx.receipt.create({
          data: {
            transactionId: txn.id,
            fileUrl: d.fileUrl,
            merchantName: d.merchantName || null,
            totalExtracted: d.amount,
            rawOcrData: d.rawOcrData || null,
            status: "REVIEWED",
          },
        });
      }
    });
  } catch {
    return fail("Couldn't save the receipt. Please try again.");
  }

  refresh();
  return OK;
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------
const budgetSchema = z.object({
  categoryId: z.string().optional(),
  amount,
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
});

export async function createBudget(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const walletId = await getActiveWalletId(userId);
  if (!walletId) return fail("Create a wallet first.");
  await assertWalletAccess(userId, walletId);

  const parsed = budgetSchema.safeParse({
    categoryId: formData.get("categoryId") || undefined,
    amount: formData.get("amount"),
    period: formData.get("period") || "MONTHLY",
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.budget.create({
    data: {
      walletId,
      categoryId: parsed.data.categoryId || null,
      amount: parsed.data.amount,
      period: parsed.data.period,
    },
  });
  refresh();
  return OK;
}

export async function deleteBudget(budgetId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({ where: { id: budgetId }, select: { walletId: true } });
  if (!budget) return fail("Budget not found.");
  await assertWalletAccess(userId, budget.walletId);
  await prisma.budget.delete({ where: { id: budgetId } });
  refresh();
  return OK;
}

// ---------------------------------------------------------------------------
// Savings goals
// ---------------------------------------------------------------------------
const goalSchema = z.object({
  name: z.string().trim().min(1, "Name your goal.").max(60),
  targetAmount: amount,
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
});

export async function createGoal(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const walletId = await getActiveWalletId(userId);
  if (!walletId) return fail("Create a wallet first.");
  await assertWalletAccess(userId, walletId);

  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || 0,
    deadline: formData.get("deadline") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.savingsGoal.create({
    data: {
      walletId,
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    },
  });
  refresh();
  return OK;
}

export async function contributeToGoal(goalId: string, value: number): Promise<ActionResult> {
  const userId = await requireUserId();
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId } });
  if (!goal) return fail("Goal not found.");
  await assertWalletAccess(userId, goal.walletId);
  if (!Number.isFinite(value) || value <= 0) return fail("Enter a positive amount.");
  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: { currentAmount: { increment: value } },
  });
  refresh();
  return OK;
}

export async function deleteGoal(goalId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId }, select: { walletId: true } });
  if (!goal) return fail("Goal not found.");
  await assertWalletAccess(userId, goal.walletId);
  await prisma.savingsGoal.delete({ where: { id: goalId } });
  refresh();
  return OK;
}
