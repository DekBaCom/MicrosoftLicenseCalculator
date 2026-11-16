import { useMemo, useState, type ReactNode } from "react";
import { Scale, FileSpreadsheet, FileText, Check, Minus, CircleDot, Search } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";
import {
  COMPARE_PRESETS,
  COMPARE_PRODUCTS,
  FEATURE_ROWS,
  cellNote,
  cellState,
  type CompareId,
  type CompareProduct,
} from "../data/m365Features";
import { exportCompareExcel, exportCompareWord } from "../export/m365Compare";

const GROUPS: CompareProduct["group"][] = ["Office 365", "Microsoft 365", "EMS", "AI", "Suite pack"];

export default function M365Compare() {
  const [selected, setSelected] = useState<CompareId[]>(["m365-e3", "m365-e5", "m365-e7"]);
  const [diffOnly, setDiffOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [busy, setBusy] = useState(false);

  const products = useMemo(
    () => COMPARE_PRODUCTS.filter((p) => selected.includes(p.id)),
    [selected]
  );
  const categories = useMemo(
    () => Array.from(new Set(FEATURE_ROWS.map((r) => r.category))),
    []
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FEATURE_ROWS.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (q && !r.feature.toLowerCase().includes(q)) return false;
      if (diffOnly && products.length > 1) {
        const states = new Set(products.map((p) => cellState(r, p.id)));
        if (states.size < 2) return false;
      }
      return true;
    });
  }, [products, query, category, diffOnly]);

  const toggle = (id: CompareId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onExcel = async () => {
    setBusy(true);
    try {
      await exportCompareExcel(products, rows);
    } finally {
      setBusy(false);
    }
  };

  const noSelection = products.length === 0;

  return (
    <>
      <PageHeader
        title="Microsoft 365 Feature Comparison"
        subtitle="ติ๊กเลือก plan / add-on ที่ต้องการเทียบ แล้วดู feature mapping — export เป็น Excel หรือ Word ได้"
        icon={<Scale className="w-5 h-5" />}
        actions={
          <>
            <button
              className="btn-secondary"
              disabled={noSelection || rows.length === 0 || busy}
              onClick={onExcel}
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button
              className="btn-secondary"
              disabled={noSelection || rows.length === 0}
              onClick={() => exportCompareWord(products, rows)}
            >
              <FileText className="w-4 h-4" /> Export Word
            </button>
          </>
        }
      />

      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Presets</span>
          {COMPARE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setSelected(p.ids)}
              className="px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-brand-50 hover:border-brand-200 text-xs"
            >
              {p.label}
            </button>
          ))}
          <span className="ml-auto flex gap-2">
            <button
              onClick={() => setSelected(COMPARE_PRODUCTS.map((p) => p.id))}
              className="text-xs text-brand-700 hover:underline"
            >
              Select all
            </button>
            <button onClick={() => setSelected([])} className="text-xs text-slate-500 hover:underline">
              Clear
            </button>
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {GROUPS.map((g) => (
            <div key={g}>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {g}
              </div>
              <div className="flex flex-col gap-1.5">
                {COMPARE_PRODUCTS.filter((p) => p.group === g).map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      title={p.note ?? p.name}
                      className={clsx(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer select-none",
                        on
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(p.id)}
                        className="accent-blue-700"
                      />
                      <span className="font-medium">{p.short}</span>
                      {p.addOn && (
                        <span className="ml-auto text-[10px] px-1.5 rounded bg-amber-100 text-amber-800">
                          add-on
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3 mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feature…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white max-w-full"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={diffOnly}
            onChange={(e) => setDiffOnly(e.target.checked)}
            className="accent-blue-700"
          />
          Differences only
        </label>
        <div className="flex items-center gap-3 text-xs text-slate-500 ml-auto">
          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-600" /> Included</span>
          <span className="flex items-center gap-1"><CircleDot className="w-3.5 h-3.5 text-amber-600" /> Partial</span>
          <span className="flex items-center gap-1"><Minus className="w-3.5 h-3.5 text-slate-400" /> No</span>
        </div>
      </div>

      {noSelection ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          เลือกอย่างน้อย 1 รายการด้านบนเพื่อดู feature matrix
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 min-w-[240px] border-b border-slate-200">
                  Feature
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="px-2 py-2 text-center min-w-[84px] border-b border-slate-200 font-semibold text-slate-700"
                    title={p.name}
                  >
                    {p.short}
                    {p.addOn && <div className="text-[10px] font-normal text-amber-700">add-on</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={products.length + 1} className="p-6 text-center text-slate-500">
                    No features match the current filter.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => {
                const showCat = i === 0 || rows[i - 1].category !== r.category;
                return (
                  <FragmentRows key={r.category + r.feature} showCat={showCat} cat={r.category} span={products.length + 1}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="sticky left-0 bg-white px-3 py-2 align-top">
                        <div className="text-slate-900">{r.feature}</div>
                        {r.note && <div className="text-[11px] text-slate-500 mt-0.5">{r.note}</div>}
                      </td>
                      {products.map((p) => {
                        const s = cellState(r, p.id);
                        const n = cellNote(r, p.id);
                        return (
                          <td key={p.id} className="px-2 py-2 text-center align-top" title={n || undefined}>
                            {s === "yes" && <Check className="w-4 h-4 text-green-600 inline" aria-label="Included" />}
                            {s === "partial" && (
                              <span className="inline-flex flex-col items-center">
                                <CircleDot className="w-4 h-4 text-amber-600" aria-label="Partial" />
                                {n && <span className="text-[10px] text-amber-700 leading-tight mt-0.5 max-w-[120px]">{n}</span>}
                              </span>
                            )}
                            {s === "no" && <Minus className="w-4 h-4 text-slate-300 inline" aria-label="Not included" />}
                          </td>
                        );
                      })}
                    </tr>
                  </FragmentRows>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="text-xs text-slate-500">
          Export จะใช้เฉพาะผลิตภัณฑ์ที่ติ๊กเลือก และแถวที่ผ่านตัวกรองปัจจุบัน ({rows.length} features).
          ไฟล์ Word เป็น .doc (HTML) เปิดด้วย Microsoft Word ได้ทันที
        </div>
        <Disclaimer compact />
      </div>
    </>
  );
}

function FragmentRows({
  showCat,
  cat,
  span,
  children,
}: {
  showCat: boolean;
  cat: string;
  span: number;
  children: ReactNode;
}) {
  return (
    <>
      {showCat && (
        <tr className="bg-slate-100">
          <td colSpan={span} className="px-3 py-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {cat}
          </td>
        </tr>
      )}
      {children}
    </>
  );
}
