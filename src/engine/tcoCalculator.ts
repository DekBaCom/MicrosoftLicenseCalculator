import type { Assessment, Currency, ProductPricing } from "../types";
import { analyzeGaps } from "./gapAnalyzer";
import { calculateCost, calculateGapCost } from "./costCalculator";
import { calculateM365 } from "./m365Calculator";

export type TcoBasis = "required" | "gap";

export interface TcoInput {
  assessment: Assessment;
  pricing: ProductPricing[];
  currency: Currency;
  basis: TcoBasis;
  /** Annual Software Assurance cost as a fraction of license price (e.g. 0.25). */
  saRate: number;
  /** Include the first year of SA in the initial purchase. */
  includeSA: boolean;
  /** Reference date for SA-expiry warnings. */
  today?: Date;
}

export interface TcoYear {
  label: string;
  licenses: number;
  sa: number;
  m365: number;
  total: number;
}

export interface TcoWarning {
  severity: "High" | "Medium" | "Low";
  message: string;
}

export interface TcoResult {
  currency: Currency;
  years: TcoYear[];
  total: number;
  licenseBase: number;
  warnings: TcoWarning[];
}

const HORIZON_MONTHS = 36;

export function calculateTCO(input: TcoInput): TcoResult {
  const { assessment: a, pricing, currency, basis, saRate, includeSA } = input;
  const today = input.today ?? new Date();

  const licenseBase =
    basis === "gap"
      ? calculateGapCost(analyzeGaps(a), pricing, currency).total
      : calculateCost({ assessment: a, pricing, currency }).total;
  const saAnnual = licenseBase * saRate;
  const m365Annual = calculateM365({ m365: a.m365, currency }).totalAnnual;

  const years: TcoYear[] = [1, 2, 3].map((y) => {
    const licenses = y === 1 ? licenseBase : 0;
    const sa = y === 1 ? (includeSA ? saAnnual : 0) : saAnnual;
    return { label: `Year ${y}`, licenses, sa, m365: m365Annual, total: licenses + sa + m365Annual };
  });

  const warnings: TcoWarning[] = [];
  for (const item of a.inventory) {
    const label = item.product + (item.version ? ` ${item.version}` : "");
    if (!item.softwareAssurance) {
      if (item.quantityOwned > 0) {
        warnings.push({
          severity: "Low",
          message: `${label}: no Software Assurance — no new-version rights and no Azure Hybrid Benefit.`,
        });
      }
      continue;
    }
    if (!item.expiryDate) continue;
    const exp = new Date(item.expiryDate);
    if (Number.isNaN(exp.getTime())) continue;
    const months = (exp.getFullYear() - today.getFullYear()) * 12 + (exp.getMonth() - today.getMonth());
    if (months < 0) {
      warnings.push({ severity: "High", message: `${label}: SA expired on ${item.expiryDate} — renew to keep upgrade rights and AHB.` });
    } else if (months <= 6) {
      warnings.push({ severity: "High", message: `${label}: SA expires ${item.expiryDate} (in ${months} month${months === 1 ? "" : "s"}).` });
    } else if (months <= HORIZON_MONTHS) {
      warnings.push({ severity: "Medium", message: `${label}: SA expires ${item.expiryDate} — renewal falls inside the 3-year window.` });
    }
  }
  const order = { High: 0, Medium: 1, Low: 2 } as const;
  warnings.sort((x, y) => order[x.severity] - order[y.severity]);

  return {
    currency,
    years,
    total: years.reduce((s, y) => s + y.total, 0),
    licenseBase,
    warnings,
  };
}
