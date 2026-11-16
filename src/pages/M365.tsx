import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Cloud, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Disclaimer } from "../components/common/Disclaimer";
import { KpiCard } from "../components/common/KpiCard";
import { useApp } from "../state/AppContext";
import { M365_PLANS, findPlan, findOverlaps } from "../data/m365Plans";
import { calculateM365 } from "../engine/m365Calculator";
import { formatCurrency, formatNumber } from "../utils/format";
import type { M365Assessment, M365LineItem, M365PlanId } from "../types";

const emptyM365: M365Assessment = {
  licenses: [],
  annualBilling: true,
};

export default function M365Page() {
  const { current, updateAssessment, settings } = useApp();
  const m365 = current?.m365 ?? emptyM365;
  const summary = useMemo(
    () => calculateM365({ m365, currency: settings.defaultCurrency }),
    [m365, settings.defaultCurrency]
  );

  if (!current) {
    return (
      <>
        <PageHeader title="Microsoft 365" icon={<Cloud className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  const persist = (next: M365Assessment) => updateAssessment({ ...current, m365: next });

  const addLine = () => persist({
    ...m365,
    licenses: [...m365.licenses, { planId: "m365-e3", users: 0 }],
  });
  const updateLine = (i: number, patch: Partial<M365LineItem>) =>
    persist({ ...m365, licenses: m365.licenses.map((l, j) => (i === j ? { ...l, ...patch } : l)) });
  const removeLine = (i: number) =>
    persist({ ...m365, licenses: m365.licenses.filter((_, j) => i !== j) });

  const overlaps = findOverlaps(m365.licenses.filter((l) => l.users > 0).map((l) => l.planId));
  const totalUsers = m365.licenses.reduce((s, l) => s + l.users, 0);

  // Group plans by category for the dropdown.
  const groups = M365_PLANS.reduce<Record<string, typeof M365_PLANS>>((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Microsoft 365"
        subtitle="Cloud licensing — plans, add-ons and monthly/annual cost"
        icon={<Cloud className="w-5 h-5" />}
        actions={<button className="btn-primary" onClick={addLine}><Plus className="w-4 h-4" /> Add Plan</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Plans Selected" value={formatNumber(m365.licenses.length)} />
        <KpiCard label="Total Users" value={formatNumber(totalUsers)} />
        <KpiCard label="Monthly Cost" value={formatCurrency(summary.totalMonthly, summary.currency)} tone="warn" />
        <KpiCard label="Annual Cost" value={formatCurrency(summary.totalAnnual, summary.currency)} tone="warn" />
      </div>

      {overlaps.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="font-semibold mb-1">Overlapping licenses</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {overlaps.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </div>
      )}

      <div className="card overflow-hidden mb-4">
        <div className="p-3 border-b border-slate-200 font-semibold text-slate-900">M365 licenses</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Category</th>
                <th className="text-right">Users</th>
                <th className="text-right">Unit / mo</th>
                <th className="text-right">Monthly</th>
                <th className="text-right">Annual</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {m365.licenses.map((line, i) => {
                const plan = findPlan(line.planId);
                const sumLine = summary.lines.find((l) => l.planName === plan?.name);
                return (
                  <tr key={i}>
                    <td>
                      <select
                        className="select !py-1 min-w-[260px]"
                        value={line.planId}
                        onChange={(e) => updateLine(i, { planId: e.target.value as M365PlanId })}
                      >
                        {Object.entries(groups).map(([cat, plans]) => (
                          <optgroup key={cat} label={cat}>
                            {plans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — ${p.pricePerUserMonth.toFixed(2)}/mo
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {plan?.includes && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          {plan.includes.join(" · ")}
                        </div>
                      )}
                    </td>
                    <td><span className="badge-gray">{plan?.category}</span></td>
                    <td className="text-right">
                      <input
                        type="number"
                        className="input !py-1 w-24 text-right"
                        value={line.users}
                        onChange={(e) => updateLine(i, { users: Number(e.target.value) })}
                      />
                    </td>
                    <td className="text-right">
                      {sumLine ? formatCurrency(sumLine.unitPricePerMonth, summary.currency) : "—"}
                    </td>
                    <td className="text-right font-semibold">
                      {sumLine ? formatCurrency(sumLine.monthlyTotal, summary.currency) : "—"}
                    </td>
                    <td className="text-right font-semibold">
                      {sumLine ? formatCurrency(sumLine.annualTotal, summary.currency) : "—"}
                    </td>
                    <td>
                      <button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => removeLine(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {m365.licenses.length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-slate-500">
                  No plans yet. Click "Add Plan" to start.
                </td></tr>
              )}
            </tbody>
            {summary.lines.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={4} className="text-right">Total</td>
                  <td className="text-right">{formatCurrency(summary.totalMonthly, summary.currency)}</td>
                  <td className="text-right">{formatCurrency(summary.totalAnnual, summary.currency)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-3">Quick comparison — same user base, different suites</h3>
        <ComparisonMatrix users={Math.max(100, totalUsers)} currency={summary.currency} />
      </div>

      <Disclaimer />
    </>
  );
}

function ComparisonMatrix({ users, currency }: { users: number; currency: "THB" | "USD" | "EUR" }) {
  const candidates: M365PlanId[] = [
    "biz-basic",
    "biz-standard",
    "biz-premium",
    "apps-ent",
    "o365-e3",
    "o365-e5",
    "m365-e3",
    "m365-e5",
    "m365-e7",
    "m365-f3",
  ];

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="table">
        <thead>
          <tr>
            <th>Plan</th>
            <th className="text-right">USD / user / mo</th>
            <th className="text-right">Monthly ({formatNumber(users)} users)</th>
            <th className="text-right">Annual</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((id) => {
            const p = findPlan(id)!;
            const s = calculateM365({
              m365: { licenses: [{ planId: id, users }], annualBilling: true },
              currency,
            });
            return (
              <tr key={id}>
                <td>{p.name}</td>
                <td className="text-right">${p.pricePerUserMonth.toFixed(2)}</td>
                <td className="text-right">{formatCurrency(s.totalMonthly, currency)}</td>
                <td className="text-right font-semibold">{formatCurrency(s.totalAnnual, currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
