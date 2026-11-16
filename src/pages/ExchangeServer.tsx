import { useMemo } from "react";
import { Mail, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";
import { EmptyState } from "../components/common/EmptyState";
import { KpiCard } from "../components/common/KpiCard";
import { useApp } from "../state/AppContext";
import { calculateExchange } from "../engine/exchangeCalculator";
import { formatNumber } from "../utils/format";

export default function ExchangeServer() {
  const { current } = useApp();
  const result = useMemo(() => current ? calculateExchange(current.exchange) : null, [current]);

  if (!current) {
    return (
      <>
        <PageHeader title="Exchange Server" icon={<Mail className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  const ex = current.exchange;
  const dagMembers = ex.servers.filter(s => s.dagMember);
  const warnDag = ex.dag && dagMembers.length < 2;

  return (
    <>
      <PageHeader
        title="Exchange Server"
        subtitle={`${current.customer.name} — Exchange licensing & DAG`}
        icon={<Mail className="w-5 h-5" />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Exchange Servers" value={formatNumber(ex.servers.length)} />
        <KpiCard label="Mailbox Users" value={formatNumber(ex.mailboxUsers)} />
        <KpiCard label="DAG" value={ex.dag ? "Yes" : "No"} tone={ex.dag ? "success" : "default"} />
        <KpiCard label="Hybrid" value={ex.hybrid ? "Yes" : "No"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Server Licenses" value={formatNumber(result!.serverLicensesRequired)} tone="warn" />
        <KpiCard label="Standard Servers" value={formatNumber(result!.serverLicenseByEdition.standard)} />
        <KpiCard label="Enterprise Servers" value={formatNumber(result!.serverLicenseByEdition.enterprise)} />
        <KpiCard label="DAG Copies" value={formatNumber(result!.dagCopies)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <KpiCard label="Standard CAL" value={formatNumber(result!.standardCALRequired)} tone="warn" />
        <KpiCard label="Enterprise CAL" value={formatNumber(result!.enterpriseCALRequired)} tone="warn" />
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="p-3 border-b border-slate-200 font-semibold text-slate-900 flex items-center justify-between">
          <span>Exchange Servers</span>
          {warnDag && (
            <span className="badge-yellow flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> DAG requires ≥ 2 members</span>
          )}
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead><tr>
              <th>Name</th><th>Version</th><th>Edition</th><th>Type</th><th>Cores</th><th>DAG</th><th>Mailbox DBs</th><th>Status</th>
            </tr></thead>
            <tbody>
              {ex.servers.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-slate-900">{s.name}</td>
                  <td>{s.version}</td>
                  <td><span className="badge-gray">{s.edition}</span></td>
                  <td>{s.type}</td>
                  <td>{s.cores}</td>
                  <td>{s.dagMember ? <span className="badge-blue">Member</span> : <span className="badge-gray">—</span>}</td>
                  <td>{s.mailboxDatabases}</td>
                  <td><span className={s.status === "Active" ? "badge-green" : s.status === "Passive" ? "badge-yellow" : "badge-gray"}>{s.status}</span></td>
                </tr>
              ))}
              {ex.servers.length === 0 && (<tr><td colSpan={8} className="text-center py-6 text-slate-500">No Exchange servers in this assessment.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {ex.dag && (
        <div className="card p-4 mb-4">
          <h3 className="font-semibold text-slate-900 mb-3">DAG Configuration</h3>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 space-y-2">
              {dagMembers.length === 0 && <div className="text-sm text-amber-700">No servers are marked as DAG members.</div>}
              {dagMembers.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <div className="w-24 font-medium text-slate-800">{s.name}</div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="badge-blue">{s.status}</span>
                </div>
              ))}
            </div>
            <div className="w-full md:w-48 p-3 bg-brand-50 text-brand-700 rounded-lg text-center font-semibold">
              DAG ({dagMembers.length} members)
            </div>
          </div>
        </div>
      )}

      <Disclaimer />
    </>
  );
}
