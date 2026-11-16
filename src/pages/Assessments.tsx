import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderOpenDot, Plus, Copy, Trash2, Search, ArrowUpDown } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { useApp } from "../state/AppContext";
import { formatDate, formatNumber } from "../utils/format";
import type { AssessmentStatus } from "../types";

export default function Assessments() {
  const { assessments, setCurrentId, duplicateAssessment, deleteAssessment } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | "">("");
  const [sortDesc, setSortDesc] = useState(true);

  const list = useMemo(() => {
    let items = assessments;
    if (q.trim()) {
      const n = q.toLowerCase();
      items = items.filter((a) => a.customer.name.toLowerCase().includes(n) || (a.customer.customerId ?? "").toLowerCase().includes(n));
    }
    if (statusFilter) items = items.filter((a) => a.status === statusFilter);
    items = [...items].sort((a, b) =>
      sortDesc ? +new Date(b.updatedAt) - +new Date(a.updatedAt) : +new Date(a.updatedAt) - +new Date(b.updatedAt)
    );
    return items;
  }, [assessments, q, statusFilter, sortDesc]);

  const open = (id: string) => { setCurrentId(id); nav("/"); };

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle={`${assessments.length} assessment${assessments.length !== 1 ? "s" : ""} stored locally.`}
        icon={<FolderOpenDot className="w-5 h-5" />}
        actions={<Link to="/assessments/new" className="btn-primary"><Plus className="w-4 h-4" /> New</Link>}
      />
      <div className="card p-3 mb-4 flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8" placeholder="Search customer…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select md:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="">All statuses</option>
          <option>Draft</option><option>In Review</option><option>Completed</option><option>Archived</option>
        </select>
        <button className="btn-secondary" onClick={() => setSortDesc((v) => !v)}>
          <ArrowUpDown className="w-4 h-4" /> {sortDesc ? "Newest" : "Oldest"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[800px]">
            <thead><tr>
              <th>Customer</th><th>ID</th><th>Industry</th><th>Status</th><th>Users</th><th>Created</th><th>Updated</th><th></th>
            </tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="cursor-pointer" onClick={() => open(a.id)}>
                  <td className="font-medium text-slate-900">{a.customer.name || "Untitled"}</td>
                  <td>{a.customer.customerId || "—"}</td>
                  <td>{a.customer.industry || "—"}</td>
                  <td><span className="badge-gray">{a.status}</span></td>
                  <td>{formatNumber(a.customer.numberOfUsers || 0)}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td>{formatDate(a.updatedAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="btn-ghost !px-2 !py-1" title="Duplicate" onClick={() => duplicateAssessment(a.id)}><Copy className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost !px-2 !py-1 text-red-600" title="Delete" onClick={() => { if (confirm(`Delete "${a.customer.name}"?`)) deleteAssessment(a.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (<tr><td colSpan={8} className="text-center py-8 text-slate-500">No assessments match.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
