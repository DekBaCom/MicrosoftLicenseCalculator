import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Check, Building2, Building, Store } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { useApp } from "../state/AppContext";
import { TEMPLATES, type TemplateId } from "../data/templates";

const ICONS: Record<TemplateId, typeof Store> = {
  smb: Store,
  mid: Building,
  enterprise: Building2,
};

export default function Templates() {
  const { createAssessment } = useApp();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState("");

  return (
    <>
      <PageHeader
        title="Quick-Start Templates"
        subtitle="Create an assessment pre-filled with a typical environment, then replace the numbers with real customer data"
        icon={<Rocket className="w-5 h-5" />}
      />

      <div className="card p-4 mb-4 max-w-xl">
        <label className="label">Customer name (optional)</label>
        <input
          className="input"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="e.g. Contoso Ltd."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {TEMPLATES.map((t) => {
          const Icon = ICONS[t.id];
          return (
            <div key={t.id} className="card p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.tagline}</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700 flex-1 mb-4">
                {t.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <button
                className="btn-primary"
                onClick={() => {
                  createAssessment(t.build(customer.trim() || `${t.name} customer`));
                  navigate("/");
                }}
              >
                Use {t.name} template
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Templates are illustrative starting points, not real customer data. Current license inventory is left empty so
        the gap analysis shows the full requirement until you enter what the customer owns.
      </div>
    </>
  );
}
