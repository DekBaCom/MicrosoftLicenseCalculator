import type { AHBResult, Assessment, LicenseInventoryItem } from "../types";
import { AHB } from "../data/licenseRules";

function ownedSAOf(inv: LicenseInventoryItem[], match: (i: LicenseInventoryItem) => boolean): number {
  return inv.filter((i) => i.softwareAssurance && match(i)).reduce((s, i) => s + i.quantityOwned, 0);
}

/**
 * Translate on-prem licenses with Software Assurance into Azure coverage.
 *
 * Windows Server:
 *   - 16 WS core licenses with SA → up to 2 small Azure VMs (≤8 vCPU each) OR 1 larger VM (≤16 vCPU).
 *   - Standard is use-once (cannot stay on-prem AND Azure); Datacenter supports dual use.
 *
 * SQL Server (verified against Microsoft Learn / Azure Hybrid Benefit docs, Nov 2025):
 *   GP vCores = 1 × SqlStd_SA_cores + 4 × SqlEnt_SA_cores   (normalized core formula)
 *   BC vCores = GP vCores / 4                                (Business Critical = 4 NCs per vCore)
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

  // -------------------- Windows Server AHB --------------------
  const wsLicensesSA = ownedSAOf(
    a.inventory,
    (i) => i.product === "Windows Server Standard" || i.product === "Windows Server Datacenter"
  );
  const windowsVMsCoverableByAHB = Math.floor(
    wsLicensesSA / AHB.windowsLicensesPerVMGroup
  ) * AHB.windowsVMsPer16Licenses;

  if (wsLicensesSA === 0) {
    notes.push("No Windows Server licenses with Software Assurance found — AHB coverage = 0 VMs.");
  } else {
    notes.push(
      `${wsLicensesSA.toLocaleString()} WS core licenses with SA → covers up to ${windowsVMsCoverableByAHB.toLocaleString()} Azure VMs (≤8 vCPU each).`
    );
  }

  // -------------------- SQL Server AHB --------------------
  const sqlEntCoresSA = ownedSAOf(a.inventory, (i) => i.product === "SQL Server Enterprise");
  const sqlStdCoresSA = ownedSAOf(a.inventory, (i) => i.product === "SQL Server Standard");
  const sqlLicensesConsumed = sqlEntCoresSA + sqlStdCoresSA;

  const tier = env.azureSqlTier ?? "GeneralPurpose";

  // Normalized-core math from Microsoft Learn
  const entFactor = tier === "GeneralPurpose" ? AHB.sqlEnterpriseCoreToGPvCores : AHB.sqlEnterpriseCoreToBCvCores;
  const stdFactor = tier === "GeneralPurpose" ? AHB.sqlStandardCoreToGPvCores : AHB.sqlStandardCoreToBCvCores;

  const sqlvCoresCoverableByAHB = sqlEntCoresSA * entFactor + sqlStdCoresSA * stdFactor;

  if (sqlLicensesConsumed > 0) {
    notes.push(
      `${sqlLicensesConsumed.toLocaleString()} SQL cores with SA → ${Math.round(sqlvCoresCoverableByAHB).toLocaleString()} Azure SQL ${tier} vCores (Ent × ${entFactor} + Std × ${stdFactor}).`
    );
  } else {
    notes.push("No SQL Server licenses with SA — Azure SQL AHB coverage = 0.");
  }

  return {
    windowsVMsCoverableByAHB,
    windowsLicensesConsumed: wsLicensesSA,
    sqlvCoresCoverableByAHB,
    sqlLicensesConsumed,
    notes,
  };
}
