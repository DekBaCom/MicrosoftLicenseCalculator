import { useMemo } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Disclaimer } from "../components/common/Disclaimer";
import { useApp } from "../state/AppContext";
import { analyzeGaps } from "../engine/gapAnalyzer";
import { generateRecommendations } from "../engine/recommendationEngine";
import { formatNumber } from "../utils/format";

export default function Recommendations() {
  const { current } = useApp();
  const recs = useMemo(() => {
    if (!current) return [];
    return generateRecommendations(current, analyzeGaps(current));
  }, [current]);

  if (!current) {
    return (
      <>
        <PageHeader title="Recommendations" icon={<Lightbulb className="w-5 h-5" />} />
        <EmptyState action={<Link to="/assessments/new" className="btn-primary">New Assessment</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Recommendations" subtitle={`${recs.length} actionable items`} icon={<Lightbulb className="w-5 h-5" />} />

      {recs.length === 0 ? (
        <EmptyState title="All clear" description="No gaps or optimization opportunities detected." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recs.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-900">{r.product}</div>
                <span className={r.priority === "High" ? "badge-red" : r.priority === "Medium" ? "badge-yellow" : "badge-blue"}>{r.priority}</span>
              </div>
              <div className="grid grid-cols-3 text-sm mb-2">
                <div><div className="text-xs text-slate-500">Current</div><div className="font-semibold">{formatNumber(r.current)}</div></div>
                <div><div className="text-xs text-slate-500">Required</div><div className="font-semibold">{formatNumber(r.required)}</div></div>
                <div><div className="text-xs text-slate-500">Gap</div><div className={`font-semibold ${r.gap > 0 ? "text-red-600" : r.gap < 0 ? "text-sky-700" : "text-slate-700"}`}>{formatNumber(r.gap)}</div></div>
              </div>
              <div className="rounded-lg bg-brand-50 text-brand-900 p-3 text-sm flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-700" />
                <div>
                  <div className="font-medium">{r.action}</div>
                  {r.note && <div className="text-xs text-slate-600 mt-1">{r.note}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4"><Disclaimer /></div>
    </>
  );
}
