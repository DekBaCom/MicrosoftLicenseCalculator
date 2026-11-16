import type { WindowsServer, SQLServer } from "../types";
import { uid } from "../utils/id";

/**
 * Flexible column matching: accept many common spellings/abbreviations
 * (incl. RVTools "vHost" tab, PowerCLI exports, custom CSVs).
 */
type Row = Record<string, unknown>;
type Mapper = (row: Row) => string | undefined;

function pick(row: Row, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const key = keys.find((k) => k.trim().toLowerCase() === c.trim().toLowerCase());
    if (key != null && row[key] != null && row[key] !== "") {
      return String(row[key]);
    }
  }
  return undefined;
}

function toInt(v: string | undefined, fallback = 0): number {
  if (v == null) return fallback;
  const n = parseInt(String(v).replace(/[^\d.-]/g, ""), 10);
  return isNaN(n) ? fallback : n;
}

function toBool(v: string | undefined): boolean {
  if (!v) return false;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "on" || s === "enabled";
}

const WINDOWS_COLS = {
  name: ["Name", "Server", "Host", "Hostname", "Server Name", "VM"],
  type: ["Type", "Server Type", "Form Factor"],
  sockets: ["Sockets", "CPU Sockets", "# CPU", "NumCpu", "Num CPUs", "# Sockets", "CPU Count"],
  coresPerCpu: ["Cores/CPU", "Cores per CPU", "CoresPerCPU", "Cores per Socket", "Cores/Socket"],
  totalCores: ["Total Cores", "# Cores", "Cores", "CoreCount", "Core Count", "Logical Cores"],
  vmCount: ["VMs", "VM Count", "# VMs", "VirtualMachines", "Num VMs"],
  version: ["Version", "OS", "OS Version", "Windows Version", "Product"],
  edition: ["Edition", "OS Edition", "Windows Edition"],
  role: ["Role", "Function", "Purpose", "Notes"],
  ha: ["HA", "High Availability", "Clustered", "In Cluster"],
};

const SQL_COLS = {
  name: ["Name", "Server", "Host", "Instance", "Hostname"],
  version: ["Version", "SQL Version", "Product Version"],
  edition: ["Edition", "SQL Edition"],
  model: ["Model", "License Model", "Licensing Model"],
  type: ["Type", "Form Factor"],
  sockets: ["Sockets", "CPU Sockets", "# CPU", "Processor Count"],
  cores: ["Cores", "Total Cores", "# Cores", "Core Count", "Logical Cores"],
  sa: ["SA", "SoftwareAssurance", "Software Assurance", "Has SA"],
  passiveFailover: ["Passive Failover", "HA", "DR", "Replica", "Standby"],
  role: ["Role", "Function", "Purpose"],
};

export interface ImportResult<T> {
  ok: T[];
  skipped: Array<{ row: number; reason: string }>;
}

export function importWindowsFromRows(rows: Row[]): ImportResult<WindowsServer> {
  const ok: WindowsServer[] = [];
  const skipped: ImportResult<WindowsServer>["skipped"] = [];

  rows.forEach((r, i) => {
    const name = pick(r, WINDOWS_COLS.name)?.trim();
    if (!name) {
      skipped.push({ row: i + 1, reason: "No server name / hostname column found" });
      return;
    }

    const sockets = toInt(pick(r, WINDOWS_COLS.sockets), 0);
    const cpc = toInt(pick(r, WINDOWS_COLS.coresPerCpu), 0);
    const totalCoresRaw = toInt(pick(r, WINDOWS_COLS.totalCores), 0);
    // If total cores is present and cores/cpu is missing, derive cores/cpu = totalCores/sockets.
    const totalCores = totalCoresRaw > 0 ? totalCoresRaw : sockets * cpc;
    const coresPerCpu = cpc > 0 ? cpc : sockets > 0 ? Math.floor(totalCores / sockets) : 0;

    const typeRaw = (pick(r, WINDOWS_COLS.type) || "").toLowerCase();
    const type = typeRaw.includes("vm") || typeRaw.includes("virtual") ? "VM" : "Physical";

    const version = normalizeWindowsVersion(pick(r, WINDOWS_COLS.version));
    const edition = normalizeWindowsEdition(pick(r, WINDOWS_COLS.edition));

    ok.push({
      id: uid("srv"),
      name,
      type,
      cpuSockets: Math.max(1, sockets || 1),
      coresPerCpu: Math.max(1, coresPerCpu || 1),
      totalCores: Math.max(sockets * coresPerCpu, totalCores),
      version,
      edition,
      vmCount: toInt(pick(r, WINDOWS_COLS.vmCount), 0),
      role: pick(r, WINDOWS_COLS.role) || "",
      ha: toBool(pick(r, WINDOWS_COLS.ha)),
    });
  });

  return { ok, skipped };
}

export function importSQLFromRows(rows: Row[]): ImportResult<SQLServer> {
  const ok: SQLServer[] = [];
  const skipped: ImportResult<SQLServer>["skipped"] = [];

  rows.forEach((r, i) => {
    const name = pick(r, SQL_COLS.name)?.trim();
    if (!name) {
      skipped.push({ row: i + 1, reason: "No server / instance name" });
      return;
    }
    const typeRaw = (pick(r, SQL_COLS.type) || "VM").toLowerCase();
    const type = typeRaw.includes("vm") || typeRaw.includes("virtual") ? "VM" : "Physical";
    const editionRaw = (pick(r, SQL_COLS.edition) || "Standard").toLowerCase();
    const edition = editionRaw.includes("ent") ? "Enterprise" : "Standard";
    const modelRaw = (pick(r, SQL_COLS.model) || "PerCore").toLowerCase();
    const model = modelRaw.includes("cal") || modelRaw.includes("server") ? "ServerCAL" : "PerCore";

    ok.push({
      id: uid("sql"),
      name,
      version: pick(r, SQL_COLS.version) || "SQL Server 2022",
      edition,
      model,
      type,
      cpuSockets: Math.max(1, toInt(pick(r, SQL_COLS.sockets), 1)),
      cores: Math.max(1, toInt(pick(r, SQL_COLS.cores), 1)),
      hasSoftwareAssurance: toBool(pick(r, SQL_COLS.sa)),
      passiveFailover: toBool(pick(r, SQL_COLS.passiveFailover)),
      role: pick(r, SQL_COLS.role) || "",
    });
  });

  return { ok, skipped };
}

function normalizeWindowsVersion(raw?: string): WindowsServer["version"] {
  if (!raw) return "Windows Server 2022";
  const s = raw.toLowerCase();
  if (s.includes("2025")) return "Windows Server 2025";
  if (s.includes("2022")) return "Windows Server 2022";
  if (s.includes("2019")) return "Windows Server 2019";
  if (s.includes("2016")) return "Windows Server 2016";
  return "Other";
}

function normalizeWindowsEdition(raw?: string): WindowsServer["edition"] {
  if (!raw) return "Standard";
  const s = raw.toLowerCase();
  if (s.includes("datacenter") || s.includes("dc")) return "Datacenter";
  if (s.includes("essentials")) return "Essentials";
  return "Standard";
}

/**
 * Parse a File (CSV or XLSX) and return rows from the first sheet with data,
 * preferring an RVTools "vHost" tab if present.
 */
export async function parseFile(file: File): Promise<Row[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  // RVTools uses "vHost" sheet; fall back to first sheet.
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "vhost") ||
    wb.SheetNames.find((n) => n.toLowerCase().includes("host")) ||
    wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
}
