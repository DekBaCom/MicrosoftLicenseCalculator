// =====================================================================
// Configurable licensing rules. Values reflect published Microsoft
// Product Terms / Licensing Briefs as of November 2025 but ARE NOT
// official. Administrators can adjust these values here.
//
// Sources (public):
//  - https://www.microsoft.com/licensing/guidance/Windows-Server-2025
//  - https://www.microsoft.com/licensing/guidance/Windows-Server-Virtualization-Technologies
//  - https://www.microsoft.com/licensing/guidance/Server_Virtualization
//  - https://www.microsoft.com/licensing/guidance/SQL
// =====================================================================

export interface LicenseRule {
  id: string;
  product: string;
  metric: "core" | "user" | "device" | "server";
  minimumCoresPerProcessor?: number;
  minimumCoresPerServer?: number;
  minimumCoresPerVM?: number;
  minimumProcessorsPerServer?: number;
  /** Number of VMs covered by a single qualifying Windows Server license. */
  virtualizationRights?: number;
  /** If true, the license covers unlimited OSEs when the physical host is fully licensed. */
  unlimitedVirtualization?: boolean;
  /** Max cores an Edition can utilize per instance (e.g. SQL Standard = 32). */
  maxCoresPerInstance?: number;
  /** Max users this edition supports (e.g. Windows Server Essentials = 25). */
  maxUsers?: number;
  /** Max devices this edition supports (e.g. Windows Server Essentials = 50). */
  maxDevices?: number;
  /** SA/subscription required to use this rule set (e.g. per-VM Windows licensing). */
  requiresSoftwareAssurance?: boolean;
  notes?: string;
}

export const LICENSE_RULES: Record<string, LicenseRule> = {
  // -------------------- Windows Server --------------------
  "windows-std": {
    id: "windows-std",
    product: "Windows Server Standard",
    metric: "core",
    minimumCoresPerProcessor: 8,
    minimumCoresPerServer: 16,
    minimumProcessorsPerServer: 2,
    virtualizationRights: 2,
    notes:
      "Each fully-licensed Standard set (16 cores) permits up to 2 virtual OSEs. Each additional 16-core set permits +2 VMs (stacking).",
  },
  "windows-dc": {
    id: "windows-dc",
    product: "Windows Server Datacenter",
    metric: "core",
    minimumCoresPerProcessor: 8,
    minimumCoresPerServer: 16,
    minimumProcessorsPerServer: 2,
    unlimitedVirtualization: true,
    notes:
      "Datacenter edition provides unlimited OSEs on a fully-licensed physical host.",
  },
  "windows-essentials": {
    id: "windows-essentials",
    product: "Windows Server Essentials",
    metric: "server",
    maxUsers: 25,
    maxDevices: 50,
    minimumCoresPerServer: 10,
    notes:
      "OEM-only, single-socket, max 10 cores, 1 VM. Hard caps: 25 users and 50 devices. No separate CALs required.",
  },
  "windows-vm": {
    id: "windows-vm",
    product: "Windows Server (per-VM licensing)",
    metric: "core",
    minimumCoresPerVM: 8,
    requiresSoftwareAssurance: true,
    notes:
      "Per-VM licensing requires active Software Assurance or subscription. Minimum 8 core licenses per VM. Licenses are portable within a Server Farm.",
  },

  // -------------------- Windows CAL / RDS --------------------
  "windows-cal": {
    id: "windows-cal",
    product: "Windows Server CAL",
    metric: "user",
    notes:
      "Required per user or per device accessing Windows Server. No CAL required for the host OSE when solely hosting virtualization workloads.",
  },
  "rds-cal": {
    id: "rds-cal",
    product: "Remote Desktop Services CAL",
    metric: "user",
    notes:
      "Additive CAL required in addition to Windows Server CAL for RDS access.",
  },

  // -------------------- Exchange --------------------
  "exchange-std": {
    id: "exchange-std",
    product: "Exchange Server Standard",
    metric: "server",
    notes:
      "Server + CAL model. One license per running instance. External users included since the 2013 release — no External Connector required.",
  },
  "exchange-ent": {
    id: "exchange-ent",
    product: "Exchange Server Enterprise",
    metric: "server",
    notes:
      "Server + CAL model. Supports more mailbox databases per server than Standard.",
  },
  "exchange-std-cal": {
    id: "exchange-std-cal",
    product: "Exchange Standard CAL",
    metric: "user",
  },
  "exchange-ent-cal": {
    id: "exchange-ent-cal",
    product: "Exchange Enterprise CAL",
    metric: "user",
    notes: "Additive to Standard CAL.",
  },

  // -------------------- SQL Server 2025 --------------------
  "sql-std": {
    id: "sql-std",
    product: "SQL Server Standard",
    metric: "core",
    minimumCoresPerProcessor: 4,
    minimumCoresPerVM: 4,
    maxCoresPerInstance: 32,
    notes:
      "Per-core or Server+CAL. Max 32 licensed cores per instance. Per-VM licensing requires SA/subscription.",
  },
  "sql-ent": {
    id: "sql-ent",
    product: "SQL Server Enterprise",
    metric: "core",
    minimumCoresPerProcessor: 4,
    minimumCoresPerVM: 4,
    notes:
      "Per-core only. With SA/subscription on all physical cores: unlimited instances across physical/virtual OSEs on that host.",
  },
  "sql-cal": {
    id: "sql-cal",
    product: "SQL Server CAL",
    metric: "user",
    notes:
      "Required per user or device accessing SQL Server (Standard Server+CAL model). No External Connector option for SQL.",
  },
};

/** Threshold where Datacenter becomes more cost-effective than Standard (VM count per host). */
export const DATACENTER_VM_BREAKPOINT = 8;

/** Windows CAL recommendation: if users > devices * factor, device CAL is preferred. */
export const CAL_DEVICE_FACTOR = 1.2;

// =====================================================================
// Azure Hybrid Benefit (AHB)
// Rules used by the Scenario / Calculator to translate on-prem licenses
// into Azure VM coverage.
// =====================================================================
export const AHB = {
  /** Windows Server: 16 qualifying WS licenses with SA cover up to 2 VMs. */
  windowsVMsPer16Licenses: 2,
  windowsLicensesPerVMGroup: 16,
  /** SQL Enterprise core → vCores (Azure SQL General Purpose). */
  sqlEnterpriseCoreToGPvCores: 16,
  /** SQL Enterprise core → vCores (Azure SQL Business Critical). */
  sqlEnterpriseCoreToBCvCores: 4,
  /** SQL Standard core → vCores (Azure SQL General Purpose). */
  sqlStandardCoreToGPvCores: 16,
  /** SQL Standard core → vCores (Azure SQL Business Critical). */
  sqlStandardCoreToBCvCores: 4,
};
