import * as XLSX from "xlsx";
import type { Assessment, Currency, ProductPricing } from "../types";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { generateRecommendations } from "../engine/recommendationEngine";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { calculateExchange } from "../engine/exchangeCalculator";
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
