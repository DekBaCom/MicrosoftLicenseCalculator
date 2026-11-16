import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Database, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Disclaimer } from "../components/common/Disclaimer";
import { KpiCard } from "../components/common/KpiCard";
import { ImportServersButton } from "../components/common/ImportServersButton";
import { useApp } from "../state/AppContext";
import { calculateSQL } from "../engine/sqlCalculator";
import { uid } from "../utils/id";
import { formatNumber } from "../utils/format";
import type { SQLAssessment, SQLEdition, SQLLicensingModel, SQLServer, ServerType } from "../types";

function emptySql(): SQLAssessment {
  return {
    servers: [],
    calUsers: 0,
    ownedServerCAL: 0,
    ownedStandardCores: 0,
    ownedEnterpriseCores: 0,
    ownedServerLicenses: 0,
  };
}

export default function SQLServerPage() {
  const { current, updateAssessment } = useApp();

  const sql = current?.sql ?? emptySql();
  const result = useMemo(() => calculateSQL(sql), [sql]);

  if (!current) {
    return (
      <>
        <PageHeader title="SQL Server" icon={<Database className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  const persist = (next: SQLAssessment) => updateAssessment({ ...current, sql: next });

  const addServer = () => persist({
    ...sql,
    servers: [
      ...sql.servers,
      {
        id: uid("sql"),
        name: `SQL-${sql.servers.length + 1}`,
        version: "SQL Server 2022",
        edition: "Standard",
        model: "PerCore",
        type: "VM",
        cpuSockets: 1,
        cores: 8,
        hasSoftwareAssurance: true,
        passiveFailover: false,
        role: "Application DB",
      },
    ],
  });
  const updateServer = (id: string, patch: Partial<SQLServer>) =>
    persist({ ...sql, servers: sql.servers.map(s => s.id === id ? { ...s, ...patch } : s) });
  const removeServer = (id: string) =>
    persist({ ...sql, servers: sql.servers.filter(s => s.id !== id) });

  return (
    <>
      <PageHeader
        title="SQL Server"
        subtitle="SQL Server licensing — per-core and Server+CAL models"
        icon={<Database className="w-5 h-5" />}
        actions={
          <>
            <ImportServersButton
              mode="sql"
              onImport={(imported) => persist({ ...sql, servers: [...sql.servers, ...imported] })}
            />
            <button className="btn-primary" onClick={addServer}><Plus className="w-4 h-4" /> Add SQL Server</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="SQL Servers" value={formatNumber(sql.servers.length)} />
        <KpiCard label="Standard Cores Req." value={formatNumber(result.totalStandardCoresRequired)} tone="warn" />
        <KpiCard label="Enterprise Cores Req." value={formatNumber(result.totalEnterpriseCoresRequired)} tone="warn" />
        <KpiCard label="CALs Required" value={formatNumber(result.calRequired)} />
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="p-3 border-b border-slate-200 font-semibold text-slate-900">SQL Server inventory</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[1100px]">
            <thead><tr>
              <th>Name</th><th>Version</th><th>Edition</th><th>Model</th><th>Type</th>
              <th>Sockets</th><th>Cores</th><th>SA</th><th>Passive Failover</th><th>Role</th><th></th>
            </tr></thead>
            <tbody>
              {sql.servers.map((s) => (
                <tr key={s.id}>
                  <td><input className="input !py-1" value={s.name} onChange={(e) => updateServer(s.id, { name: e.target.value })} /></td>
                  <td><input className="input !py-1 min-w-[140px]" value={s.version} onChange={(e) => updateServer(s.id, { version: e.target.value })} /></td>
                  <td>
                    <select className="select !py-1" value={s.edition} onChange={(e) => updateServer(s.id, { edition: e.target.value as SQLEdition })}>
                      <option>Standard</option><option>Enterprise</option>
                    </select>
                  </td>
                  <td>
                    <select className="select !py-1" value={s.model} onChange={(e) => updateServer(s.id, { model: e.target.value as SQLLicensingModel })}>
                      <option value="PerCore">Per-Core</option><option value="ServerCAL">Server+CAL</option>
                    </select>
                  </td>
                  <td>
                    <select className="select !py-1" value={s.type} onChange={(e) => updateServer(s.id, { type: e.target.value as ServerType })}>
                      <option>Physical</option><option>VM</option>
                    </select>
                  </td>
                  <td><input className="input !py-1 w-20" type="number" value={s.cpuSockets} onChange={(e) => updateServer(s.id, { cpuSockets: Number(e.target.value) })} /></td>
                  <td><input className="input !py-1 w-20" type="number" value={s.cores} onChange={(e) => updateServer(s.id, { cores: Number(e.target.value) })} /></td>
                  <td><input type="checkbox" checked={s.hasSoftwareAssurance} onChange={(e) => updateServer(s.id, { hasSoftwareAssurance: e.target.checked })} /></td>
                  <td><input type="checkbox" checked={s.passiveFailover} onChange={(e) => updateServer(s.id, { passiveFailover: e.target.checked })} /></td>
                  <td><input className="input !py-1 min-w-[140px]" value={s.role ?? ""} onChange={(e) => updateServer(s.id, { role: e.target.value })} /></td>
                  <td><button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => removeServer(s.id)}><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
              {sql.servers.length === 0 && (<tr><td colSpan={11} className="text-center py-6 text-slate-500">No SQL servers in this assessment.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-3">Server + CAL users</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Users accessing SQL (CAL)</label>
            <input type="number" className="input" value={sql.calUsers} onChange={(e) => persist({ ...sql, calUsers: Number(e.target.value) })} />
            <p className="text-xs text-slate-500 mt-1">Only applies when any SQL server uses the Server+CAL model.</p>
          </div>
          <div>
            <label className="label">Owned Standard Cores</label>
            <input type="number" className="input" value={sql.ownedStandardCores} onChange={(e) => persist({ ...sql, ownedStandardCores: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Owned Enterprise Cores</label>
            <input type="number" className="input" value={sql.ownedEnterpriseCores} onChange={(e) => persist({ ...sql, ownedEnterpriseCores: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Owned SQL CAL</label>
            <input type="number" className="input" value={sql.ownedServerCAL} onChange={(e) => persist({ ...sql, ownedServerCAL: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Owned SQL Server licenses (Standard)</label>
            <input type="number" className="input" value={sql.ownedServerLicenses} onChange={(e) => persist({ ...sql, ownedServerLicenses: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="p-3 border-b border-slate-200 font-semibold text-slate-900">Per-Server Calculation</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead><tr><th>Server</th><th>Edition</th><th>Model</th><th className="text-right">Required Cores</th><th>Notes</th></tr></thead>
            <tbody>
              {result.perServer.map((r) => (
                <tr key={r.serverId}>
                  <td className="font-medium text-slate-900">{r.serverName}</td>
                  <td><span className="badge-gray">{r.edition}</span></td>
                  <td>{r.model}</td>
                  <td className="text-right font-semibold">{formatNumber(r.requiredCoreLicenses)}</td>
                  <td className="text-xs text-slate-600">{r.notes.join(" ") || "—"}</td>
                </tr>
              ))}
              {result.perServer.length === 0 && (<tr><td colSpan={5} className="text-center py-6 text-slate-500">—</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <Disclaimer />
    </>
  );
}
