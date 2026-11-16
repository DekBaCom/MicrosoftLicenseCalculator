import { useMemo } from "react";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { KpiCard } from "../components/common/KpiCard";
import { Disclaimer } from "../components/common/Disclaimer";
import { EmptyState } from "../components/common/EmptyState";
import { useApp } from "../state/AppContext";
import { calculateWindowsCAL } from "../engine/calCalculator";
import { calculateRDSCAL } from "../engine/rdsCalculator";
import { formatCurrency, formatNumber } from "../utils/format";

export default function CALRDS() {
  const { current, pricing, settings } = useApp();

  const result = useMemo(() => {
    if (!current) return null;
    const cal = calculateWindowsCAL(current.windowsCAL);
    const rds = calculateRDSCAL(current.rds);

    const userCALPrice = pricing.find((p) => p.sku === "WS-UCAL")?.unitPrice ?? 0;
    const deviceCALPrice = pricing.find((p) => p.sku === "WS-DCAL")?.unitPrice ?? 0;
    const rdsUserPrice = pricing.find((p) => p.sku === "RDS-UCAL")?.unitPrice ?? 0;
    const rdsDevicePrice = pricing.find((p) => p.sku === "RDS-DCAL")?.unitPrice ?? 0;

    return {
      cal,
      rds,
      userCALCost: cal.userCALRequired * userCALPrice,
      deviceCALCost: cal.deviceCALRequired * deviceCALPrice,
      rdsUserCost: rds.userCALRequired * rdsUserPrice,
      rdsDeviceCost: rds.deviceCALRequired * rdsDevicePrice,
    };
  }, [current, pricing]);

  if (!current || !result) {
    return (
      <>
        <PageHeader title="CAL & RDS" icon={<Users className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  const cur = settings.defaultCurrency;

  return (
    <>
      <PageHeader title="CAL & RDS" subtitle="Windows Server CAL and RDS CAL analysis" icon={<Users className="w-5 h-5" />} />

      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-3">Windows Server CAL — User vs Device</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[640px]">
            <thead><tr><th></th><th className="text-right">User CAL</th><th className="text-right">Device CAL</th></tr></thead>
            <tbody>
              <tr><td>Users</td><td className="text-right">{formatNumber(current.windowsCAL.users)}</td><td className="text-right">{formatNumber(current.windowsCAL.users)}</td></tr>
              <tr><td>Devices</td><td className="text-right">{formatNumber(current.windowsCAL.devices)}</td><td className="text-right">{formatNumber(current.windowsCAL.devices)}</td></tr>
              <tr className="font-semibold"><td>Required</td><td className="text-right">{formatNumber(result.cal.userCALRequired)}</td><td className="text-right">{formatNumber(result.cal.deviceCALRequired)}</td></tr>
              <tr><td>Estimated cost</td><td className="text-right">{formatCurrency(result.userCALCost, cur)}</td><td className="text-right">{formatCurrency(result.deviceCALCost, cur)}</td></tr>
              <tr><td className="font-medium">Recommendation</td><td colSpan={2} className="text-right"><span className="badge-blue">{result.cal.recommendedModel} CAL</span></td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">{result.cal.reasoning}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="RDS Users" value={formatNumber(current.rds.rdsUsers)} />
        <KpiCard label="RDS Devices" value={formatNumber(current.rds.rdsDevices)} />
        <KpiCard label="Concurrent" value={formatNumber(current.rds.concurrentUsers)} />
        <KpiCard label="Owned (RDS)" value={formatNumber(current.rds.owned.userCAL + current.rds.owned.deviceCAL)} />
      </div>

      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-3">RDS CAL</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[640px]">
            <thead><tr><th></th><th className="text-right">User CAL</th><th className="text-right">Device CAL</th></tr></thead>
            <tbody>
              <tr className="font-semibold"><td>Required</td><td className="text-right">{formatNumber(result.rds.userCALRequired)}</td><td className="text-right">{formatNumber(result.rds.deviceCALRequired)}</td></tr>
              <tr><td>Estimated cost</td><td className="text-right">{formatCurrency(result.rdsUserCost, cur)}</td><td className="text-right">{formatCurrency(result.rdsDeviceCost, cur)}</td></tr>
              <tr><td className="font-medium">Recommendation</td><td colSpan={2} className="text-right"><span className="badge-blue">{result.rds.recommendedModel} CAL</span></td></tr>
              <tr><td>Current Owned</td><td className="text-right">{formatNumber(current.rds.owned.userCAL)}</td><td className="text-right">{formatNumber(current.rds.owned.deviceCAL)}</td></tr>
              <tr><td className="font-medium">Gap</td><td className="text-right text-red-600 font-semibold">{formatNumber(Math.max(0, result.rds.userCALRequired - current.rds.owned.userCAL))}</td><td className="text-right text-red-600 font-semibold">{formatNumber(Math.max(0, result.rds.deviceCALRequired - current.rds.owned.deviceCAL))}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">{result.rds.reasoning}</p>
      </div>

      <Disclaimer />
    </>
  );
}
