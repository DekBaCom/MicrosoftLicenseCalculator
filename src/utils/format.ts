import type { Currency } from "../types";

const currencyLocale: Record<Currency, string> = {
  THB: "th-TH",
  USD: "en-US",
  EUR: "de-DE",
};

export function formatNumber(n: number, digits = 0): string {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function formatCurrency(n: number, currency: Currency): string {
  if (!isFinite(n)) n = 0;
  try {
    return new Intl.NumberFormat(currencyLocale[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${formatNumber(n)}`;
  }
}

export function formatPercent(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}
