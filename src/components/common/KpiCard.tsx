import React from "react";
import clsx from "clsx";

interface Props {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warn" | "danger";
}

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function KpiCard({ label, value, sub, icon, tone = "default" }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        </div>
        {icon && (
          <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", toneStyles[tone])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
