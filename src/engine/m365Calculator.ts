import type { M365Assessment, M365CostSummary, M365CostLine, Currency } from "../types";
import { findPlan } from "../data/m365Plans";

// Rough FX conversion from USD baseline. Replace via Settings if needed.
export const FX_FROM_USD: Record<Currency, number> = {
  USD: 1,
  THB: 36,
  EUR: 0.92,
};

export interface M365CalcInput {
  m365: M365Assessment | undefined;
  currency: Currency;
}

export function calculateM365({ m365, currency }: M365CalcInput): M365CostSummary {
  const lines: M365CostLine[] = [];
  if (!m365) return { currency, lines, totalMonthly: 0, totalAnnual: 0 };

  for (const item of m365.licenses) {
    if (item.users <= 0) continue;
    const plan = findPlan(item.planId);
    if (!plan) continue;
    const usdMonthly = plan.pricePerUserMonth;
    const fx = FX_FROM_USD[currency] / FX_FROM_USD[plan.currency];
    const unit = usdMonthly * fx;
    const monthly = unit * item.users;
    const annual = monthly * 12;
    lines.push({
      planName: plan.name,
      users: item.users,
      unitPricePerMonth: unit,
      monthlyTotal: monthly,
      annualTotal: annual,
      currency,
    });
  }

  const totalMonthly = lines.reduce((s, l) => s + l.monthlyTotal, 0);
  const totalAnnual = lines.reduce((s, l) => s + l.annualTotal, 0);

  return { currency, lines, totalMonthly, totalAnnual };
}
