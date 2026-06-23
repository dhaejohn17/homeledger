import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse a loose money string ("1,234.50", "₱310", "P 549") into a number. */
export function parseAmount(input: string | number | null | undefined): number {
  if (typeof input === "number") return input;
  if (!input) return NaN;
  const cleaned = String(input).replace(/[^0-9.\-]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

export function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
