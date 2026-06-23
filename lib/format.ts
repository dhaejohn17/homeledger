/** Formats a number as Philippine pesos, e.g. 12450 -> "₱12,450.00". */
export function formatPeso(
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/** Compact peso, e.g. 129070 -> "₱129k". */
export function formatPesoCompact(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Signed amount, prefixing positives with "+". */
export function formatSignedPeso(amount: number): string {
  const formatted = formatPeso(Math.abs(amount));
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

const DATE_FMT = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(date: Date | string): string {
  return DATE_FMT.format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
    typeof date === "string" ? new Date(date) : date,
  );
}
