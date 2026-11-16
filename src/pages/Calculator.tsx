import { useMemo, useState } from "react";
import { Calculator as CalcIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { KpiCard } from "../components/common/KpiCard";
import { Disclaimer } from "../components/common/Disclaimer";
import { EmptyState } from "../components/common/EmptyState";
import { useApp } from "../state/AppContext";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { calculateCost, calculateGapCost } from "../engine/costCalculator";
import { calculateAHB } from "../engine/ahbCalculator";
import { formatCurrency, formatNumber } from "../utils/format";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Currency, Scenario } from "../types";

export default function Calculator() {
  const { current, pricing, settings } = useApp();
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "a", name: "Current", userGrowthPct: 0, vmGrowthPct: 0, includeExchangeHybrid: false },
    { id: "b", name: "+20% Users", userGrowthPct: 20, vmGrowthPct: 0, includeExchangeHybrid: false },
    { id: "c", name: "+50% VMs", userGrowthPct: 0, vmGrowthPct: 50, includeExchangeHybrid: false },
    { id: "d", name: "Exchange Hybrid", userGrowthPct: 10, vmGrowthPct: 10, includeExchangeHybrid: true },
  ]);
  const [currency, setCurrency] = useState<Currency>(settings.defaultCurrency);

  const base = useMemo(() => {
    if (!current) return null;
    const gaps = analyzeGaps(current);
    const cost = calculateCost({ assessment: current, pricing, currency });
    const gapCost = calculateGapCost(gaps, pricing, currency);
    const ahb = calculateAHB(current);
    return { gaps, cost, gapCost, ahb };
  }, [current, pricing, currency]);

  const scenarioResults = useMemo(() => {
    if (!current) return [];
    return scenarios.map((sc) => {
      // Scale a cloned assessment for the scenario
      const scaled = JSON.parse(JSON.stringify(current)) as typeof current;
      const uf = 1 + sc.userGrowthPct / 100;
      const vf = 1 + sc.vmGrowthPct / 100;
      scaled.windowsCAL.users = Math.round(scaled.windowsCAL.users * uf);
      scaled.windowsCAL.devices = Math.round(scaled.windowsCAL.devices * uf);
      scaled.rds.rdsUsers = Math.round(scaled.rds.rdsUsers * uf);
      scaled.rds.rdsDevices = Math.round(scaled.rds.rdsDevices * uf);
      scaled.rds.concurrentUsers = Math.round(scaled.rds.concurrentUsers * uf);
      scaled.exchange.mailboxUsers = Math.round(scaled.exchange.mailboxUsers * uf);
      scaled.windowsServers = scaled.windowsServers.map((s) => ({ ...s, vmCount: Math.round(s.vmCount * vf) }));
      if (sc.includeExchangeHybrid) scaled.exchange.hybrid = true;
      const gaps = analyzeGaps(scaled);
      const cost = calculateCost({ assessment: scaled, pricing, currency });
      const gapCost = calculateGapCost(gaps, pricing, currency);
      const totalGap = gaps.reduce((s, g) => s + g.gap, 0);
      return { scenario: sc, gaps, cost, gapCost, totalGap };
    });
  }, [current, pricing, currency, scenarios]);

  if (!current || !base) {
    return (
      <>
        <PageHeader title="License Calculator" icon={<CalcIcon className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="License Calculator"
        subtitle="Compare required vs owned, analyze gap, explore scenarios"
        icon={<CalcIcon className="w-5 h-5" />}
        actions={
          <select className="select !py-1" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            <option>THB</option><option>USD</option><option>EUR</option>
          </select>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Required Cost" value={formatCurrency(base.cost.total, currency)} />
        <KpiCard label="Gap-closing Cost" value={formatCurrency(base.gapCost.total, currency)} tone="warn" />
        <KpiCard label="Potential Optimization" value={formatCurrency(Math.max(0, base.cost.total - base.gapCost.total) * 0.1, currency)} sub="Illustrative — 10% of required" tone="success" />
        <KpiCard label="Line Items" value={formatNumber(base.cost.lines.length)} />
      </div>

      {current.environment.azureHybridBenefit && (
        <div className="card p-4 mb-4">
          <h3 className="font-semibold text-slate-900 mb-3">Azure Hybrid Benefit</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="AHB Windows VMs Covered" value={formatNumber(base.ahb.windowsVMsCoverableByAHB)} tone="success" sub={`${formatNumber(base.ahb.windowsLicensesConsumed)} WS cores with SA`} />
            <KpiCard label="AHB SQL vCores Covered" value={formatNumber(Math.round(base.ahb.sqlvCoresCoverableByAHB))} tone="success" sub={`${formatNumber(base.ahb.sqlLicensesConsumed)} SQL cores with SA`} />
            <KpiCard label="Target Windows vCores" value={formatNumber(current.environment.azureWindowsVMvCores ?? 0)} />
            <KpiCard label="Target SQL vCores" value={formatNumber(current.environment.azureSqlVCores ?? 0)} />
          </div>
          {base.ahb.notes.length > 0 && (
            <ul className="mt-2 text-xs text-slate-600 list-disc pl-5">
              {base.ahb.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="card overflow-hidden mb-4">
        <div className="p-3 border-b border-slate-200 font-semibold text-slate-900">License Gap Analysis</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead><tr><th>Product</th><th className="text-right">Required</th><th className="text-right">Owned</th><th className="text-right">Gap</th><th className="text-right">Surplus</th><th>Status</th></tr></thead>
            <tbody>
              {base.gaps.map((g) => (
                <tr key={g.product}>
                  <td>{g.product}</td>
                  <td className="text-right">{formatNumber(g.required)}</td>
                  <td className="text-right">{formatNumber(g.owned)}</td>
                  <td className={`text-right font-semibold ${g.gap > 0 ? "text-red-600" : "text-slate-600"}`}>{formatNumber(g.gap)}</td>
                  <td className={`text-right ${g.surplus > 0 ? "text-sky-700 font-semibold" : "text-slate-600"}`}>{formatNumber(g.surplus)}</td>
                  <td><StatusBadge status={g.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        <div className="p-3 border-b border-slate-200 font-semibold text-slate-900">Cost Breakdown</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[640px]">
            <thead><tr><th>Product</th><th className="text-right">Quantity</th><th className="text-right">Unit Price</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {base.cost.lines.map((l) => (
                <tr key={l.product}><td>{l.product}</td><td className="text-right">{formatNumber(l.quantity)}</td><td className="text-right">{formatCurrency(l.unitPrice, currency)}</td><td className="text-right font-semibold">{formatCurrency(l.total, currency)}</td></tr>
              ))}
              <tr className="bg-slate-50"><td colSpan={3} className="text-right font-semibold">Total</td><td className="text-right font-semibold">{formatCurrency(base.cost.total, currency)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Scenario / What-if Analysis</h3>
          <button className="btn-secondary" onClick={() => setScenarios([...scenarios, { id: String(Date.now()), name: `Scenario ${scenarios.length + 1}`, userGrowthPct: 0, vmGrowthPct: 0, includeExchangeHybrid: false }])}>
            + Add Scenario
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead><tr><th>Scenario</th><th>Users %</th><th>VMs %</th><th>Exch Hybrid</th><th className="text-right">Total Gap</th><th className="text-right">Annual Cost</th><th className="text-right">Gap Cost</th></tr></thead>
            <tbody>
              {scenarioResults.map((r) => (
                <tr key={r.scenario.id}>
                  <td>
                    <input className="input !py-1" value={r.scenario.name} onChange={(e) => setScenarios(scenarios.map(s => s.id === r.scenario.id ? { ...s, name: e.target.value } : s))} />
                  </td>
                  <td><input type="number" className="input !py-1 w-20" value={r.scenario.userGrowthPct} onChange={(e) => setScenarios(scenarios.map(s => s.id === r.scenario.id ? { ...s, userGrowthPct: Number(e.target.value) } : s))} /></td>
                  <td><input type="number" className="input !py-1 w-20" value={r.scenario.vmGrowthPct} onChange={(e) => setScenarios(scenarios.map(s => s.id === r.scenario.id ? { ...s, vmGrowthPct: Number(e.target.value) } : s))} /></td>
                  <td><input type="checkbox" checked={r.scenario.includeExchangeHybrid} onChange={(e) => setScenarios(scenarios.map(s => s.id === r.scenario.id ? { ...s, includeExchangeHybrid: e.target.checked } : s))} /></td>
                  <td className="text-right font-semibold">{formatNumber(r.totalGap)}</td>
                  <td className="text-right">{formatCurrency(r.cost.total, currency)}</td>
                  <td className="text-right text-amber-700 font-semibold">{formatCurrency(r.gapCost.total, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Disclaimer />
    </>
  );
}
