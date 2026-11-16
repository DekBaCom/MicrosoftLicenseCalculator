import { useMemo } from "react";
import { FileText, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Disclaimer } from "../components/common/Disclaimer";
import { StatusBadge } from "../components/common/StatusBadge";
import { useApp } from "../state/AppContext";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { generateRecommendations } from "../engine/recommendationEngine";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { calculateExchange } from "../engine/exchangeCalculator";
import { calculateCost, calculateGapCost } from "../engine/costCalculator";
import { formatCurrency, formatDate, formatNumber } from "../utils/format";
import { exportReportPDF } from "../export/pdf";

export default function Reports() {
  const { current, pricing, settings } = useApp();

  const data = useMemo(() => {
    if (!current) return null;
    const gaps = analyzeGaps(current);
    const recs = generateRecommendations(current, gaps);
    const win = calculateWindowsLicensing(current.windowsServers);
    const cal = calculateWindowsCAL(current.windowsCAL);
    const rds = calculateRDSCAL(current.rds);
    const exch = calculateExchange(current.exchange);
    const cost = calculateCost({ assessment: current, pricing, currency: settings.defaultCurrency });
    const gapCost = calculateGapCost(gaps, pricing, settings.defaultCurrency);
    return { gaps, recs, win, cal, rds, exch, cost, gapCost };
  }, [current, pricing, settings]);

  if (!current || !data) {
    return (
      <>
        <PageHeader title="Reports" icon={<FileText className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`Assessment Report — ${current.customer.name}`}
        icon={<FileText className="w-5 h-5" />}
        actions={
          <>
            <button className="btn-secondary" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</button>
            <button className="btn-primary" onClick={() => exportReportPDF(current, data, settings.defaultCurrency)}>Export PDF</button>
          </>
        }
      />

      <div className="space-y-4 print:text-xs">
        {/* Executive Summary */}
        <Section title="Executive Summary">
          <p className="text-sm text-slate-700">
            This report summarizes the Microsoft on-premises licensing position for <strong>{current.customer.name}</strong>.
            {current.customer.numberOfUsers ? ` The customer has approximately ${formatNumber(current.customer.numberOfUsers)} users` : ""}
            {current.environment.physicalServers ? ` across ${formatNumber(current.environment.physicalServers)} physical servers and ${formatNumber(current.environment.virtualServers)} VMs.` : "."}
            {" "}The estimated total required license cost is <strong>{formatCurrency(data.cost.total, data.cost.currency)}</strong>,
            with a gap-closing cost of <strong>{formatCurrency(data.gapCost.total, data.gapCost.currency)}</strong>.
          </p>
        </Section>

        {/* Customer */}
        <Section title="Customer Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Kv k="Customer" v={current.customer.name} />
            <Kv k="Industry" v={current.customer.industry} />
            <Kv k="Country" v={current.customer.country} />
            <Kv k="Contact" v={current.customer.contactPerson} />
            <Kv k="Email" v={current.customer.email} />
            <Kv k="Users" v={formatNumber(current.customer.numberOfUsers || 0)} />
            <Kv k="Employees" v={formatNumber(current.customer.numberOfEmployees || 0)} />
            <Kv k="Locations" v={formatNumber(current.customer.numberOfLocations || 0)} />
            <Kv k="Assessment Date" v={formatDate(current.customer.assessmentDate)} />
            <Kv k="Owner" v={current.customer.assessmentOwner} />
          </div>
        </Section>

        {/* Environment */}
        <Section title="Current Environment">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Kv k="Physical Servers" v={current.environment.physicalServers} />
            <Kv k="Virtual Servers" v={current.environment.virtualServers} />
            <Kv k="Hypervisor" v={current.environment.hypervisor} />
            <Kv k="Cloud Provider" v={current.environment.cloudProvider} />
            <Kv k="Hybrid" v={current.environment.hybrid ? "Yes" : "No"} />
            <Kv k="Operating Systems" v={current.environment.operatingSystems.join(", ") || "—"} />
          </div>
        </Section>

        {/* Windows Server */}
        <Section title="Windows Server Assessment">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
            <Kv k="Total Physical Cores" v={formatNumber(data.win.totalPhysicalCores)} />
            <Kv k="Total Sockets" v={formatNumber(data.win.totalCpuSockets)} />
            <Kv k="Total VMs" v={formatNumber(data.win.totalVMs)} />
            <Kv k="Hosts" v={formatNumber(data.win.perServer.length)} />
          </div>
          <MiniTable headers={["Server", "Edition", "Required Cores", "Recommended"]} rows={data.win.perServer.map(r => [r.serverName, r.edition, formatNumber(r.requiredCoreLicenses), r.recommendedEdition])} />
        </Section>

        {/* CAL */}
        <Section title="Windows Server CAL">
          <MiniTable headers={["Metric", "Count"]} rows={[
            ["User CAL Required", formatNumber(data.cal.userCALRequired)],
            ["Device CAL Required", formatNumber(data.cal.deviceCALRequired)],
            ["Recommended Model", data.cal.recommendedModel],
          ]} />
          <p className="text-xs text-slate-600 mt-2">{data.cal.reasoning}</p>
        </Section>

        <Section title="RDS CAL">
          <MiniTable headers={["Metric", "Count"]} rows={[
            ["User CAL Required", formatNumber(data.rds.userCALRequired)],
            ["Device CAL Required", formatNumber(data.rds.deviceCALRequired)],
            ["Recommended Model", data.rds.recommendedModel],
          ]} />
          <p className="text-xs text-slate-600 mt-2">{data.rds.reasoning}</p>
        </Section>

        <Section title="Exchange Assessment">
          <MiniTable headers={["Metric", "Value"]} rows={[
            ["Exchange Servers", formatNumber(data.exch.serverLicensesRequired)],
            ["Standard Servers", formatNumber(data.exch.serverLicenseByEdition.standard)],
            ["Enterprise Servers", formatNumber(data.exch.serverLicenseByEdition.enterprise)],
            ["Standard CAL Required", formatNumber(data.exch.standardCALRequired)],
            ["Enterprise CAL Required", formatNumber(data.exch.enterpriseCALRequired)],
            ["DAG Copies", formatNumber(data.exch.dagCopies)],
          ]} />
        </Section>

        <Section title="License Inventory">
          <MiniTable headers={["Product", "Version", "Qty Owned", "Agreement", "SA", "Expiry"]} rows={current.inventory.map((i) => [i.product, i.version ?? "—", formatNumber(i.quantityOwned), i.agreement ?? "—", i.softwareAssurance ? "Yes" : "No", formatDate(i.expiryDate)])} />
        </Section>

        <Section title="License Gap">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="table min-w-[640px]">
              <thead><tr><th>Product</th><th className="text-right">Required</th><th className="text-right">Owned</th><th className="text-right">Gap</th><th>Status</th></tr></thead>
              <tbody>
                {data.gaps.map(g => (
                  <tr key={g.product}>
                    <td>{g.product}</td>
                    <td className="text-right">{formatNumber(g.required)}</td>
                    <td className="text-right">{formatNumber(g.owned)}</td>
                    <td className={`text-right font-semibold ${g.gap > 0 ? "text-red-600" : "text-slate-600"}`}>{formatNumber(g.gap)}</td>
                    <td><StatusBadge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Recommendations">
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            {data.recs.map((r) => (
              <li key={r.id}><strong>{r.product}</strong> — {r.action} <span className="text-xs text-slate-500">({r.priority} priority)</span></li>
            ))}
            {data.recs.length === 0 && <li className="list-none text-slate-500">No outstanding issues.</li>}
          </ol>
        </Section>

        <Section title="Cost Analysis">
          <MiniTable headers={["Product", "Quantity", "Unit Price", "Total"]} rows={data.cost.lines.map(l => [l.product, formatNumber(l.quantity), formatCurrency(l.unitPrice, l.currency), formatCurrency(l.total, l.currency)])} />
          <div className="text-right text-sm mt-2 font-semibold">Total: {formatCurrency(data.cost.total, data.cost.currency)}</div>
        </Section>

        <Section title="Conclusion">
          <p className="text-sm text-slate-700">
            This indicative assessment identifies a licensing gap of <strong>{formatNumber(data.gaps.reduce((s, g) => s + g.gap, 0))}</strong> units
            and an estimated <strong>{formatCurrency(data.gapCost.total, data.gapCost.currency)}</strong> required to close the gap at configured prices.
            A validated proposal should be prepared in collaboration with a Microsoft licensing specialist.
          </p>
        </Section>

        <Disclaimer />
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 break-inside-avoid">
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-900 text-right">{v ?? "—"}</span>
    </div>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="table min-w-[520px]">
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={headers.length} className="text-center text-slate-500 py-4">—</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
