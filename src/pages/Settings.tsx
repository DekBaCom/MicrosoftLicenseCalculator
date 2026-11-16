import { useRef, useState } from "react";
import { Settings as SettingsIcon, Download, Upload, Trash2, Save } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";
import { useApp } from "../state/AppContext";
import { COUNTRIES } from "../data/products";
import { LICENSE_RULES, DATACENTER_VM_BREAKPOINT, CAL_DEVICE_FACTOR } from "../data/licenseRules";
import type { Currency } from "../types";

export default function Settings() {
  const { settings, updateSettings, exportJSON, importJSON, clearAll } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(settings);

  const save = () => updateSettings(draft);
  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ms_license_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const doImport = (f: File) => {
    const fr = new FileReader();
    fr.onload = () => {
      const ok = importJSON(String(fr.result));
      alert(ok ? "Import complete." : "Import failed.");
    };
    fr.readAsText(f);
  };

  return (
    <>
      <PageHeader title="Settings" icon={<SettingsIcon className="w-5 h-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">General</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Company Name</label>
              <input className="input" value={draft.companyName} onChange={(e) => setDraft({ ...draft, companyName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Default Currency</label>
                <select className="select" value={draft.defaultCurrency} onChange={(e) => setDraft({ ...draft, defaultCurrency: e.target.value as Currency })}>
                  <option>THB</option><option>USD</option><option>EUR</option>
                </select>
              </div>
              <div>
                <label className="label">Default Country</label>
                <select className="select" value={draft.defaultCountry} onChange={(e) => setDraft({ ...draft, defaultCountry: e.target.value })}>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={save}><Save className="w-4 h-4" /> Save Changes</button>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Licensing Rules</h3>
          <p className="text-xs text-slate-500 mb-3">
            Rules are configured in <code className="bg-slate-100 px-1 rounded">src/data/licenseRules.ts</code>. Current values:
          </p>
          <div className="space-y-2 text-sm">
            {Object.values(LICENSE_RULES).map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-lg p-2">
                <div className="font-medium text-slate-900">{r.product}</div>
                <div className="text-xs text-slate-600">
                  metric: <span className="font-mono">{r.metric}</span>
                  {r.minimumCoresPerProcessor && <> · min cores/proc: {r.minimumCoresPerProcessor}</>}
                  {r.minimumCoresPerServer && <> · min cores/server: {r.minimumCoresPerServer}</>}
                  {r.virtualizationRights && <> · VM rights: {r.virtualizationRights}</>}
                  {r.unlimitedVirtualization && <> · unlimited VMs</>}
                </div>
                {r.notes && <div className="text-xs text-slate-500 mt-1">{r.notes}</div>}
              </div>
            ))}
            <div className="text-xs text-slate-600 border-t border-slate-200 pt-2 mt-2">
              Datacenter VM breakpoint: <strong>{DATACENTER_VM_BREAKPOINT}</strong> · CAL device factor: <strong>{CAL_DEVICE_FACTOR}</strong>
            </div>
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3">Data</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={doExport}><Download className="w-4 h-4" /> Export JSON Backup</button>
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Import JSON</button>
            <input ref={fileRef} hidden type="file" accept="application/json" onChange={(e) => e.target.files && doImport(e.target.files[0])} />
            <button className="btn-danger" onClick={() => { if (confirm("This will delete all local data. Continue?")) clearAll(); }}>
              <Trash2 className="w-4 h-4" /> Clear Local Data
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4"><Disclaimer /></div>
    </>
  );
}
