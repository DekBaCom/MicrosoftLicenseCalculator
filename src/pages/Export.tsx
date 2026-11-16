import { useMemo } from "react";
import { FileDown, FileSpreadsheet, FileText, FileCode } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Disclaimer } from "../components/common/Disclaimer";
import { useApp } from "../state/AppContext";
import { exportAssessmentXLSX, exportTableCSV } from "../export/excel";
import { exportReportPDF } from "../export/pdf";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { generateRecommendations } from "../engine/recommendationEngine";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { calculateExchange } from "../engine/exchangeCalculator";
import { calculateCost, calculateGapCost } from "../engine/costCalculator";

export default function Export() {
  const { current, pricing, settings } = useApp();

  const data = useMemo(() => {
    if (!current) return null;
    const gaps = analyzeGaps(current);
    return {
      gaps,
      recs: generateRecommendations(current, gaps),
      win: calculateWindowsLicensing(current.windowsServers),
      cal: calculateWindowsCAL(current.windowsCAL),
      rds: calculateRDSCAL(current.rds),
      exch: calculateExchange(current.exchange),
      cost: calculateCost({ assessment: current, pricing, currency: settings.defaultCurrency }),
      gapCost: calculateGapCost(gaps, pricing, settings.defaultCurrency),
    };
  }, [current, pricing, settings]);

  if (!current || !data) {
    return (
      <>
        <PageHeader title="Export" icon={<FileDown className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Export"
        subtitle={`Download assessment artifacts for ${current.customer.name}`}
        icon={<FileDown className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <ExportCard
          icon={<FileSpreadsheet className="w-8 h-8 text-emerald-600" />}
          title="Excel Workbook"
          desc="Multi-sheet workbook with Summary, Servers, Licensing, CAL, RDS, Exchange, Inventory, Gap, Recommendations, Cost."
          action={<button className="btn-primary" onClick={() => exportAssessmentXLSX(current, pricing, settings.defaultCurrency)}>Download .xlsx</button>}
        />
        <ExportCard
          icon={<FileText className="w-8 h-8 text-red-600" />}
          title="PDF Report"
          desc="Professional presentation-ready report including executive summary and licensing tables."
          action={<button className="btn-primary" onClick={() => exportReportPDF(current, data, settings.defaultCurrency)}>Download .pdf</button>}
        />
        <ExportCard
          icon={<FileCode className="w-8 h-8 text-brand-700" />}
          title="JSON Backup"
          desc="Export the full assessment as JSON for backup, archive or sharing."
          action={
            <button
              className="btn-primary"
              onClick={() => {
                const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${(current.customer.name || "assessment").replace(/[^a-z0-9\-_]+/gi, "_")}.json`;
                a.click();
              }}
            >
              Download .json
            </button>
          }
        />
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-slate-900 mb-3">CSV exports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button className="btn-secondary" onClick={() => exportTableCSV(current.windowsServers, "windows_servers.csv")}>Windows Servers</button>
          <button className="btn-secondary" onClick={() => exportTableCSV(current.exchange.servers, "exchange_servers.csv")}>Exchange Servers</button>
          <button className="btn-secondary" onClick={() => exportTableCSV(current.inventory, "license_inventory.csv")}>License Inventory</button>
          <button className="btn-secondary" onClick={() => exportTableCSV(data.gaps as any, "license_gap.csv")}>License Gap</button>
          <button className="btn-secondary" onClick={() => exportTableCSV(data.cost.lines as any, "cost_analysis.csv")}>Cost Analysis</button>
          <button className="btn-secondary" onClick={() => exportTableCSV(data.recs as any, "recommendations.csv")}>Recommendations</button>
        </div>
      </div>

      <div className="mt-4"><Disclaimer /></div>
    </>
  );
}

function ExportCard({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div>{icon}</div>
        <div>
          <div className="font-semibold text-slate-900">{title}</div>
          <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
      </div>
      <div className="mt-auto">{action}</div>
    </div>
  );
}
