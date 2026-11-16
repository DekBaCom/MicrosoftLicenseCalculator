import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";
import { Stepper } from "../components/questionnaire/Stepper";
import { useApp } from "../state/AppContext";
import type { Assessment, Hypervisor, CloudProvider, WindowsServer, WindowsVersion, WindowsEdition, LicenseInventoryItem, ExchangeServer } from "../types";
import { uid } from "../utils/id";
import { FilePlus2, Plus, Trash2, Copy, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { INDUSTRIES, COUNTRIES } from "../data/products";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { calculateExchange } from "../engine/exchangeCalculator";
import { formatNumber } from "../utils/format";
import { StatusBadge } from "../components/common/StatusBadge";

const STEPS = [
  "Customer",
  "Environment",
  "Windows Server",
  "CAL / RDS",
  "Exchange",
  "Current License",
  "Review",
  "Result",
];

function blank(): Assessment {
  const now = new Date().toISOString();
  return {
    id: uid("asmt"),
    version: 1,
    status: "Draft",
    createdAt: now,
    updatedAt: now,
    owner: "",
    customer: { id: uid("cust"), name: "", assessmentDate: now.slice(0, 10) },
    environment: {
      physicalServers: 0,
      virtualServers: 0,
      hypervisor: "None",
      cloudProvider: "None",
      hybrid: false,
      operatingSystems: [],
    },
    windowsServers: [],
    windowsCAL: { users: 0, devices: 0, accessType: "User", owned: { userCAL: 0, deviceCAL: 0 } },
    rds: { rdsUsers: 0, rdsDevices: 0, accessType: "User", concurrentUsers: 0, owned: { userCAL: 0, deviceCAL: 0 } },
    exchange: {
      servers: [],
      mailboxUsers: 0,
      sharedMailboxes: 0,
      dag: false,
      highAvailability: false,
      hybrid: false,
      publicFolder: false,
      calType: "Standard",
    },
    inventory: [],
  };
}

export default function NewAssessment() {
  const { createAssessment, updateAssessment } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Assessment>(() => blank());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save draft to localStorage via context when non-empty name
  useEffect(() => {
    if (draft.customer.name.trim().length > 2) {
      // Only persist once we have a meaningful name
      updateAssessment(draft);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function set<K extends keyof Assessment>(k: K, v: Assessment[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function next() {
    const e = validate(step, draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step === 0) {
      createAssessment(draft);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const content = useMemo(() => {
    switch (step) {
      case 0:
        return <StepCustomer draft={draft} setDraft={setDraft} errors={errors} />;
      case 1:
        return <StepEnvironment draft={draft} setDraft={setDraft} />;
      case 2:
        return <StepWindows draft={draft} setDraft={setDraft} />;
      case 3:
        return <StepCAL draft={draft} setDraft={setDraft} />;
      case 4:
        return <StepExchange draft={draft} setDraft={setDraft} />;
      case 5:
        return <StepInventory draft={draft} setDraft={setDraft} />;
      case 6:
        return <StepReview draft={draft} />;
      case 7:
        return <StepResult draft={draft} onFinish={() => { updateAssessment({ ...draft, status: "Completed" }); nav("/"); }} />;
    }
  }, [step, draft, errors, nav, updateAssessment]);

  return (
    <>
      <PageHeader
        title="New Assessment"
        subtitle="Follow the 8-step questionnaire to build a licensing picture."
        icon={<FilePlus2 className="w-5 h-5" />}
      />
      <div className="space-y-4">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => setStep(i)} />
        <div className="card p-4 md:p-6">{content}</div>

        <div className="flex items-center justify-between">
          <button className="btn-secondary" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => updateAssessment(draft)}>
              <Save className="w-4 h-4" /> Save Draft
            </button>
            {step < STEPS.length - 1 && (
              <button className="btn-primary" onClick={next}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <Disclaimer compact />
      </div>
    </>
  );
}

function validate(step: number, a: Assessment): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (!a.customer.name.trim()) e["customer.name"] = "Customer name is required.";
    if (a.customer.numberOfUsers != null && a.customer.numberOfUsers < 0)
      e["customer.numberOfUsers"] = "Must be >= 0";
  }
  return e;
}

// =============================== Steps ===============================

function StepCustomer({
  draft,
  setDraft,
  errors,
}: {
  draft: Assessment;
  setDraft: React.Dispatch<React.SetStateAction<Assessment>>;
  errors: Record<string, string>;
}) {
  const c = draft.customer;
  const update = (k: keyof typeof c, v: unknown) =>
    setDraft((d) => ({ ...d, customer: { ...d.customer, [k]: v } }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Customer Name *" error={errors["customer.name"]}>
        <input className="input" value={c.name} onChange={(e) => update("name", e.target.value)} />
      </Field>
      <Field label="Customer ID">
        <input className="input" value={c.customerId ?? ""} onChange={(e) => update("customerId", e.target.value)} />
      </Field>
      <Field label="Industry">
        <select className="select" value={c.industry ?? ""} onChange={(e) => update("industry", e.target.value)}>
          <option value="">— Select —</option>
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </select>
      </Field>
      <Field label="Country">
        <select className="select" value={c.country ?? ""} onChange={(e) => update("country", e.target.value)}>
          <option value="">— Select —</option>
          {COUNTRIES.map((i) => <option key={i}>{i}</option>)}
        </select>
      </Field>
      <Field label="Contact Person">
        <input className="input" value={c.contactPerson ?? ""} onChange={(e) => update("contactPerson", e.target.value)} />
      </Field>
      <Field label="Email">
        <input className="input" type="email" value={c.email ?? ""} onChange={(e) => update("email", e.target.value)} />
      </Field>
      <Field label="Number of Employees">
        <input className="input" type="number" value={c.numberOfEmployees ?? 0} onChange={(e) => update("numberOfEmployees", Number(e.target.value))} />
      </Field>
      <Field label="Number of Users" error={errors["customer.numberOfUsers"]}>
        <input className="input" type="number" value={c.numberOfUsers ?? 0} onChange={(e) => update("numberOfUsers", Number(e.target.value))} />
      </Field>
      <Field label="Number of Locations">
        <input className="input" type="number" value={c.numberOfLocations ?? 0} onChange={(e) => update("numberOfLocations", Number(e.target.value))} />
      </Field>
      <Field label="Assessment Owner">
        <input className="input" value={c.assessmentOwner ?? ""} onChange={(e) => update("assessmentOwner", e.target.value)} />
      </Field>
      <Field label="Assessment Date">
        <input className="input" type="date" value={c.assessmentDate ?? ""} onChange={(e) => update("assessmentDate", e.target.value)} />
      </Field>
      <Field label="Notes" wide>
        <textarea className="input min-h-[72px]" value={c.notes ?? ""} onChange={(e) => update("notes", e.target.value)} />
      </Field>
    </div>
  );
}

function StepEnvironment({ draft, setDraft }: { draft: Assessment; setDraft: React.Dispatch<React.SetStateAction<Assessment>>; }) {
  const env = draft.environment;
  const update = (k: keyof typeof env, v: unknown) =>
    setDraft((d) => ({ ...d, environment: { ...d.environment, [k]: v } }));
  const toggleOS = (os: string) => {
    const has = env.operatingSystems.includes(os);
    update("operatingSystems", has ? env.operatingSystems.filter((x) => x !== os) : [...env.operatingSystems, os]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Infrastructure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Physical Servers">
            <input className="input" type="number" value={env.physicalServers} onChange={(e) => update("physicalServers", Number(e.target.value))} />
          </Field>
          <Field label="Virtual Servers (VMs)">
            <input className="input" type="number" value={env.virtualServers} onChange={(e) => update("virtualServers", Number(e.target.value))} />
          </Field>
          <Field label="Hypervisor">
            <select className="select" value={env.hypervisor} onChange={(e) => update("hypervisor", e.target.value as Hypervisor)}>
              {["Hyper-V", "VMware", "Nutanix", "Other", "None"].map((h) => <option key={h}>{h}</option>)}
            </select>
          </Field>
          <Field label="Cloud Usage">
            <select className="select" value={env.cloudProvider} onChange={(e) => update("cloudProvider", e.target.value as CloudProvider)}>
              {["Azure", "AWS", "Google Cloud", "None"].map((h) => <option key={h}>{h}</option>)}
            </select>
          </Field>
          <Field label="Hybrid Environment">
            <select className="select" value={env.hybrid ? "Yes" : "No"} onChange={(e) => update("hybrid", e.target.value === "Yes")}>
              <option>Yes</option>
              <option>No</option>
            </select>
          </Field>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Operating Systems in use</h3>
        <div className="flex flex-wrap gap-2">
          {["Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows Server 2025", "Other"].map((os) => (
            <button
              key={os}
              onClick={() => toggleOS(os)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${env.operatingSystems.includes(os) ? "bg-brand-700 text-white border-brand-700" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
            >
              {os}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepWindows({ draft, setDraft }: { draft: Assessment; setDraft: React.Dispatch<React.SetStateAction<Assessment>>; }) {
  const servers = draft.windowsServers;
  const setServers = (v: WindowsServer[]) => setDraft((d) => ({ ...d, windowsServers: v }));
  const add = () => setServers([...servers, {
    id: uid("srv"), name: `SRV-${servers.length + 1}`, type: "Physical", cpuSockets: 2, coresPerCpu: 8, totalCores: 16, version: "Windows Server 2022", edition: "Standard", vmCount: 0, role: "", ha: false,
  }]);
  const update = (id: string, patch: Partial<WindowsServer>) => setServers(servers.map(s => s.id === id ? ({ ...s, ...patch, totalCores: (patch.cpuSockets ?? s.cpuSockets) * (patch.coresPerCpu ?? s.coresPerCpu) }) : s));
  const remove = (id: string) => setServers(servers.filter(s => s.id !== id));
  const duplicate = (id: string) => { const src = servers.find(s => s.id === id); if (src) setServers([...servers, { ...src, id: uid("srv"), name: src.name + "-copy" }]); };

  const totals = useMemo(() => calculateWindowsLicensing(servers), [servers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Windows Server inventory</h3>
          <p className="text-xs text-slate-500">Add every physical host and significant VM for an accurate core calculation.</p>
        </div>
        <button className="btn-primary" onClick={add}><Plus className="w-4 h-4" /> Add Server</button>
      </div>
      <div className="overflow-x-auto scrollbar-thin -mx-4 px-4">
        <table className="table min-w-[1100px]">
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Sockets</th><th>Cores/CPU</th><th>Total Cores</th>
              <th>Version</th><th>Edition</th><th>VMs</th><th>Role</th><th>HA</th><th></th>
            </tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr key={s.id}>
                <td><input className="input !py-1" value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} /></td>
                <td>
                  <select className="select !py-1" value={s.type} onChange={(e) => update(s.id, { type: e.target.value as WindowsServer["type"] })}>
                    <option>Physical</option><option>VM</option>
                  </select>
                </td>
                <td><input className="input !py-1 w-20" type="number" value={s.cpuSockets} onChange={(e) => update(s.id, { cpuSockets: Number(e.target.value) })} /></td>
                <td><input className="input !py-1 w-24" type="number" value={s.coresPerCpu} onChange={(e) => update(s.id, { coresPerCpu: Number(e.target.value) })} /></td>
                <td className="font-semibold text-slate-800">{s.cpuSockets * s.coresPerCpu}</td>
                <td>
                  <select className="select !py-1" value={s.version} onChange={(e) => update(s.id, { version: e.target.value as WindowsVersion })}>
                    {["Windows Server 2016","Windows Server 2019","Windows Server 2022","Windows Server 2025","Other"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </td>
                <td>
                  <select className="select !py-1" value={s.edition} onChange={(e) => update(s.id, { edition: e.target.value as WindowsEdition })}>
                    <option>Standard</option><option>Datacenter</option><option>Essentials</option>
                  </select>
                </td>
                <td><input className="input !py-1 w-16" type="number" value={s.vmCount} onChange={(e) => update(s.id, { vmCount: Number(e.target.value) })} /></td>
                <td><input className="input !py-1 min-w-[120px]" value={s.role ?? ""} onChange={(e) => update(s.id, { role: e.target.value })} /></td>
                <td><input type="checkbox" checked={s.ha} onChange={(e) => update(s.id, { ha: e.target.checked })} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => duplicate(s.id)} title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                    <button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => remove(s.id)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {servers.length === 0 && (
              <tr><td colSpan={11} className="text-center py-6 text-slate-500">No servers yet. Click "Add Server" to start.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiMini label="Total Physical Cores" value={formatNumber(totals.totalPhysicalCores)} />
        <KpiMini label="Total CPU Sockets" value={formatNumber(totals.totalCpuSockets)} />
        <KpiMini label="Total VMs" value={formatNumber(totals.totalVMs)} />
        <KpiMini label="Required Cores (Std+DC)" value={formatNumber(totals.requiredStandardCoreLicenses + totals.requiredDatacenterCoreLicenses)} />
      </div>
    </div>
  );
}

function StepCAL({ draft, setDraft }: { draft: Assessment; setDraft: React.Dispatch<React.SetStateAction<Assessment>>; }) {
  const c = draft.windowsCAL;
  const r = draft.rds;
  const setCAL = (patch: Partial<typeof c>) => setDraft((d) => ({ ...d, windowsCAL: { ...d.windowsCAL, ...patch } }));
  const setRDS = (patch: Partial<typeof r>) => setDraft((d) => ({ ...d, rds: { ...d.rds, ...patch } }));
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Windows Server CAL</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Users"><input type="number" className="input" value={c.users} onChange={(e) => setCAL({ users: Number(e.target.value) })} /></Field>
          <Field label="Devices"><input type="number" className="input" value={c.devices} onChange={(e) => setCAL({ devices: Number(e.target.value) })} /></Field>
          <Field label="Access Type">
            <select className="select" value={c.accessType} onChange={(e) => setCAL({ accessType: e.target.value as any })}>
              <option>User</option><option>Device</option><option>Mixed</option>
            </select>
          </Field>
          <Field label="Owned User CALs"><input type="number" className="input" value={c.owned.userCAL} onChange={(e) => setCAL({ owned: { ...c.owned, userCAL: Number(e.target.value) } })} /></Field>
          <Field label="Owned Device CALs"><input type="number" className="input" value={c.owned.deviceCAL} onChange={(e) => setCAL({ owned: { ...c.owned, deviceCAL: Number(e.target.value) } })} /></Field>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">RDS CAL</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="RDS Users"><input type="number" className="input" value={r.rdsUsers} onChange={(e) => setRDS({ rdsUsers: Number(e.target.value) })} /></Field>
          <Field label="RDS Devices"><input type="number" className="input" value={r.rdsDevices} onChange={(e) => setRDS({ rdsDevices: Number(e.target.value) })} /></Field>
          <Field label="Access Type">
            <select className="select" value={r.accessType} onChange={(e) => setRDS({ accessType: e.target.value as any })}>
              <option>User</option><option>Device</option><option>Mixed</option>
            </select>
          </Field>
          <Field label="Concurrent Users"><input type="number" className="input" value={r.concurrentUsers} onChange={(e) => setRDS({ concurrentUsers: Number(e.target.value) })} /></Field>
          <Field label="Owned RDS User CALs"><input type="number" className="input" value={r.owned.userCAL} onChange={(e) => setRDS({ owned: { ...r.owned, userCAL: Number(e.target.value) } })} /></Field>
          <Field label="Owned RDS Device CALs"><input type="number" className="input" value={r.owned.deviceCAL} onChange={(e) => setRDS({ owned: { ...r.owned, deviceCAL: Number(e.target.value) } })} /></Field>
        </div>
      </div>
    </div>
  );
}

function StepExchange({ draft, setDraft }: { draft: Assessment; setDraft: React.Dispatch<React.SetStateAction<Assessment>>; }) {
  const ex = draft.exchange;
  const set = (patch: Partial<typeof ex>) => setDraft((d) => ({ ...d, exchange: { ...d.exchange, ...patch } }));
  const addSrv = () => set({
    servers: [...ex.servers, { id: uid("ex"), name: `EX${ex.servers.length + 1}`, version: "Exchange 2019", edition: "Standard", type: "VM", cpuSockets: 1, cores: 8, dagMember: ex.dag, mailboxDatabases: 1, status: "Active" }],
  });
  const updateSrv = (id: string, patch: Partial<ExchangeServer>) => set({ servers: ex.servers.map(s => s.id === id ? { ...s, ...patch } : s) });
  const removeSrv = (id: string) => set({ servers: ex.servers.filter(s => s.id !== id) });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Mailbox Users"><input type="number" className="input" value={ex.mailboxUsers} onChange={(e) => set({ mailboxUsers: Number(e.target.value) })} /></Field>
        <Field label="Shared Mailboxes"><input type="number" className="input" value={ex.sharedMailboxes} onChange={(e) => set({ sharedMailboxes: Number(e.target.value) })} /></Field>
        <Field label="CAL Type">
          <select className="select" value={ex.calType} onChange={(e) => set({ calType: e.target.value as any })}>
            <option value="Standard">Standard CAL only</option>
            <option value="Enterprise">Standard + Enterprise CAL</option>
            <option value="StandardPlusEnterprise">Mixed</option>
          </select>
        </Field>
        <Field label="DAG"><select className="select" value={ex.dag ? "Yes" : "No"} onChange={(e) => set({ dag: e.target.value === "Yes" })}><option>Yes</option><option>No</option></select></Field>
        <Field label="High Availability"><select className="select" value={ex.highAvailability ? "Yes" : "No"} onChange={(e) => set({ highAvailability: e.target.value === "Yes" })}><option>Yes</option><option>No</option></select></Field>
        <Field label="Hybrid"><select className="select" value={ex.hybrid ? "Yes" : "No"} onChange={(e) => set({ hybrid: e.target.value === "Yes" })}><option>Yes</option><option>No</option></select></Field>
        <Field label="Public Folder"><select className="select" value={ex.publicFolder ? "Yes" : "No"} onChange={(e) => set({ publicFolder: e.target.value === "Yes" })}><option>Yes</option><option>No</option></select></Field>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Exchange Servers</h3>
        <button className="btn-primary" onClick={addSrv}><Plus className="w-4 h-4" /> Add Server</button>
      </div>
      <div className="overflow-x-auto scrollbar-thin -mx-4 px-4">
        <table className="table min-w-[1000px]">
          <thead><tr>
            <th>Name</th><th>Version</th><th>Edition</th><th>Type</th><th>Sockets</th><th>Cores</th><th>DAG</th><th>Mailbox DBs</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {ex.servers.map((s) => (
              <tr key={s.id}>
                <td><input className="input !py-1" value={s.name} onChange={(e) => updateSrv(s.id, { name: e.target.value })} /></td>
                <td><select className="select !py-1" value={s.version} onChange={(e) => updateSrv(s.id, { version: e.target.value as any })}>{["Exchange 2016","Exchange 2019","Exchange SE","Other"].map(v => <option key={v}>{v}</option>)}</select></td>
                <td><select className="select !py-1" value={s.edition} onChange={(e) => updateSrv(s.id, { edition: e.target.value as any })}><option>Standard</option><option>Enterprise</option></select></td>
                <td><select className="select !py-1" value={s.type} onChange={(e) => updateSrv(s.id, { type: e.target.value as any })}><option>Physical</option><option>VM</option></select></td>
                <td><input className="input !py-1 w-20" type="number" value={s.cpuSockets} onChange={(e) => updateSrv(s.id, { cpuSockets: Number(e.target.value) })} /></td>
                <td><input className="input !py-1 w-20" type="number" value={s.cores} onChange={(e) => updateSrv(s.id, { cores: Number(e.target.value) })} /></td>
                <td><input type="checkbox" checked={s.dagMember} onChange={(e) => updateSrv(s.id, { dagMember: e.target.checked })} /></td>
                <td><input className="input !py-1 w-20" type="number" value={s.mailboxDatabases} onChange={(e) => updateSrv(s.id, { mailboxDatabases: Number(e.target.value) })} /></td>
                <td><select className="select !py-1" value={s.status} onChange={(e) => updateSrv(s.id, { status: e.target.value as any })}><option>Active</option><option>Passive</option><option>Standby</option></select></td>
                <td><button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => removeSrv(s.id)}><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
            {ex.servers.length === 0 && (<tr><td colSpan={10} className="text-center py-6 text-slate-500">No Exchange servers.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepInventory({ draft, setDraft }: { draft: Assessment; setDraft: React.Dispatch<React.SetStateAction<Assessment>>; }) {
  const inv = draft.inventory;
  const set = (v: LicenseInventoryItem[]) => setDraft((d) => ({ ...d, inventory: v }));
  const add = () => set([...inv, { id: uid("inv"), product: "Windows Server Standard", licenseType: "Core", quantityOwned: 0 }]);
  const update = (id: string, patch: Partial<LicenseInventoryItem>) => set(inv.map(i => i.id === id ? { ...i, ...patch } : i));
  const remove = (id: string) => set(inv.filter(i => i.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Owned license inventory</h3>
        <button className="btn-primary" onClick={add}><Plus className="w-4 h-4" /> Add Item</button>
      </div>
      <div className="overflow-x-auto scrollbar-thin -mx-4 px-4">
        <table className="table min-w-[950px]">
          <thead><tr>
            <th>Product</th><th>Version</th><th>Edition</th><th>License Type</th><th>Qty Owned</th><th>Agreement</th><th>SA</th><th>Expiry</th><th>Notes</th><th></th>
          </tr></thead>
          <tbody>
            {inv.map((i) => (
              <tr key={i.id}>
                <td>
                  <select className="select !py-1 min-w-[200px]" value={i.product} onChange={(e) => update(i.id, { product: e.target.value })}>
                    {["Windows Server Standard","Windows Server Datacenter","Windows Server CAL","RDS CAL","Exchange Server Standard","Exchange Server Enterprise","Exchange Standard CAL","Exchange Enterprise CAL"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </td>
                <td><input className="input !py-1 w-24" value={i.version ?? ""} onChange={(e) => update(i.id, { version: e.target.value })} /></td>
                <td><input className="input !py-1 w-28" value={i.edition ?? ""} onChange={(e) => update(i.id, { edition: e.target.value })} /></td>
                <td>
                  <select className="select !py-1" value={i.licenseType ?? ""} onChange={(e) => update(i.id, { licenseType: e.target.value })}>
                    <option value="">—</option>
                    <option>Core</option><option>Server</option><option>User CAL</option><option>Device CAL</option>
                  </select>
                </td>
                <td><input className="input !py-1 w-28" type="number" value={i.quantityOwned} onChange={(e) => update(i.id, { quantityOwned: Number(e.target.value) })} /></td>
                <td><input className="input !py-1 w-28" value={i.agreement ?? ""} onChange={(e) => update(i.id, { agreement: e.target.value })} /></td>
                <td><input type="checkbox" checked={!!i.softwareAssurance} onChange={(e) => update(i.id, { softwareAssurance: e.target.checked })} /></td>
                <td><input className="input !py-1" type="date" value={i.expiryDate ?? ""} onChange={(e) => update(i.id, { expiryDate: e.target.value })} /></td>
                <td><input className="input !py-1 min-w-[140px]" value={i.notes ?? ""} onChange={(e) => update(i.id, { notes: e.target.value })} /></td>
                <td><button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => remove(i.id)}><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
            {inv.length === 0 && (<tr><td colSpan={10} className="text-center py-6 text-slate-500">No licenses recorded.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepReview({ draft }: { draft: Assessment }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ReviewRow label="Customer" value={draft.customer.name} />
        <ReviewRow label="Users" value={formatNumber(draft.customer.numberOfUsers || 0)} />
        <ReviewRow label="Industry" value={draft.customer.industry || "—"} />
        <ReviewRow label="Country" value={draft.customer.country || "—"} />
        <ReviewRow label="Physical / VM" value={`${draft.environment.physicalServers} / ${draft.environment.virtualServers}`} />
        <ReviewRow label="Hypervisor" value={draft.environment.hypervisor} />
        <ReviewRow label="Windows Servers" value={formatNumber(draft.windowsServers.length)} />
        <ReviewRow label="Exchange Servers" value={formatNumber(draft.exchange.servers.length)} />
        <ReviewRow label="Mailbox Users" value={formatNumber(draft.exchange.mailboxUsers)} />
        <ReviewRow label="DAG" value={draft.exchange.dag ? "Yes" : "No"} />
      </div>
      <Disclaimer compact />
    </div>
  );
}

function StepResult({ draft, onFinish }: { draft: Assessment; onFinish: () => void }) {
  const win = calculateWindowsLicensing(draft.windowsServers);
  const cal = calculateWindowsCAL(draft.windowsCAL);
  const rds = calculateRDSCAL(draft.rds);
  const exch = calculateExchange(draft.exchange);
  const gaps = analyzeGaps(draft);
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Assessment Result</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiMini label="Windows Std Cores" value={formatNumber(win.requiredStandardCoreLicenses)} />
        <KpiMini label="Windows DC Cores" value={formatNumber(win.requiredDatacenterCoreLicenses)} />
        <KpiMini label="Windows CAL" value={`${formatNumber(cal.recommendedModel === "Device" ? cal.deviceCALRequired : cal.userCALRequired)} (${cal.recommendedModel})`} />
        <KpiMini label="RDS CAL" value={`${formatNumber(rds.recommendedModel === "Device" ? rds.deviceCALRequired : rds.userCALRequired)} (${rds.recommendedModel})`} />
        <KpiMini label="Exchange Std CAL" value={formatNumber(exch.standardCALRequired)} />
        <KpiMini label="Exchange Ent CAL" value={formatNumber(exch.enterpriseCALRequired)} />
        <KpiMini label="Exchange Servers" value={formatNumber(exch.serverLicensesRequired)} />
        <KpiMini label="DAG Copies" value={formatNumber(exch.dagCopies)} />
      </div>
      <div className="overflow-x-auto scrollbar-thin -mx-4 px-4">
        <table className="table">
          <thead><tr><th>Product</th><th className="text-right">Required</th><th className="text-right">Owned</th><th className="text-right">Gap</th><th>Status</th></tr></thead>
          <tbody>
            {gaps.map(g => (
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
      <div className="flex justify-end">
        <button className="btn-primary" onClick={onFinish}>Complete & Open Dashboard</button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Field({ label, children, error, wide }: { label: string; children: React.ReactNode; error?: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}

function KpiMini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] uppercase text-slate-500 font-semibold tracking-wide">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
