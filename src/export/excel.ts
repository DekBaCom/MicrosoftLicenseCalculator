import * as XLSX from "xlsx";
import type { Assessment, Currency, ProductPricing } from "../types";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { generateRecommendations } from "../engine/recommendationEngine";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { calculateExchange } from "../engine/exchangeCalculator";
import { calculateSQL } from "../engine/sqlCalculator";
import { calculateAHB } from "../engine/ahbCalculator";
import { calculateM365 } from "../engine/m365Calculator";
import { calculateWindows11 } from "../engine/windows11Calculator";
import { calculateCost } from "../engine/costCalculator";

function toSheet(data: Record<string, unknown>[]): XLSX.WorkSheet {
  return XLSX.utils.json_to_sheet(data);
}

export function exportAssessmentXLSX(
  a: Assessment,
  pricing: ProductPricing[],
  currency: Currency
) {
  const win = calculateWindowsLicensing(a.windowsServers);
  const cal = calculateWindowsCAL(a.windowsCAL);
  const rds = calculateRDSCAL(a.rds);
  const exch = calculateExchange(a.exchange);
  const gaps = analyzeGaps(a);
  const recs = generateRecommendations(a, gaps);
  const cost = calculateCost({ assessment: a, pricing, currency });

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, toSheet([
    { Metric: "Customer", Value: a.customer.name },
    { Metric: "Industry", Value: a.customer.industry ?? "" },
    { Metric: "Country", Value: a.customer.country ?? "" },
    { Metric: "Users", Value: a.customer.numberOfUsers ?? 0 },
    { Metric: "Employees", Value: a.customer.numberOfEmployees ?? 0 },
    { Metric: "Physical Servers", Value: a.environment.physicalServers },
    { Metric: "Virtual Servers", Value: a.environment.virtualServers },
    { Metric: "Exchange Servers", Value: a.exchange.servers.length },
    { Metric: "Mailbox Users", Value: a.exchange.mailboxUsers },
    { Metric: "DAG", Value: a.exchange.dag ? "Yes" : "No" },
    { Metric: "Total Required Cost", Value: `${currency} ${cost.total.toFixed(0)}` },
  ]), "Summary");

  XLSX.utils.book_append_sheet(wb, toSheet([{ ...a.customer }]), "Customer");

  XLSX.utils.book_append_sheet(wb, toSheet(a.windowsServers.map((s) => ({ ...s }))), "Servers");

  XLSX.utils.book_append_sheet(wb, toSheet([
    { Metric: "Total Physical Cores", Value: win.totalPhysicalCores },
    { Metric: "Total Sockets", Value: win.totalCpuSockets },
    { Metric: "Total VMs", Value: win.totalVMs },
    { Metric: "Required Standard Cores", Value: win.requiredStandardCoreLicenses },
    { Metric: "Required Datacenter Cores", Value: win.requiredDatacenterCoreLicenses },
  ]), "Windows Licensing");

  XLSX.utils.book_append_sheet(wb, toSheet([
    { Metric: "User CAL Required", Value: cal.userCALRequired },
    { Metric: "Device CAL Required", Value: cal.deviceCALRequired },
    { Metric: "Recommended Model", Value: cal.recommendedModel },
    { Metric: "Reasoning", Value: cal.reasoning },
  ]), "Windows CAL");

  XLSX.utils.book_append_sheet(wb, toSheet([
    { Metric: "User CAL Required", Value: rds.userCALRequired },
    { Metric: "Device CAL Required", Value: rds.deviceCALRequired },
    { Metric: "Recommended Model", Value: rds.recommendedModel },
    { Metric: "Reasoning", Value: rds.reasoning },
  ]), "RDS CAL");

  XLSX.utils.book_append_sheet(wb, toSheet(a.exchange.servers.map((s) => ({ ...s }))), "Exchange Servers");

  XLSX.utils.book_append_sheet(wb, toSheet([
    { Metric: "Server Licenses Required", Value: exch.serverLicensesRequired },
    { Metric: "Standard Servers", Value: exch.serverLicenseByEdition.standard },
    { Metric: "Enterprise Servers", Value: exch.serverLicenseByEdition.enterprise },
    { Metric: "Standard CAL", Value: exch.standardCALRequired },
    { Metric: "Enterprise CAL", Value: exch.enterpriseCALRequired },
    { Metric: "DAG Copies", Value: exch.dagCopies },
  ]), "Exchange Licensing");

  // SQL
  const sql = calculateSQL(a.sql);
  XLSX.utils.book_append_sheet(wb, toSheet((a.sql?.servers ?? []).map((s) => ({ ...s }))), "SQL Servers");
  XLSX.utils.book_append_sheet(wb, toSheet([
    { Metric: "Standard Cores Required", Value: sql.totalStandardCoresRequired },
    { Metric: "Enterprise Cores Required", Value: sql.totalEnterpriseCoresRequired },
    { Metric: "Server Licenses Required", Value: sql.serverLicensesRequired },
    { Metric: "CAL Required", Value: sql.calRequired },
  ]), "SQL Licensing");

  // Microsoft 365
  const m365 = calculateM365({ m365: a.m365, currency });
  if (m365.lines.length) {
    XLSX.utils.book_append_sheet(wb, toSheet(m365.lines.map((l) => ({ ...l }))), "Microsoft 365");
  }

  // Windows 11
  if (a.windows11) {
    const w11 = calculateWindows11(a.windows11, currency);
    XLSX.utils.book_append_sheet(wb, toSheet([
      { Metric: "Target Edition", Value: a.windows11.targetEdition },
      { Metric: "Total Devices", Value: a.windows11.totalDevices },
      { Metric: "Already on Windows 11", Value: w11.alreadyOnWindows11 },
      { Metric: "In-place Upgrade Ready", Value: w11.inPlaceUpgrade },
      { Metric: "Need Replacement", Value: w11.needReplacement },
      { Metric: "Enterprise Users", Value: w11.enterpriseUsersRequired },
      { Metric: "Annual Cost", Value: `${currency} ${w11.annualTotal.toFixed(0)}` },
    ]), "Windows 11");
  }

  // AHB
  const ahb = calculateAHB(a);
  XLSX.utils.book_append_sheet(wb, toSheet([
    { Metric: "Enabled", Value: a.environment.azureHybridBenefit ? "Yes" : "No" },
    { Metric: "Windows VMs Covered", Value: ahb.windowsVMsCoverableByAHB },
    { Metric: "Windows SA Licenses Consumed", Value: ahb.windowsLicensesConsumed },
    { Metric: "SQL vCores Covered", Value: Math.round(ahb.sqlvCoresCoverableByAHB) },
    { Metric: "SQL SA Licenses Consumed", Value: ahb.sqlLicensesConsumed },
    { Metric: "Target Windows vCores", Value: a.environment.azureWindowsVMvCores ?? 0 },
    { Metric: "Target SQL vCores", Value: a.environment.azureSqlVCores ?? 0 },
    { Metric: "SQL Tier", Value: a.environment.azureSqlTier ?? "GeneralPurpose" },
  ]), "Azure Hybrid Benefit");

  XLSX.utils.book_append_sheet(wb, toSheet(a.inventory.map((i) => ({ ...i }))), "Current License");

  XLSX.utils.book_append_sheet(wb, toSheet(gaps.map((g) => ({ ...g }))), "License Gap");

  XLSX.utils.book_append_sheet(wb, toSheet(recs.map((r) => ({ ...r }))), "Recommendations");

  XLSX.utils.book_append_sheet(wb, toSheet(cost.lines.map((l) => ({ ...l }))), "Cost Analysis");

  const safeName = (a.customer.name || "assessment").replace(/[^a-z0-9\-_]+/gi, "_");
  XLSX.writeFile(wb, `${safeName}_license_assessment.xlsx`);
}

export function exportTableCSV<T extends object>(rows: T[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows as any);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
