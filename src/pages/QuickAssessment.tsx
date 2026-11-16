import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Zap, Server, Mail, Users, Cloud, Monitor, Plus, Trash2, Save } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { KpiCard } from "../components/common/KpiCard";
import { Disclaimer } from "../components/common/Disclaimer";
import { useApp } from "../state/AppContext";
import { buildBlankAssessment } from "../data/blankAssessment";
import { M365_PLANS } from "../data/m365Plans";
import { WINDOWS11_EDITIONS, WINDOWS11_REQUIREMENTS } from "../data/windows11";
import { calculateCost } from "../engine/costCalculator";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { calculateExchange } from "../engine/exchangeCalculator";
import { calculateM365 } from "../engine/m365Calculator";
import { calculateWindows11 } from "../engine/windows11Calculator";
import { formatCurrency, formatNumber } from "../utils/format";
import { uid } from "../utils/id";
import type {
  Assessment,
  CALAccessType,
  ExchangeCALType,
  ExchangeEdition,
  M365LineItem,
  M365PlanId,
  Windows11Assessment,
  WindowsEdition,
  WindowsServer,
} from "../types";

type Scope = "server" | "exchange" | "cal" | "m365" | "win11";

const SCOPES: { id: Scope; label: string; desc: string; icon: typeof Server }[] = [
  { id: "server", label: "Windows Server", desc: "Hosts, cores, editions", icon: Server },
  { id: "exchange", label: "Exchange", desc: "Servers, DAG, CALs", icon: Mail },
  { id: "cal", label: "CAL / RDS", desc: "Windows & RDS CALs", icon: Users },
  { id: "m365", label: "Microsoft 365", desc: "Cloud plans & cost", icon: Cloud },
  { id: "win11", label: "Windows 11", desc: "Upgrade readiness", icon: Monitor },
];

interface HostRow {
  id: string;
  name: string;
  cpuSockets: number;
  coresPerCpu: number;
  edition: WindowsEdition;
  vmCount: number;
}

const num = (v: string) => Math.max(0, Number(v) || 0);

function newHost(n: number): HostRow {
  return { id: uid("host"), name: `HOST-${String(n).padStart(2, "0")}`, cpuSockets: 2, coresPerCpu: 16, edition: "Standard", vmCount: 2 };
}

