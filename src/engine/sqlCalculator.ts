import type {
  SQLAssessment,
  SQLCalculationResult,
  SQLCoreLicenseResult,
  SQLServer,
} from "../types";
import { LICENSE_RULES } from "../data/licenseRules";

/** Compute SQL core license requirement for one server, honoring minimums and Standard edition's 32-core cap. */
export function computeSQLServerCoreRequirement(s: SQLServer): SQLCoreLicenseResult {
  const stdRule = LICENSE_RULES["sql-std"];
  const entRule = LICENSE_RULES["sql-ent"];
  const rule = s.edition === "Enterprise" ? entRule : stdRule;
  const notes: string[] = [];

  if (s.model === "ServerCAL") {
    if (s.edition === "Enterprise") {
      notes.push("Enterprise edition does not support Server+CAL — switching to per-core calculation.");
    } else {
      return {
        serverId: s.id,
        serverName: s.name,
        edition: s.edition,
        model: "ServerCAL",
        requiredCoreLicenses: 0,
        notes: ["Server+CAL model: one Server license per instance plus one CAL per user/device."],
      };
    }
  }

  const minPerProc = rule.minimumCoresPerProcessor ?? 4;
  const minPerVM = rule.minimumCoresPerVM ?? 4;

  let required: number;
  if (s.type === "VM") {
    required = Math.max(s.cores, minPerVM);
    if (!s.hasSoftwareAssurance && s.edition === "Standard") {
      notes.push("Per-VM licensing requires Software Assurance or subscription for SQL Standard.");
    }
  } else {
    required = Math.max(s.cores, s.cpuSockets * minPerProc);
  }

  // Standard caps at 32 cores per instance
  if (s.edition === "Standard" && required > 32) {
    notes.push(`SQL Standard caps at 32 licensed cores per instance; required cores (${required}) exceed cap.`);
    required = 32;
  }

  if (s.passiveFailover && s.hasSoftwareAssurance) {
    notes.push("Passive failover replica covered under Software Assurance — no additional licenses required.");
  } else if (s.passiveFailover && !s.hasSoftwareAssurance) {
    required = required * 2;
    notes.push("Passive failover without SA — requires licensing the replica as well.");
  }

  return {
    serverId: s.id,
    serverName: s.name,
    edition: s.edition,
    model: "PerCore",
    requiredCoreLicenses: required,
    notes,
  };
}

export function calculateSQL(sql: SQLAssessment | undefined): SQLCalculationResult {
  const servers = sql?.servers ?? [];
  const perServer = servers.map(computeSQLServerCoreRequirement);

  const totalStandardCoresRequired = perServer
    .filter((r) => r.edition === "Standard" && r.model === "PerCore")
    .reduce((s, r) => s + r.requiredCoreLicenses, 0);

  const totalEnterpriseCoresRequired = perServer
    .filter((r) => r.edition === "Enterprise")
    .reduce((s, r) => s + r.requiredCoreLicenses, 0);

  const serverLicensesRequired = servers.filter(
    (s) => s.model === "ServerCAL" && s.edition === "Standard"
  ).length;

  return {
    totalStandardCoresRequired,
    totalEnterpriseCoresRequired,
    serverLicensesRequired,
    calRequired: sql?.calUsers ?? 0,
    perServer,
    notes: [],
  };
}
