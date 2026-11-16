import { useMemo, useState } from "react";
import { BookOpen, Plus, Trash2, Search, Upload, Download } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Disclaimer } from "../components/common/Disclaimer";
import { useApp } from "../state/AppContext";
import type { ProductPricing } from "../types";
import { formatCurrency, formatNumber } from "../utils/format";
import { uid } from "../utils/id";
import { PRODUCT_CATEGORIES } from "../data/products";

export default function Catalog() {
  const { pricing, setPricing } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");

  const list = useMemo(() => {
    let x = pricing;
    if (q) {
      const n = q.toLowerCase();
      x = x.filter((p) => p.product.toLowerCase().includes(n) || p.sku.toLowerCase().includes(n));
    }
    if (cat) x = x.filter((p) => p.category === cat);
    return x;
  }, [pricing, q, cat]);

  const add = () => setPricing([
    ...pricing,
    { id: uid("pr"), product: "New Product", sku: `SKU-${Date.now()}`, category: "Other", metric: "user", unitPrice: 0, currency: "THB", billingType: "Perpetual", effectiveDate: new Date().toISOString().slice(0, 10), active: true },
  ]);
  const update = (id: string, patch: Partial<ProductPricing>) => setPricing(pricing.map((p) => p.id === id ? { ...p, ...patch } : p));
  const remove = (id: string) => setPricing(pricing.filter((p) => p.id !== id));

  const onImport = (file: File) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(String(fr.result));
        if (Array.isArray(data)) setPricing(data);
      } catch {
        alert("Could not parse JSON catalog.");
      }
    };
    fr.readAsText(file);
  };

  return (
    <>
      <PageHeader
        title="License Catalog"
        subtitle="Products, SKUs and pricing. Values are customer-configurable."
        icon={<BookOpen className="w-5 h-5" />}
        actions={
          <>
            <label className="btn-secondary cursor-pointer">
              <Upload className="w-4 h-4" /> Import JSON
              <input hidden type="file" accept="application/json" onChange={(e) => e.target.files && onImport(e.target.files[0])} />
            </label>
            <button className="btn-secondary" onClick={async () => { const m = await import("../export/excel"); m.exportTableCSV(pricing as any, "license_catalog.csv"); }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button className="btn-primary" onClick={add}><Plus className="w-4 h-4" /> Add Product</button>
          </>
        }
      />

      <div className="card p-3 mb-4 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8" placeholder="Search product or SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select md:w-56" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table min-w-[1200px]">
            <thead><tr>
              <th>Product</th><th>SKU</th><th>Category</th><th>Edition</th><th>Metric</th>
              <th>Unit Price</th><th>Currency</th><th>Billing</th><th>Effective</th><th>Active</th><th></th>
            </tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><input className="input !py-1 min-w-[200px]" value={p.product} onChange={(e) => update(p.id, { product: e.target.value })} /></td>
                  <td><input className="input !py-1 w-28" value={p.sku} onChange={(e) => update(p.id, { sku: e.target.value })} /></td>
                  <td>
                    <select className="select !py-1" value={p.category} onChange={(e) => update(p.id, { category: e.target.value as any })}>
                      {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td><input className="input !py-1 w-28" value={p.edition ?? ""} onChange={(e) => update(p.id, { edition: e.target.value })} /></td>
                  <td>
                    <select className="select !py-1" value={p.metric} onChange={(e) => update(p.id, { metric: e.target.value as any })}>
                      <option>core</option><option>user</option><option>device</option><option>server</option>
                    </select>
                  </td>
                  <td><input type="number" className="input !py-1 w-28 text-right" value={p.unitPrice} onChange={(e) => update(p.id, { unitPrice: Number(e.target.value) })} /></td>
                  <td>
                    <select className="select !py-1 w-24" value={p.currency} onChange={(e) => update(p.id, { currency: e.target.value as any })}>
                      <option>THB</option><option>USD</option><option>EUR</option>
                    </select>
                  </td>
                  <td>
                    <select className="select !py-1 w-28" value={p.billingType} onChange={(e) => update(p.id, { billingType: e.target.value as any })}>
                      <option>Perpetual</option><option>Subscription</option><option>SA</option>
                    </select>
                  </td>
                  <td><input className="input !py-1" type="date" value={p.effectiveDate} onChange={(e) => update(p.id, { effectiveDate: e.target.value })} /></td>
                  <td><input type="checkbox" checked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} /></td>
                  <td><button className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
              {list.length === 0 && (<tr><td colSpan={11} className="text-center text-slate-500 py-6">No products match.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          {formatNumber(list.length)} items — average price {formatCurrency(list.reduce((s, x) => s + x.unitPrice, 0) / Math.max(1, list.length), list[0]?.currency ?? "THB")}
        </div>
      </div>

      <div className="mt-4"><Disclaimer /></div>
    </>
  );
}
