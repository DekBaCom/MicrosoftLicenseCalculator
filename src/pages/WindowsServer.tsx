import { useMemo } from "react";
import { Server } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";
import { EmptyState } from "../components/common/EmptyState";
import { KpiCard } from "../components/common/KpiCard";
import { useApp } from "../state/AppContext";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { formatNumber } from "../utils/format";
import { Link } from "react-router-dom";

export default function WindowsServer() {
  const { current } = useApp();
  const result = useMemo(() => current ? calculateWindowsLicensing(current.windowsServers) : null, [current]);

  if (!current) {
    return (
      <>
        <PageHeader title="Windows Server" icon={<Server className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Windows Server"
        subtitle={`${current.customer.name} — licensing calculation`}
        icon={<Server className="w-5 h-5" />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Physical Servers" value={formatNumber(current.windowsServers.filter(s => s.type === "Physical").length)} />
        <KpiCard label="Total Physical Cores" value={formatNumber(result!.totalPhysicalCores)} />
        <KpiCard label="Total CPU Sockets" value={formatNumber(result!.totalCpuSockets)} />
        <KpiCard label="Total VMs" value={formatNumber(result!.totalVMs)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <KpiCard label="Required Standard Cores" value={formatNumber(result!.requiredStandardCoreLicenses)} tone="warn" />
        <KpiCard label="Required Datacenter Cores" value={formatNumber(result!.requiredDatacenterCoreLicenses)} tone="warn" />
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="p-3 border-b border-slate-200 font-semibold text-slate-900">Per-Server Calculation</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead><tr><th>Server</th><th>Edition</th><th className="text-right">Required Cores</th><th>Recommended</th><th>Notes</th></tr></thead>
            <tbody>
              {result!.perServer.map((r) => (
                <tr key={r.serverId}>
                  <td className="font-medium text-slate-900">{r.serverName}</td>
                  <td><span className="badge-gray">{r.edition}</span></td>
                  <td className="text-right font-semibold">{formatNumber(r.requiredCoreLicenses)}</td>
                  <td>{r.recommendedEdition !== r.edition ? <span className="badge-yellow">{r.recommendedEdition}</span> : <span className="badge-green">{r.recommendedEdition}</span>}</td>
                  <td className="text-xs text-slate-600">{r.notes.join(" ") || "—"}</td>
                </tr>
              ))}
              {result!.perServer.length === 0 && (<tr><td colSpan={5} className="text-center text-slate-500 py-6">No physical hosts on this assessment.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <Disclaimer />
    </>
  );
}
