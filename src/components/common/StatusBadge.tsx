import type { GapStatus } from "../../types";

export function StatusBadge({ status }: { status: GapStatus }) {
  if (status === "Compliant") return <span className="badge-green">Compliant</span>;
  if (status === "Review") return <span className="badge-yellow">Review</span>;
  if (status === "Gap") return <span className="badge-red">Gap</span>;
  return <span className="badge-blue">Surplus</span>;
}
