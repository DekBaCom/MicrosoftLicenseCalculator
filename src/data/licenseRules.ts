// =====================================================================
// Configurable licensing rules. Values reflect commonly documented
// Microsoft on-prem licensing patterns but ARE NOT official.
// Administrators can adjust these values in src/data/licenseRules.ts.
// =====================================================================

export interface LicenseRule {
  id: string;
  product: string;
  metric: "core" | "user" | "device" | "server";
  minimumCoresPerProcessor?: number;
  minimumCoresPerServer?: number;
  minimumProcessorsPerServer?: number;
  /** Number of VMs covered by a single qualifying Windows Server license. */
  virtualizationRights?: number;
  /** If true, the license covers unlimited OSEs when the physical host is fully licensed. */
  unlimitedVirtualization?: boolean;
  notes?: string;
}

export const LICENSE_RULES: Record<string, LicenseRule> = {
  "windows-std": {
    id: "windows-std",
    product: "Windows Server Standard",
    metric: "core",
    minimumCoresPerProcessor: 8,
    minimumCoresPerServer: 16,
    minimumProcessorsPerServer: 2,
    virtualizationRights: 2,
    notes:
      "Each Windows Server Standard license (16 cores) permits up to 2 virtual OSEs. Additional 16-core packs can be stacked to cover more VMs.",
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
      "Datacenter edition provides unlimited virtualization rights on a fully-licensed physical host.",
  },
  "windows-cal": {
    id: "windows-cal",
    product: "Windows Server CAL",
    metric: "user",
    notes: "Required per user or device accessing Windows Server.",
  },
  "rds-cal": {
    id: "rds-cal",
    product: "Remote Desktop Services CAL",
    metric: "user",
    notes:
      "Required per user or device accessing RDS functionality in addition to Windows Server CAL.",
  },
  "exchange-std": {
    id: "exchange-std",
    product: "Exchange Server Standard",
    metric: "server",
    notes: "Supports up to 5 mailbox databases per server.",
  },
  "exchange-ent": {
    id: "exchange-ent",
    product: "Exchange Server Enterprise",
    metric: "server",
    notes: "Supports up to 100 mailbox databases per server (versioned).",
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
    notes: "Enterprise CAL is additive to Standard CAL.",
  },
};

/** Threshold where Datacenter becomes more cost-effective than Standard (VM count per host). */
export const DATACENTER_VM_BREAKPOINT = 8;

/** Windows CAL recommendation: if users < devices * factor, device CAL is preferred. */
export const CAL_DEVICE_FACTOR = 1.2;
