import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Assessment, Currency, GapLine, Recommendation } from "../types";
import type {
  WindowsCalculationResult,
  CALCalculationResult,
  RDSCalculationResult,
  ExchangeCalculationResult,
  CostSummary,
} from "../types";
import { formatCurrency, formatNumber } from "../utils/format";

export interface ReportData {
  gaps: GapLine[];
  recs: Recommendation[];
  win: WindowsCalculationResult;
  cal: CALCalculationResult;
  rds: RDSCalculationResult;
  exch: ExchangeCalculationResult;
  cost: CostSummary;
  gapCost: CostSummary;
}

export function exportReportPDF(a: Assessment, d: ReportData, currency: Currency) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  let y = 40;
  doc.setFontSize(18);
  doc.setTextColor("#1d4ed8");
  doc.text("Microsoft License Assessment", 40, y);
  y += 22;
  doc.setFontSize(11);
  doc.setTextColor("#111827");
  doc.text(`Customer: ${a.customer.name}`, 40, y);
  y += 14;
  doc.text(`Date: ${new Date().toLocaleDateString()}  |  Status: ${a.status}  |  Users: ${formatNumber(a.customer.numberOfUsers || 0)}`, 40, y);
  y += 20;

  doc.setFontSize(10);
  doc.setTextColor("#374151");
  const summary = `This report provides an indicative Microsoft on-prem licensing assessment for ${a.customer.name}. Total estimated required cost: ${formatCurrency(d.cost.total, currency)}. Estimated cost to close gap: ${formatCurrency(d.gapCost.total, currency)}.`;
  const lines = doc.splitTextToSize(summary, pageW - 80);
  doc.text(lines, 40, y);
  y += lines.length * 12 + 10;

  // Windows summary
  autoTable(doc, {
    startY: y,
    head: [["Windows Server", "Value"]],
    body: [
      ["Total Physical Cores", formatNumber(d.win.totalPhysicalCores)],
      ["Total CPU Sockets", formatNumber(d.win.totalCpuSockets)],
      ["Total VMs", formatNumber(d.win.totalVMs)],
      ["Required Standard Cores", formatNumber(d.win.requiredStandardCoreLicenses)],
      ["Required Datacenter Cores", formatNumber(d.win.requiredDatacenterCoreLicenses)],
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 9 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 14;

  // CAL
  autoTable(doc, {
    startY: y,
    head: [["CAL / RDS", "User", "Device", "Recommendation"]],
    body: [
      ["Windows Server CAL", formatNumber(d.cal.userCALRequired), formatNumber(d.cal.deviceCALRequired), d.cal.recommendedModel],
      ["RDS CAL", formatNumber(d.rds.userCALRequired), formatNumber(d.rds.deviceCALRequired), d.rds.recommendedModel],
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 9 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 14;

  // Exchange
  autoTable(doc, {
    startY: y,
    head: [["Exchange", "Value"]],
    body: [
      ["Server Licenses Required", formatNumber(d.exch.serverLicensesRequired)],
      ["Standard Servers", formatNumber(d.exch.serverLicenseByEdition.standard)],
      ["Enterprise Servers", formatNumber(d.exch.serverLicenseByEdition.enterprise)],
      ["Standard CAL", formatNumber(d.exch.standardCALRequired)],
      ["Enterprise CAL", formatNumber(d.exch.enterpriseCALRequired)],
      ["DAG Copies", formatNumber(d.exch.dagCopies)],
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 9 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 14;

  // Gap table
  autoTable(doc, {
    startY: y,
    head: [["Product", "Required", "Owned", "Gap", "Status"]],
    body: d.gaps.map((g) => [g.product, formatNumber(g.required), formatNumber(g.owned), formatNumber(g.gap), g.status]),
    theme: "grid",
    headStyles: { fillColor: [29, 78, 216] },
    styles: { fontSize: 9 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 14;

  // Cost table
  autoTable(doc, {
    startY: y,
    head: [["Product", "Qty", "Unit", "Total"]],
    body: d.cost.lines.map((l) => [l.product, formatNumber(l.quantity), formatCurrency(l.unitPrice, currency), formatCurrency(l.total, currency)]),
    foot: [["", "", "Total", formatCurrency(d.cost.total, currency)]],
    theme: "grid",
    headStyles: { fillColor: [29, 78, 216] },
    footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: "bold" },
    styles: { fontSize: 9 },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 14;

  // Recommendations
  if (d.recs.length) {
    autoTable(doc, {
      startY: y,
      head: [["Priority", "Product", "Action"]],
      body: d.recs.map((r) => [r.priority, r.product, r.action]),
      theme: "grid",
      headStyles: { fillColor: [29, 78, 216] },
      styles: { fontSize: 9 },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 14;
  }

  // Disclaimer at end
  if (y > 700) { doc.addPage(); y = 40; }
  doc.setFontSize(8);
  doc.setTextColor("#92400e");
  const disc = "Disclaimer: This tool provides an indicative Microsoft licensing assessment based on the information entered and configured licensing rules. It is not a substitute for Microsoft's official Product Terms or licensing agreement.";
  const dl = doc.splitTextToSize(disc, pageW - 80);
  doc.text(dl, 40, y);

  const safeName = (a.customer.name || "assessment").replace(/[^a-z0-9\-_]+/gi, "_");
  doc.save(`${safeName}_license_assessment.pdf`);
}