export default function QuickAssessment() {
  const { pricing, settings, createAssessment } = useApp();
  const navigate = useNavigate();
  const currency = settings.defaultCurrency;

  const [scopes, setScopes] = useState<Set<Scope>>(new Set(["server"]));
  const [customer, setCustomer] = useState("");

  const [hosts, setHosts] = useState<HostRow[]>([newHost(1)]);

  const [exServers, setExServers] = useState(1);
  const [exEdition, setExEdition] = useState<ExchangeEdition>("Standard");
  const [exMailboxes, setExMailboxes] = useState(100);
  const [exDag, setExDag] = useState(false);
  const [exCal, setExCal] = useState<ExchangeCALType>("Standard");

  const [calUsers, setCalUsers] = useState(100);
  const [calDevices, setCalDevices] = useState(100);
  const [calAccess, setCalAccess] = useState<CALAccessType>("User");
  const [rdsUsers, setRdsUsers] = useState(0);
  const [rdsDevices, setRdsDevices] = useState(0);

  const [m365, setM365] = useState<M365LineItem[]>([{ planId: "m365-e3", users: 100 }]);

  const [win11, setWin11] = useState<Windows11Assessment>({
    totalDevices: 100,
    devicesOnWindows10: 60,
    devicesHardwareReady: 40,
    targetEdition: "Pro",
    users: 100,
  });

  const has = (s: Scope) => scopes.has(s);
  const toggle = (s: Scope) =>
    setScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const assessment = useMemo<Assessment>(() => {
    const a = buildBlankAssessment();
    a.customer.name = customer.trim() || "Quick assessment";
    a.customer.assessmentDate = new Date().toISOString().slice(0, 10);

    if (scopes.has("server")) {
      a.windowsServers = hosts.map<WindowsServer>((h) => ({
        id: h.id,
        name: h.name,
        type: "Physical",
        cpuSockets: h.cpuSockets,
        coresPerCpu: h.coresPerCpu,
        totalCores: h.cpuSockets * h.coresPerCpu,
        version: "Windows Server 2022",
        edition: h.edition,
        vmCount: h.vmCount,
        ha: false,
      }));
      a.environment.physicalServers = hosts.length;
      a.environment.virtualServers = hosts.reduce((s, h) => s + h.vmCount, 0);
    }
    if (scopes.has("exchange")) {
      a.exchange = {
        ...a.exchange,
        mailboxUsers: exMailboxes,
        dag: exDag,
        highAvailability: exDag,
        calType: exCal,
        servers: Array.from({ length: exServers }, (_, i) => ({
          id: uid("exch"),
          name: `EXCH-${String(i + 1).padStart(2, "0")}`,
          version: "Exchange 2019",
          edition: exEdition,
          type: "Physical",
          cpuSockets: 2,
          cores: 16,
          dagMember: exDag,
          mailboxDatabases: 2,
          status: "Active",
        })),
      };
    }
    if (scopes.has("cal")) {
      a.windowsCAL = { users: calUsers, devices: calDevices, accessType: calAccess, owned: { userCAL: 0, deviceCAL: 0 } };
      a.rds = {
        rdsUsers,
        rdsDevices,
        accessType: calAccess,
        concurrentUsers: Math.max(rdsUsers, rdsDevices),
        owned: { userCAL: 0, deviceCAL: 0 },
      };
      a.customer.numberOfUsers = calUsers;
    }
    if (scopes.has("m365")) a.m365 = { licenses: m365, annualBilling: true };
    if (scopes.has("win11")) a.windows11 = win11;
    return a;
  }, [scopes, customer, hosts, exServers, exEdition, exMailboxes, exDag, exCal, calUsers, calDevices, calAccess, rdsUsers, rdsDevices, m365, win11]);

  const result = useMemo(() => {
    const cost = calculateCost({ assessment, pricing, currency });
    return {
      cost,
      win: calculateWindowsLicensing(assessment.windowsServers),
      cal: calculateWindowsCAL(assessment.windowsCAL),
      rds: calculateRDSCAL(assessment.rds),
      exch: calculateExchange(assessment.exchange),
      m365: calculateM365({ m365: assessment.m365, currency }),
      w11: calculateWindows11(assessment.windows11, currency),
    };
  }, [assessment, pricing, currency]);

  const annual = result.m365.totalAnnual + result.w11.annualTotal;
  const costLinesFor = (scope: Scope) => {
    const match: Record<Scope, (p: string) => boolean> = {
      server: (p) => p.startsWith("Windows Server Standard") || p.startsWith("Windows Server Datacenter"),
      exchange: (p) => p.startsWith("Exchange"),
      cal: (p) => p.includes("CAL") && !p.startsWith("Exchange") && !p.startsWith("SQL"),
      m365: () => false,
      win11: () => false,
    };
    return result.cost.lines.filter((l) => match[scope](l.product));
  };

  const save = () => {
    if (scopes.size === 0) return;
    createAssessment(assessment);
    navigate("/");
  };

  return (
    <>
      <PageHeader
        title="Quick Assessment"
        subtitle="Pick only the areas you need, enter a few numbers, and get an instant licensing estimate"
        icon={<Zap className="w-5 h-5" />}
        actions={
          <button className="btn-primary" onClick={save} disabled={scopes.size === 0}>
            <Save className="w-4 h-4" /> Save as assessment
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {SCOPES.map((s) => {
          const on = has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              aria-pressed={on}
              className={clsx(
                "card p-3 text-left transition-colors border-2",
                on ? "!border-brand-600 bg-brand-50" : "hover:bg-slate-50"
              )}
            >
              <s.icon className={clsx("w-5 h-5 mb-1.5", on ? "text-brand-700" : "text-slate-500")} />
              <div className="font-semibold text-sm text-slate-900">{s.label}</div>
              <div className="text-[11px] text-slate-500">{s.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="card p-4 mb-4 max-w-xl">
        <label className="label">Customer name (optional)</label>
        <input className="input" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Contoso Ltd." />
      </div>

      {scopes.size === 0 && (
        <div className="card p-6 text-center text-slate-500 mb-4">Select at least one area above to start.</div>
      )}

      {has("server") && (
        <Section title="Windows Server" icon={<Server className="w-4 h-4" />}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="table min-w-[640px]">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Sockets</th>
                  <th>Cores / CPU</th>
                  <th>Edition</th>
                  <th>VMs on host</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((h) => {
                  const patch = (p: Partial<HostRow>) => setHosts(hosts.map((x) => (x.id === h.id ? { ...x, ...p } : x)));
                  return (
                    <tr key={h.id}>
                      <td><input className="input !py-1" value={h.name} onChange={(e) => patch({ name: e.target.value })} /></td>
                      <td><input type="number" min={1} className="input !py-1 w-20" value={h.cpuSockets} onChange={(e) => patch({ cpuSockets: Math.max(1, num(e.target.value)) })} /></td>
                      <td><input type="number" min={1} className="input !py-1 w-20" value={h.coresPerCpu} onChange={(e) => patch({ coresPerCpu: Math.max(1, num(e.target.value)) })} /></td>
                      <td>
                        <select className="select !py-1" value={h.edition} onChange={(e) => patch({ edition: e.target.value as WindowsEdition })}>
                          <option>Standard</option>
                          <option>Datacenter</option>
                          <option>Essentials</option>
                        </select>
                      </td>
                      <td><input type="number" min={0} className="input !py-1 w-20" value={h.vmCount} onChange={(e) => patch({ vmCount: num(e.target.value) })} /></td>
                      <td>
                        <button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => setHosts(hosts.filter((x) => x.id !== h.id))} aria-label="Remove host">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className="btn-secondary mt-3" onClick={() => setHosts([...hosts, newHost(hosts.length + 1)])}>
            <Plus className="w-4 h-4" /> Add host
          </button>
          <ResultBox
            lines={[
              `${formatNumber(result.win.requiredStandardCoreLicenses)} Standard core licenses`,
              `${formatNumber(result.win.requiredDatacenterCoreLicenses)} Datacenter core licenses`,
              `${formatNumber(result.win.totalPhysicalCores)} physical cores · ${formatNumber(result.win.totalVMs)} VMs`,
            ]}
            cost={costLinesFor("server")}
            currency={currency}
          />
        </Section>
      )}

      {has("exchange") && (
        <Section title="Exchange Server" icon={<Mail className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Field label="Servers">
              <input type="number" min={0} className="input" value={exServers} onChange={(e) => setExServers(num(e.target.value))} />
            </Field>
            <Field label="Server edition">
              <select className="select" value={exEdition} onChange={(e) => setExEdition(e.target.value as ExchangeEdition)}>
                <option>Standard</option>
                <option>Enterprise</option>
              </select>
            </Field>
            <Field label="Mailbox users">
              <input type="number" min={0} className="input" value={exMailboxes} onChange={(e) => setExMailboxes(num(e.target.value))} />
            </Field>
            <Field label="CAL type">
              <select className="select" value={exCal} onChange={(e) => setExCal(e.target.value as ExchangeCALType)}>
                <option value="Standard">Standard</option>
                <option value="Enterprise">Standard + Enterprise</option>
                <option value="StandardPlusEnterprise">Mixed (50% Enterprise)</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:mt-6">
              <input type="checkbox" checked={exDag} onChange={(e) => setExDag(e.target.checked)} /> DAG
            </label>
          </div>
          <ResultBox
            lines={[
              `${formatNumber(result.exch.serverLicensesRequired)} server licenses (${result.exch.serverLicenseByEdition.standard} Std / ${result.exch.serverLicenseByEdition.enterprise} Ent)`,
              `${formatNumber(result.exch.standardCALRequired)} Standard CAL · ${formatNumber(result.exch.enterpriseCALRequired)} Enterprise CAL`,
            ]}
            cost={costLinesFor("exchange")}
            currency={currency}
          />
        </Section>
      )}

      {has("cal") && (
        <Section title="Windows Server CAL / RDS CAL" icon={<Users className="w-4 h-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Field label="Users">
              <input type="number" min={0} className="input" value={calUsers} onChange={(e) => setCalUsers(num(e.target.value))} />
            </Field>
            <Field label="Devices">
              <input type="number" min={0} className="input" value={calDevices} onChange={(e) => setCalDevices(num(e.target.value))} />
            </Field>
            <Field label="Access type">
              <select className="select" value={calAccess} onChange={(e) => setCalAccess(e.target.value as CALAccessType)}>
                <option>User</option>
                <option>Device</option>
                <option>Mixed</option>
              </select>
            </Field>
            <Field label="RDS users">
              <input type="number" min={0} className="input" value={rdsUsers} onChange={(e) => setRdsUsers(num(e.target.value))} />
            </Field>
            <Field label="RDS devices">
              <input type="number" min={0} className="input" value={rdsDevices} onChange={(e) => setRdsDevices(num(e.target.value))} />
            </Field>
          </div>
          <ResultBox
            lines={[
              `Windows CAL: ${formatNumber(result.cal.recommendedModel === "Device" ? result.cal.deviceCALRequired : result.cal.userCALRequired)} ${result.cal.recommendedModel} CAL`,
              `RDS CAL: ${formatNumber(result.rds.recommendedModel === "Device" ? result.rds.deviceCALRequired : result.rds.userCALRequired)} ${result.rds.recommendedModel} CAL`,
              result.cal.reasoning,
            ]}
            cost={costLinesFor("cal")}
            currency={currency}
          />
        </Section>
      )}

      {has("m365") && (
        <Section title="Microsoft 365" icon={<Cloud className="w-4 h-4" />}>
          <div className="space-y-2">
            {m365.map((l, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  className="select !py-1 min-w-[260px] flex-1 max-w-md"
                  value={l.planId}
                  onChange={(e) => setM365(m365.map((x, j) => (j === i ? { ...x, planId: e.target.value as M365PlanId } : x)))}
                >
                  {M365_PLANS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — ${p.pricePerUserMonth.toFixed(2)}/mo</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  className="input !py-1 w-28"
                  value={l.users}
                  onChange={(e) => setM365(m365.map((x, j) => (j === i ? { ...x, users: num(e.target.value) } : x)))}
                  aria-label="Users"
                />
                <span className="text-xs text-slate-500">users</span>
                <button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => setM365(m365.filter((_, j) => j !== i))} aria-label="Remove plan">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button className="btn-secondary mt-3" onClick={() => setM365([...m365, { planId: "m365-e3", users: 0 }])}>
            <Plus className="w-4 h-4" /> Add plan
          </button>
          <ResultBox
            lines={[
              `${formatCurrency(result.m365.totalMonthly, currency)} / month`,
              `${formatCurrency(result.m365.totalAnnual, currency)} / year (subscription)`,
            ]}
          />
        </Section>
      )}

      {has("win11") && (
        <Section title="Windows 11" icon={<Monitor className="w-4 h-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Field label="Total devices">
              <input type="number" min={0} className="input" value={win11.totalDevices} onChange={(e) => setWin11({ ...win11, totalDevices: num(e.target.value) })} />
            </Field>
            <Field label="Still on Windows 10">
              <input type="number" min={0} className="input" value={win11.devicesOnWindows10} onChange={(e) => setWin11({ ...win11, devicesOnWindows10: num(e.target.value) })} />
            </Field>
            <Field label="…of which Win 11 ready">
              <input type="number" min={0} className="input" value={win11.devicesHardwareReady} onChange={(e) => setWin11({ ...win11, devicesHardwareReady: num(e.target.value) })} />
            </Field>
            <Field label="Target edition">
              <select className="select" value={win11.targetEdition} onChange={(e) => setWin11({ ...win11, targetEdition: e.target.value as Windows11Assessment["targetEdition"] })}>
                {WINDOWS11_EDITIONS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="Users (Enterprise)">
              <input type="number" min={0} className="input" value={win11.users} disabled={win11.targetEdition === "Pro"} onChange={(e) => setWin11({ ...win11, users: num(e.target.value) })} />
            </Field>
          </div>
          <ResultBox
            lines={[
              `${formatNumber(result.w11.alreadyOnWindows11)} already on Windows 11`,
              `${formatNumber(result.w11.inPlaceUpgrade)} ready for in-place upgrade`,
              `${formatNumber(result.w11.needReplacement)} need hardware replacement`,
              result.w11.enterpriseUsersRequired > 0
                ? `${formatNumber(result.w11.enterpriseUsersRequired)} Enterprise users · ${formatCurrency(result.w11.annualTotal, currency)} / year`
                : "No subscription cost (Pro is per-device)",
              ...result.w11.notes,
            ]}
          />
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer">Windows 11 minimum hardware requirements</summary>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {WINDOWS11_REQUIREMENTS.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </details>
        </Section>
      )}

      {scopes.size > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <KpiCard label="One-time license cost" value={formatCurrency(result.cost.total, currency)} sub="Perpetual server licenses & CALs" tone="warn" />
          <KpiCard label="Annual subscription" value={formatCurrency(annual, currency)} sub="Microsoft 365 + Windows Enterprise" tone="warn" />
          <KpiCard label="First-year total" value={formatCurrency(result.cost.total + annual, currency)} />
        </div>
      )}

      <Disclaimer />
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-4 mb-4">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-brand-700">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ResultBox({
  lines,
  cost,
  currency,
}: {
  lines: string[];
  cost?: { product: string; quantity: number; total: number }[];
  currency?: "THB" | "USD" | "EUR";
}) {
  return (
    <div className="mt-4 rounded-lg bg-brand-50 border border-slate-200 p-3 text-sm text-slate-800">
      <ul className="space-y-0.5">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {cost && currency && cost.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200 space-y-0.5">
          {cost.map((c) => (
            <div key={c.product} className="flex justify-between gap-4 text-xs">
              <span>{c.product} × {formatNumber(c.quantity)}</span>
              <span className="font-medium">{formatCurrency(c.total, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
