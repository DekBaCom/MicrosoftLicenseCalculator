import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { parseFile, importWindowsFromRows, importSQLFromRows } from "../../import/serverImport";
import type { SQLServer, WindowsServer } from "../../types";

type ImportProps =
  | { mode: "windows"; onImport: (servers: WindowsServer[]) => void; label?: string }
  | { mode: "sql"; onImport: (servers: SQLServer[]) => void; label?: string };

export function ImportServersButton(props: ImportProps) {
  const { mode, onImport } = props;
  const label = props.label ?? "Import CSV / XLSX";
  type T = WindowsServer | SQLServer;
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{
    rows: T[];
    skipped: Array<{ row: number; reason: string }>;
    fileName: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const rows = await parseFile(file);
      const result =
        mode === "windows"
          ? importWindowsFromRows(rows)
          : importSQLFromRows(rows);
      setPreview({
        rows: result.ok as T[],
        skipped: result.skipped,
        fileName: file.name,
      });
    } catch (e) {
      alert("Could not parse file: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  function commit() {
    if (!preview) return;
    // mode narrows T so the callback type is satisfied; cast is safe.
    if (mode === "windows") onImport(preview.rows as WindowsServer[]);
    else onImport(preview.rows as SQLServer[]);
    setPreview(null);
  }

  return (
    <>
      <button
        className="btn-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="CSV, XLSX, or RVTools vHost sheet"
      >
        <Upload className="w-4 h-4" /> {label}
      </button>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {preview && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-soft w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">
                  Import preview — {preview.fileName}
                </div>
                <div className="text-xs text-slate-500">
                  {preview.rows.length} row(s) parsed · {preview.skipped.length} skipped
                </div>
              </div>
              <button
                className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                onClick={() => setPreview(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              {preview.rows.length > 0 ? (
                <table className="table">
                  <thead>
                    {mode === "windows" ? (
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Sockets</th>
                        <th>Cores/CPU</th>
                        <th>Total Cores</th>
                        <th>Version</th>
                        <th>Edition</th>
                        <th>VMs</th>
                        <th>HA</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Name</th>
                        <th>Version</th>
                        <th>Edition</th>
                        <th>Model</th>
                        <th>Type</th>
                        <th>Sockets</th>
                        <th>Cores</th>
                        <th>SA</th>
                        <th>Passive</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {preview.rows.map((r: any) => (
                      <tr key={r.id}>
                        {mode === "windows" ? (
                          <>
                            <td>{r.name}</td>
                            <td>{r.type}</td>
                            <td>{r.cpuSockets}</td>
                            <td>{r.coresPerCpu}</td>
                            <td>{r.totalCores}</td>
                            <td>{r.version}</td>
                            <td>{r.edition}</td>
                            <td>{r.vmCount}</td>
                            <td>{r.ha ? "Yes" : "No"}</td>
                          </>
                        ) : (
                          <>
                            <td>{r.name}</td>
                            <td>{r.version}</td>
                            <td>{r.edition}</td>
                            <td>{r.model}</td>
                            <td>{r.type}</td>
                            <td>{r.cpuSockets}</td>
                            <td>{r.cores}</td>
                            <td>{r.hasSoftwareAssurance ? "Yes" : "No"}</td>
                            <td>{r.passiveFailover ? "Yes" : "No"}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-slate-500 py-6">
                  No rows could be parsed from this file.
                </div>
              )}

              {preview.skipped.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <div className="font-semibold mb-1">Skipped rows:</div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {preview.skipped.slice(0, 20).map((s) => (
                      <li key={s.row}>Row {s.row}: {s.reason}</li>
                    ))}
                    {preview.skipped.length > 20 && <li>…and {preview.skipped.length - 20} more</li>}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setPreview(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={commit}
                disabled={preview.rows.length === 0}
              >
                Add {preview.rows.length} server{preview.rows.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
