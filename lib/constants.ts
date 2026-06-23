import type { AccountType, TransactionType, Period } from "@prisma/client";

export type CategorySeed = {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
};

/** Default category set for a new Philippine household wallet. */
export const DEFAULT_CATEGORIES: CategorySeed[] = [
  { name: "Groceries", type: "EXPENSE", icon: "ShoppingCart", color: "#1f7a4d" },
  { name: "Dining", type: "EXPENSE", icon: "UtensilsCrossed", color: "#b97e1f" },
  { name: "Transportation", type: "EXPENSE", icon: "Bus", color: "#3b6ea5" },
  { name: "Utilities", type: "EXPENSE", icon: "Plug", color: "#a8412a" },
  { name: "Rent", type: "EXPENSE", icon: "Home", color: "#7a5cad" },
  { name: "Health", type: "EXPENSE", icon: "HeartPulse", color: "#c0476b" },
  { name: "Entertainment", type: "EXPENSE", icon: "Clapperboard", color: "#d08a16" },
  { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "#2f8f8a" },
  { name: "Education", type: "EXPENSE", icon: "GraduationCap", color: "#4a6fa5" },
  { name: "Bills", type: "EXPENSE", icon: "ReceiptText", color: "#8a6d3b" },
  { name: "Other", type: "EXPENSE", icon: "Circle", color: "#7a7164" },
  { name: "Salary", type: "INCOME", icon: "Wallet", color: "#1f7a4d" },
  { name: "Business", type: "INCOME", icon: "Briefcase", color: "#15533a" },
  { name: "Gift", type: "INCOME", icon: "Gift", color: "#b97e1f" },
  { name: "Other Income", type: "INCOME", icon: "PlusCircle", color: "#3b6ea5" },
  { name: "Transfer", type: "TRANSFER", icon: "ArrowLeftRight", color: "#7a7164" },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank",
  EWALLET: "E-Wallet",
  CREDIT_CARD: "Credit Card",
  SAVINGS: "Savings",
};

export const TXN_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  TRANSFER: "Transfer",
};

export const PERIOD_LABELS: Record<Period, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

/** Accounts created automatically with a brand-new wallet. */
export const DEFAULT_ACCOUNTS: { name: string; type: AccountType }[] = [
  { name: "Cash", type: "CASH" },
  { name: "GCash", type: "EWALLET" },
];

/** Fallback palette for charts when a category has no stored color. */
export const CHART_PALETTE = [
  "#15533a",
  "#b97e1f",
  "#3b6ea5",
  "#a8412a",
  "#7a5cad",
  "#2f8f8a",
  "#c0476b",
  "#8a6d3b",
  "#4a6fa5",
  "#7a7164",
];
