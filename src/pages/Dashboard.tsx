import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  LayoutDashboard,
  Server,
  Mail,
  Users,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  BadgeAlert,
  FilePlus2,
  Rocket,
  Zap,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { KpiCard } from "../components/common/KpiCard";
import { Disclaimer } from "../components/common/Disclaimer";
import { EmptyState } from "../components/common/EmptyState";
import { useApp } from "../state/AppContext";
import { useI18n } from "../i18n";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { calculateCost, calculateGapCost } from "../engine/costCalculator";
import { calculateWindowsLicensing } from "../engine/windowsCalculator";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { formatCurrency, formatNumber } from "../utils/format";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#38bdf8"];

export default function Dashboard() {
  const { current, assessments, pricing, settings } = useApp();
  const { t } = useI18n();

  const data = useMemo(() => {
    if (!current) return null;
    const win = calculateWindowsLicensing(current.windowsServers);
    const cal = calculateWindowsCAL(current.windowsCAL);
    const rds = calculateRDSCAL(current.rds);
    const gaps = analyzeGaps(current);
    const cost = calculateCost({ assessment: current, pricing, currency: settings.defaultCurrency });
    const gapCost = calculateGapCost(gaps, pricing, settings.defaultCurrency);
    const totalRequired = gaps.reduce((s, g) => s + g.required, 0);
    const totalOwned = gaps.reduce((s, g) => s + g.owned, 0);
    const totalGap = gaps.reduce((s, g) => s + g.gap, 0);
    const totalSurplus = gaps.reduce((s, g) => s + g.surplus, 0);
    const statusCounts = gaps.reduce(
      (acc, g) => {
        acc[g.status] = (acc[g.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return { win, cal, rds, gaps, cost, gapCost, totalRequired, totalOwned, totalGap, totalSurplus, statusCounts };
  }, [current, pricing, settings]);

  if (!current || !data) {
    return (
      <>
        <PageHeader
          title={t("dashboard.title")}
          subtitle="Microsoft License Assessment overview."
          icon={<LayoutDashboard className="w-5 h-5" />}
        />
        <EmptyState
          title={t("dashboard.empty.title")}
          description={t("dashboard.empty.desc")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/assessments/new" className="btn-primary">
                <FilePlus2 className="w-4 h-4" /> {t("common.newAssessment")}
              </Link>
              <Link to="/quick" className="btn-secondary">
                <Zap className="w-4 h-4" /> {t("nav.quick")}
              </Link>
              <Link to="/templates" className="btn-secondary">
                <Rocket className="w-4 h-4" /> {t("nav.templates")}
              </Link>
            </div>
          }
        />
      </>
    );
  }

  const pieData = [
    { name: "Compliant", value: data.statusCounts["Compliant"] || 0 },
    { name: "Review", value: data.statusCounts["Review"] || 0 },
    { name: "Gap", value: data.statusCounts["Gap"] || 0 },
    { name: "Surplus", value: data.statusCounts["Surplus"] || 0 },
  ];
  const barData = data.gaps.map((g) => ({
    name: g.product.replace("Windows Server ", "WS ").replace("Exchange Server ", "Exch ").replace(" (Cores)", ""),
    Required: g.required,
    Owned: g.owned,
  }));

  const costComparison = [
    { name: "Current (Owned)", value: 0 },
    { name: "Required", value: data.cost.total },
    { name: "Gap to Close", value: data.gapCost.total },
  ];
  // Approximate current cost from owned inventory (indicative)
  costComparison[0].value = data.cost.total - data.gapCost.total;

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={`${current.customer.name} · ${assessments.length} assessment${assessments.length > 1 ? "s" : ""}`}
        icon={<LayoutDashboard className="w-5 h-5" />}
        actions={
          <>
            <Link to="/assessments/new" className="btn-secondary">
              <FilePlus2 className="w-4 h-4" /> New Assessment
            </Link>
            <Link to="/reports" className="btn-primary">Open Report</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="Total Assessments"
          value={formatNumber(assessments.length)}
          icon={<LayoutDashboard className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Users"
          value={formatNumber(current.customer.numberOfUsers || 0)}
          sub={`${formatNumber(current.customer.numberOfEmployees || 0)} employees`}
          icon={<Users className="w-5 h-5" />}
          tone="default"
        />
        <KpiCard
          label="License Gap"
          value={formatNumber(data.totalGap)}
          sub={`${formatNumber(data.totalSurplus)} surplus`}
          icon={<BadgeAlert className="w-5 h-5" />}
          tone={data.totalGap > 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Est. Gap Cost / Year"
          value={formatCurrency(data.gapCost.total, data.gapCost.currency)}
          sub="Based on configured pricing"
          icon={<DollarSign className="w-5 h-5" />}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="Windows Server"
          value={`${formatNumber(current.windowsServers.filter((s) => s.type === "Physical").length)} Servers`}
          sub={`${formatNumber(data.win.totalVMs)} VMs · ${formatNumber(data.win.totalPhysicalCores)} cores`}
          icon={<Server className="w-5 h-5" />}
        />
        <KpiCard
          label="Exchange"
          value={`${formatNumber(current.exchange.servers.length)} Servers`}
          sub={`${formatNumber(current.exchange.mailboxUsers)} mailboxes · DAG: ${current.exchange.dag ? "Yes" : "No"}`}
          icon={<Mail className="w-5 h-5" />}
        />
        <KpiCard
          label="Windows CAL"
          value={formatNumber(data.cal.recommendedModel === "Device" ? data.cal.deviceCALRequired : data.cal.userCALRequired)}
          sub={`${data.cal.recommendedModel} CAL recommended`}
          icon={<Users className="w-5 h-5" />}
        />
        <KpiCard
          label="RDS CAL"
          value={formatNumber(data.rds.recommendedModel === "Device" ? data.rds.deviceCALRequired : data.rds.userCALRequired)}
          sub={`${data.rds.recommendedModel} CAL recommended`}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">License Status</h3>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={32} iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">License Distribution</h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={10} angle={-10} interval={0} textAnchor="end" height={60} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Required" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Owned" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900">Cost Comparison</h3>
          <span className="badge-gray">{data.cost.currency}</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={costComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v))} />
              <Tooltip formatter={(v: number) => formatCurrency(v, data.cost.currency)} />
              <Bar dataKey="value" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Disclaimer />
    </>
  );
}
