import {
  cellNote,
  cellState,
  type CompareProduct,
  type FeatureRow,
} from "../data/m365Features";

const DISCLAIMER =
  "Indicative comparison based on public Microsoft plan comparisons. Features and bundles change often — verify against the Microsoft 365 service descriptions and your agreement before quoting.";

const SYMBOL = { yes: "✓", partial: "◐", no: "–" } as const;

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function exportCompareExcel(products: CompareProduct[], rows: FeatureRow[]) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const header = ["Category", "Feature", ...products.map((p) => p.short), "Notes"];
  const matrix: (string | number)[][] = [header];
  for (const r of rows) {
    const partialNotes = products
      .map((p) => {
        const n = cellNote(r, p.id);
        return n ? `${p.short}: ${n}` : "";
      })
      .filter(Boolean);
    const notes = [r.note ?? "", ...partialNotes].filter(Boolean).join(" | ");
    matrix.push([
      r.category,
      r.feature,
      ...products.map((p) => SYMBOL[cellState(r, p.id)]),
      notes,
    ]);
  }
  matrix.push([]);
  matrix.push(["Legend", "✓ = included   ◐ = partial / conditional   – = not included"]);
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  ws["!cols"] = [
    { wch: 34 },
    { wch: 58 },
    ...products.map(() => ({ wch: 12 })),
    { wch: 60 },
  ];
  ws["!freeze"] = { xSplit: 2, ySplit: 1 } as any;
  XLSX.utils.book_append_sheet(wb, ws, "Comparison");

  const prodSheet = XLSX.utils.aoa_to_sheet([
    ["Short", "Product", "Group", "Type", "Notes"],
    ...products.map((p) => [
      p.short,
      p.name,
      p.group,
      p.addOn ? "Add-on (needs base plan)" : "Base plan",
      p.note ?? "",
    ]),
  ]);
  prodSheet["!cols"] = [{ wch: 16 }, { wch: 44 }, { wch: 16 }, { wch: 26 }, { wch: 56 }];
  XLSX.utils.book_append_sheet(wb, prodSheet, "Products");

  const notes = XLSX.utils.aoa_to_sheet([
    ["Disclaimer"],
    [DISCLAIMER],
    [],
    ["Generated", new Date().toLocaleString()],
  ]);
  notes["!cols"] = [{ wch: 120 }];
  XLSX.utils.book_append_sheet(wb, notes, "Notes");

  XLSX.writeFile(wb, `m365_feature_compare_${stamp()}.xlsx`);
}

export function exportCompareWord(products: CompareProduct[], rows: FeatureRow[]) {
  const cellStyle = "border:1px solid #cbd5e1;padding:4px 6px;font-size:9pt;";
  const head = products
    .map(
      (p) =>
        `<th style="${cellStyle}background:#1d4ed8;color:#fff;text-align:center">${esc(p.short)}${
          p.addOn ? "<br/><span style='font-size:7pt;font-weight:normal'>add-on</span>" : ""
        }</th>`
    )
    .join("");

  const colSpan = products.length + 1;
  let body = "";
  let lastCat = "";
  for (const r of rows) {
    if (r.category !== lastCat) {
      lastCat = r.category;
      body += `<tr><td colspan="${colSpan}" style="${cellStyle}background:#e2e8f0;font-weight:bold">${esc(
        r.category
      )}</td></tr>`;
    }
    const cells = products
      .map((p) => {
        const s = cellState(r, p.id);
        const bg = s === "yes" ? "#dcfce7" : s === "partial" ? "#fef3c7" : "#ffffff";
        const color = s === "yes" ? "#15803d" : s === "partial" ? "#b45309" : "#94a3b8";
        return `<td style="${cellStyle}background:${bg};color:${color};text-align:center;font-weight:bold">${SYMBOL[s]}</td>`;
      })
      .join("");
    const notes = [
      r.note ?? "",
      ...products
        .map((p) => {
          const n = cellNote(r, p.id);
          return n ? `${p.short}: ${n}` : "";
        })
        .filter(Boolean),
    ]
      .filter(Boolean)
      .join("; ");
    body += `<tr><td style="${cellStyle}">${esc(r.feature)}${
      notes ? `<br/><span style="font-size:7.5pt;color:#64748b">${esc(notes)}</span>` : ""
    }</td>${cells}</tr>`;
  }

  const productList = products
    .map(
      (p) =>
        `<li><b>${esc(p.name)}</b> (${esc(p.group)}${p.addOn ? ", add-on" : ""})${
          p.note ? " — " + esc(p.note) : ""
        }</li>`
    )
    .join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Microsoft 365 Feature Comparison</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page WordSection1 { size: 29.7cm 21cm; mso-page-orientation: landscape; margin: 1.5cm; }
div.WordSection1 { page: WordSection1; }
body { font-family: Calibri, Arial, sans-serif; }
table { border-collapse: collapse; width: 100%; }
</style></head>
<body><div class="WordSection1">
<h1 style="color:#1d4ed8;font-size:18pt">Microsoft 365 Feature Comparison</h1>
<p style="font-size:9pt;color:#64748b">Generated ${esc(new Date().toLocaleString())} · ✓ included · ◐ partial / conditional · – not included</p>
<h3 style="font-size:11pt">Selected products</h3>
<ul style="font-size:9pt">${productList}</ul>
<table>
<thead><tr><th style="${cellStyle}background:#1d4ed8;color:#fff;text-align:left">Feature</th>${head}</tr></thead>
<tbody>${body}</tbody>
</table>
<p style="font-size:8pt;color:#b45309;margin-top:12px"><b>Disclaimer.</b> ${esc(DISCLAIMER)}</p>
</div></body></html>`;

  download(new Blob(["﻿", html], { type: "application/msword" }), `m365_feature_compare_${stamp()}.doc`);
}
