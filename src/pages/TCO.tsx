import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Disclaimer } from "../components/common/Disclaimer";
import { KpiCard } from "../components/common/KpiCard";
import { useApp } from "../state/AppContext";
import { calculateTCO, type TcoBasis } from "../engine/tcoCalculator";
import { formatCurrency } from "../utils/format";

const SEVERITY_BADGE = { High: "badge-red", Medium: "badge-yellow", Low: "badge-gray" } as const;

export default function TCO() {
  const { current, pricing, settings } = useApp();
  const [basis, setBasis] = useState<TcoBasis>("required");
  const [saPct, setSaPct] = useState(25);
  const [includeSA, setIncludeSA] = useState(true);

  const result = useMemo(
    () =>
      current
        ? calculateTCO({
            assessment: current,
            pricing,
            currency: settings.defaultCurrency,
            basis,
            saRate: saPct / 100,
            includeSA,
          })
        : null,
    [current, pricing, settings.defaultCurrency, basis, saPct, includeSA]
  );

  if (!current || !result) {
    return (
      <>
        <PageHeader title="3-Year TCO" icon={<LineChart className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  const cur = result.currency;
  const axis = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v));
  const chartData = result.years.map((y) => ({
    name: y.label,
    "Licenses (CapEx)": Math.round(y.licenses),
    "Software Assurance": Math.round(y.sa),
    "M365 subscription": Math.round(y.m365),
  }));

  return (
    <>
      <PageHeader
        title="3-Year TCO"
        subtitle={`${current.customer.name || "Untitled"} · upfront licenses, SA renewals and M365 subscription over 36 months`}
        icon={<LineChart className="w-5 h-5" />}
      />

      <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Cost basis</label>
          <select className="select" value={basis} onChange={(e) => setBasis(e.target.value as TcoBasis)}>
            <option value="required">Full required licenses</option>
            <option value="gap">License gap only (what must be bought)</option>
          </select>
        </div>
        <div>
          <label className="label">SA rate (% of license price / year)</label>
          <input
            type="number"
            min={0}
            max={100}
            className="input"
            value={saPct}
            onChange={(e) => setSaPct(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 md:mt-6">
          <input type="checkbox" checked={includeSA} onChange={(e) => setIncludeSA(e.target.checked)} />
          Include Year-1 SA in the initial purchase
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="3-Year Total" value={formatCurrency(result.total, cur)} tone="warn" />
        <KpiCard label="Year 1" value={formatCurrency(result.years[0].total, cur)} />
        <KpiCard label="Year 2" value={formatCurrency(result.years[1].total, cur)} />
        <KpiCard label="Year 3" value={formatCurrency(result.years[2].total, cur)} />
      </div>

      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-2">Cost timeline</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={11} tickFormatter={axis} />
              <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
              <Legend />
              <Bar dataKey="Licenses (CapEx)" stackId="a" fill="#1d4ed8" />
              <Bar dataKey="Software Assurance" stackId="a" fill="#38bdf8" />
              <Bar dataKey="M365 subscription" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        <table className="table">
          <thead>
            <tr>
              <th>Year</th>
              <th className="text-right">Licenses</th>
              <th className="text-right">Software Assurance</th>
              <th className="text-right">M365</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.years.map((y) => (
              <tr key={y.label}>
                <td>{y.label}</td>
                <td className="text-right">{formatCurrency(y.licenses, cur)}</td>
                <td className="text-right">{formatCurrency(y.sa, cur)}</td>
                <td className="text-right">{formatCurrency(y.m365, cur)}</td>
                <td className="text-right font-semibold">{formatCurrency(y.total, cur)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold">
              <td colSpan={4} className="text-right">3-year total</td>
              <td className="text-right">{formatCurrency(result.total, cur)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Software Assurance watch-list</h3>
        </div>
        {result.warnings.length === 0 ? (
          <p className="text-sm text-slate-500">
            No SA issues found. Add inventory items with SA and an expiry date (Current License) to track renewals.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className={SEVERITY_BADGE[w.severity]}>{w.severity}</span>
                <span>{w.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Disclaimer />
    </>
  );
}
