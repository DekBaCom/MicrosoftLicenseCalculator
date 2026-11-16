import React from "react";
import { PackageOpen } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title = "No data yet", description, action, icon }: Props) {
  return (
    <div className="card p-8 text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
        {icon ?? <PackageOpen className="w-6 h-6" />}
      </div>
      <div>
        <div className="text-slate-900 font-medium">{title}</div>
        {description && <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>}
      </div>
      {action}
    </div>
  );
}
