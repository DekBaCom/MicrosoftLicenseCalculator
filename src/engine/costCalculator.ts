import type {
  Assessment,
  CostLine,
  CostSummary,
  Currency,
  GapLine,
  ProductPricing,
} from "../types";
import { calculateWindowsLicensing } from "./windowsCalculator";
import { calculateWindowsCAL } from "./calCalculator";
import { calculateRDSCAL } from "./rdsCalculator";
import { calculateExchange } from "./exchangeCalculator";
import { calculateSQL } from "./sqlCalculator";

export interface CostInputs {
  assessment: Assessment;
  pricing: ProductPricing[];
  currency: Currency;
}

function findPrice(pricing: ProductPricing[], match: (p: ProductPricing) => boolean): ProductPricing | undefined {
  return pricing.find((p) => p.active && match(p));
}

/** Price per core: pricing is per 2-core pack, so unit per core = unitPrice/2. */
function perCoreFromPack(p: ProductPricing | undefined): number {
  if (!p) return 0;
  return p.unitPrice / 2;
}

function lineOrZero(product: string, quantity: number, p: ProductPricing | undefined, currency: Currency, perCore = false): CostLine {
  const unit = p ? (perCore ? perCoreFromPack(p) : p.unitPrice) : 0;
  return {
    product,
    quantity,
    unitPrice: unit,
    currency,
    total: unit * quantity,
  };
}

export function calculateCost({ assessment, pricing, currency }: CostInputs): CostSummary {
  const win = calculateWindowsLicensing(assessment.windowsServers);
  const cal = calculateWindowsCAL(assessment.windowsCAL);
  const rds = calculateRDSCAL(assessment.rds);
  const exch = calculateExchange(assessment.exchange);

  const priceStdCore = findPrice(pricing, (p) => p.sku === "WS-STD-2C");
  const priceDcCore = findPrice(pricing, (p) => p.sku === "WS-DC-2C");
  const priceWinUserCAL = findPrice(pricing, (p) => p.sku === "WS-UCAL");
  const priceWinDeviceCAL = findPrice(pricing, (p) => p.sku === "WS-DCAL");
  const priceRdsUserCAL = findPrice(pricing, (p) => p.sku === "RDS-UCAL");
  const priceRdsDeviceCAL = findPrice(pricing, (p) => p.sku === "RDS-DCAL");
  const priceExchStd = findPrice(pricing, (p) => p.sku === "EXCH-STD");
  const priceExchEnt = findPrice(pricing, (p) => p.sku === "EXCH-ENT");
  const priceExchStdCAL = findPrice(pricing, (p) => p.sku === "EXCH-SCAL");
  const priceExchEntCAL = findPrice(pricing, (p) => p.sku === "EXCH-ECAL");
  const priceSqlStdCore = findPrice(pricing, (p) => p.sku === "SQL-STD-2C");
  const priceSqlEntCore = findPrice(pricing, (p) => p.sku === "SQL-ENT-2C");
  const priceSqlServer = findPrice(pricing, (p) => p.sku === "SQL-STD-SRV");
  const priceSqlCAL = findPrice(pricing, (p) => p.sku === "SQL-CAL");

  const sql = calculateSQL(assessment.sql);

  const lines: CostLine[] = [
    lineOrZero("Windows Server Standard (per core)", win.requiredStandardCoreLicenses, priceStdCore, currency, true),
    lineOrZero("Windows Server Datacenter (per core)", win.requiredDatacenterCoreLicenses, priceDcCore, currency, true),
    cal.recommendedModel === "Device"
      ? lineOrZero("Windows Server Device CAL", cal.deviceCALRequired, priceWinDeviceCAL, currency)
      : lineOrZero("Windows Server User CAL", cal.userCALRequired, priceWinUserCAL, currency),
    rds.recommendedModel === "Device"
      ? lineOrZero("RDS Device CAL", rds.deviceCALRequired, priceRdsDeviceCAL, currency)
      : lineOrZero("RDS User CAL", rds.userCALRequired, priceRdsUserCAL, currency),
    lineOrZero("Exchange Server Standard", exch.serverLicenseByEdition.standard, priceExchStd, currency),
    lineOrZero("Exchange Server Enterprise", exch.serverLicenseByEdition.enterprise, priceExchEnt, currency),
    lineOrZero("Exchange Standard CAL", exch.standardCALRequired, priceExchStdCAL, currency),
    lineOrZero("Exchange Enterprise CAL", exch.enterpriseCALRequired, priceExchEntCAL, currency),
    lineOrZero("SQL Server Standard (per core)", sql.totalStandardCoresRequired, priceSqlStdCore, currency, true),
    lineOrZero("SQL Server Enterprise (per core)", sql.totalEnterpriseCoresRequired, priceSqlEntCore, currency, true),
    lineOrZero("SQL Server Standard (Server license)", sql.serverLicensesRequired, priceSqlServer, currency),
    lineOrZero("SQL Server CAL", sql.calRequired, priceSqlCAL, currency),
  ].filter((l) => l.quantity > 0);

  const total = lines.reduce((s, l) => s + l.total, 0);
  return { currency, lines, total };
}

/** Cost solely to close the license gap (purchase price). */
export function calculateGapCost(gaps: GapLine[], pricing: ProductPricing[], currency: Currency): CostSummary {
  const lines: CostLine[] = [];
  for (const g of gaps) {
    if (g.gap <= 0) continue;
    const p = matchGapToPricing(g.product, pricing);
    if (!p) continue;
    const unit = p.metric === "core" ? perCoreFromPack(p) : p.unitPrice;
    lines.push({
      product: g.product,
      quantity: g.gap,
      unitPrice: unit,
      currency,
      total: unit * g.gap,
    });
  }
  return { currency, lines, total: lines.reduce((s, l) => s + l.total, 0) };
}

function matchGapToPricing(product: string, pricing: ProductPricing[]): ProductPricing | undefined {
  const p = product.toLowerCase();
  if (p.includes("windows server standard")) return pricing.find((x) => x.sku === "WS-STD-2C");
  if (p.includes("windows server datacenter")) return pricing.find((x) => x.sku === "WS-DC-2C");
  if (p.includes("windows server cal") || p.includes("windows cal")) {
    return p.includes("device")
      ? pricing.find((x) => x.sku === "WS-DCAL")
      : pricing.find((x) => x.sku === "WS-UCAL");
  }
  if (p.includes("rds cal")) {
    return p.includes("device")
      ? pricing.find((x) => x.sku === "RDS-DCAL")
      : pricing.find((x) => x.sku === "RDS-UCAL");
  }
  if (p.includes("exchange server standard")) return pricing.find((x) => x.sku === "EXCH-STD");
  if (p.includes("exchange server enterprise")) return pricing.find((x) => x.sku === "EXCH-ENT");
  if (p.includes("exchange standard cal")) return pricing.find((x) => x.sku === "EXCH-SCAL");
  if (p.includes("exchange enterprise cal")) return pricing.find((x) => x.sku === "EXCH-ECAL");
  if (p.includes("sql server standard")) return pricing.find((x) => x.sku === "SQL-STD-2C");
  if (p.includes("sql server enterprise")) return pricing.find((x) => x.sku === "SQL-ENT-2C");
  if (p.includes("sql server cal")) return pricing.find((x) => x.sku === "SQL-CAL");
  return undefined;
}
