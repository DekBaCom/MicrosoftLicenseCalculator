import type {
  Assessment,
  GapLine,
  GapStatus,
  LicenseInventoryItem,
} from "../types";
import { calculateWindowsLicensing } from "./windowsCalculator";
import { calculateWindowsCAL } from "./calCalculator";
import { calculateRDSCAL } from "./rdsCalculator";
import { calculateExchange } from "./exchangeCalculator";

function status(required: number, owned: number): GapStatus {
  if (required === 0 && owned === 0) return "Compliant";
  if (required === owned) return "Compliant";
  if (owned > required) return "Surplus";
  if (owned >= required * 0.9) return "Review";
  return "Gap";
}

function ownedOf(inv: LicenseInventoryItem[], match: (i: LicenseInventoryItem) => boolean): number {
  return inv.filter(match).reduce((s, i) => s + i.quantityOwned, 0);
}

export function analyzeGaps(a: Assessment): GapLine[] {
  const win = calculateWindowsLicensing(a.windowsServers);
  const cal = calculateWindowsCAL(a.windowsCAL);
  const rds = calculateRDSCAL(a.rds);
  const exch = calculateExchange(a.exchange);

  const lines: GapLine[] = [];

  // Windows Server Standard (cores)
  const stdCoresOwned = ownedOf(
    a.inventory,
    (i) => i.product === "Windows Server Standard"
  );
  lines.push(buildLine("Windows Server Standard (Cores)", win.requiredStandardCoreLicenses, stdCoresOwned));

  // Windows Server Datacenter (cores)
  const dcCoresOwned = ownedOf(
    a.inventory,
    (i) => i.product === "Windows Server Datacenter"
  );
  lines.push(buildLine("Windows Server Datacenter (Cores)", win.requiredDatacenterCoreLicenses, dcCoresOwned));

  // Windows CAL
  const winCalOwned = ownedOf(a.inventory, (i) => i.product === "Windows Server CAL");
  const winCalRequired =
    cal.recommendedModel === "Device" ? cal.deviceCALRequired : cal.userCALRequired;
  lines.push(buildLine(`Windows Server CAL (${cal.recommendedModel})`, winCalRequired, winCalOwned));

  // RDS CAL
  const rdsCalOwned = ownedOf(a.inventory, (i) => i.product === "RDS CAL");
  const rdsCalRequired =
    rds.recommendedModel === "Device" ? rds.deviceCALRequired : rds.userCALRequired;
  lines.push(buildLine(`RDS CAL (${rds.recommendedModel})`, rdsCalRequired, rdsCalOwned));

  // Exchange Server
  const exchStdServerOwned = ownedOf(a.inventory, (i) => i.product === "Exchange Server Standard");
  const exchEntServerOwned = ownedOf(a.inventory, (i) => i.product === "Exchange Server Enterprise");
  lines.push(
    buildLine(
      "Exchange Server Standard",
      exch.serverLicenseByEdition.standard,
      exchStdServerOwned
    )
  );
  lines.push(
    buildLine(
      "Exchange Server Enterprise",
      exch.serverLicenseByEdition.enterprise,
      exchEntServerOwned
    )
  );

  // Exchange CAL
  const exchStdCalOwned = ownedOf(a.inventory, (i) => i.product === "Exchange Standard CAL");
  const exchEntCalOwned = ownedOf(a.inventory, (i) => i.product === "Exchange Enterprise CAL");
  lines.push(buildLine("Exchange Standard CAL", exch.standardCALRequired, exchStdCalOwned));
  lines.push(buildLine("Exchange Enterprise CAL", exch.enterpriseCALRequired, exchEntCalOwned));

  return lines;
}

function buildLine(product: string, required: number, owned: number): GapLine {
  const gap = Math.max(0, required - owned);
  const surplus = Math.max(0, owned - required);
  return { product, required, owned, gap, surplus, status: status(required, owned) };
}
