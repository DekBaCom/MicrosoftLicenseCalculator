import { AlertCircle } from "lucide-react";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 ${
        compact ? "p-2 text-xs" : "p-3 text-sm"
      }`}
    >
      <AlertCircle className={compact ? "w-4 h-4 mt-0.5 flex-shrink-0" : "w-5 h-5 mt-0.5 flex-shrink-0"} />
      <div>
        <strong>Disclaimer.</strong> This tool provides an indicative Microsoft licensing
        assessment based on the information entered and configured licensing rules. It is
        not a substitute for Microsoft's official Product Terms, licensing agreement,
        reseller agreement, or licensing specialist validation. Final licensing
        requirements and pricing must be confirmed against the applicable Microsoft terms
        and customer agreement.
      </div>
    </div>
  );
}
