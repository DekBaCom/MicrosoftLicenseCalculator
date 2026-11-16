import type { AHBResult, Assessment, LicenseInventoryItem } from "../types";
import { AHB } from "../data/licenseRules";

function ownedOf(inv: LicenseInventoryItem[], match: (i: LicenseInventoryItem) => boolean): number {
  return inv.filter((i) => i.softwareAssurance && match(i)).reduce((s, i) => s + i.quantityOwned, 0);
}

/**
 * Translate on-prem licenses with Software Assurance into Azure coverage.
 * Windows Server: 16 WS licenses with SA cover up to 2 Azure VMs (shared across both).
 * SQL Server: 1 Enterprise/Standard core with SA → 16 vCores (GP) or 4 vCores (BC).
 */
export function calculateAHB(a: Assessment): AHBResult {
  const env = a.environment;
  const notes: string[] = [];

  if (!env.azureHybridBenefit) {
    return {
      windowsVMsCoverableByAHB: 0,
      windowsLicensesConsumed: 0,
      sqlvCoresCoverableByAHB: 0,
      sqlLicensesConsumed: 0,
      notes: ["Azure Hybrid Benefit modeling is disabled in Environment."],
    };
  }

  const wsLicensesSA = ownedOf(
    a.inventory,
    (i) => i.product === "Windows Server Standard" || i.product === "Windows Server Datacenter"
  );
  const windowsVMsCoverableByAHB = Math.floor(
    wsLicensesSA / AHB.windowsLicensesPerVMGroup
  ) * AHB.windowsVMsPer16Licenses;

  if (wsLicensesSA === 0) {
    notes.push("No Windows Server licenses with Software Assurance found in inventory — AHB coverage = 0.");
  } else {
    notes.push(
      `${wsLicensesSA.toLocaleString()} WS licenses with SA → covers up to ${windowsVMsCoverableByAHB.toLocaleString()} Azure VMs.`
    );
  }

  // SQL Enterprise / Standard cores with SA
  const sqlEntCoresSA = ownedOf(a.inventory, (i) => i.product === "SQL Server Enterprise");
  const sqlStdCoresSA = ownedOf(a.inventory, (i) => i.product === "SQL Server Standard");

  const tier = env.azureSqlTier ?? "GeneralPurpose";
  const entFactor = tier === "GeneralPurpose" ? AHB.sqlEnterpriseCoreToGPvCores : AHB.sqlEnterpriseCoreToBCvCores;
  const stdFactor = tier === "GeneralPurpose" ? AHB.sqlStandardCoreToGPvCores : AHB.sqlStandardCoreToBCvCores;

  // Enterprise core → vCore ratios are expressed as "1 core → N vCores" in GP / "1 core → 4 vCores" in BC.
  // We interpret this as coverage: 1 SQL Ent core with SA covers up to `entFactor` vCores for GP SKUs.
  const sqlvCoresCoverableByAHB = sqlEntCoresSA * (entFactor >= 4 ? entFactor / 4 : 1) + sqlStdCoresSA * (stdFactor >= 4 ? stdFactor / 4 : 1);

  const sqlLicensesConsumed = sqlEntCoresSA + sqlStdCoresSA;

  if (sqlLicensesConsumed > 0) {
    notes.push(`SQL SA cores → ${sqlvCoresCoverableByAHB.toLocaleString()} vCores (${tier}).`);
  }

  return {
    windowsVMsCoverableByAHB,
    windowsLicensesConsumed: wsLicensesSA,
    sqlvCoresCoverableByAHB,
    sqlLicensesConsumed,
    notes,
  };
}
