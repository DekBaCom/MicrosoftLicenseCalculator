/**
 * Microsoft 365 feature comparison matrix (indicative).
 * Based on public Microsoft plan comparisons; features and bundles change often.
 * Always confirm against the Microsoft 365 service descriptions / licensing site.
 */

export type CompareId =
  | "o365-e1"
  | "o365-e3"
  | "o365-e5"
  | "m365-e3"
  | "m365-e5"
  | "m365-e7"
  | "ems-e3"
  | "ems-e5"
  | "agent-365"
  | "copilot"
  | "defender-suite"
  | "purview-suite"
  | "entra-suite"
  | "e5-ipg";

export interface CompareProduct {
  id: CompareId;
  short: string;
  name: string;
  group: "Office 365" | "Microsoft 365" | "EMS" | "AI" | "Suite pack";
  /** Add-on that must be stacked on a base plan. */
  addOn?: boolean;
  note?: string;
}

export const COMPARE_PRODUCTS: CompareProduct[] = [
  { id: "o365-e1", short: "O365 E1", name: "Office 365 E1", group: "Office 365", note: "Web/mobile Office only" },
  { id: "o365-e3", short: "O365 E3", name: "Office 365 E3", group: "Office 365" },
  { id: "o365-e5", short: "O365 E5", name: "Office 365 E5", group: "Office 365" },
  { id: "m365-e3", short: "M365 E3", name: "Microsoft 365 E3", group: "Microsoft 365", note: "O365 E3 + EMS E3 + Windows Enterprise E3" },
  { id: "m365-e5", short: "M365 E5", name: "Microsoft 365 E5", group: "Microsoft 365", note: "M365 E3 + security, compliance, voice, analytics" },
  { id: "m365-e7", short: "M365 E7", name: "Microsoft 365 E7", group: "Microsoft 365", note: "M365 E5 + Copilot + Entra Suite + Agent 365" },
  { id: "ems-e3", short: "EMS E3", name: "Enterprise Mobility + Security E3", group: "EMS" },
  { id: "ems-e5", short: "EMS E5", name: "Enterprise Mobility + Security E5", group: "EMS" },
  { id: "copilot", short: "Copilot", name: "Microsoft 365 Copilot", group: "AI", addOn: true },
  { id: "agent-365", short: "Agent 365", name: "Microsoft Agent 365", group: "AI", addOn: true, note: "Agent management & governance" },
  { id: "defender-suite", short: "Defender Suite", name: "Microsoft Defender Suite", group: "Suite pack", addOn: true },
  { id: "purview-suite", short: "Purview Suite", name: "Microsoft Purview Suite", group: "Suite pack", addOn: true },
  { id: "entra-suite", short: "Entra Suite", name: "Microsoft Entra Suite", group: "Suite pack", addOn: true, note: "Requires Entra ID P1" },
  { id: "e5-ipg", short: "E5 IPG", name: "M365 E5 Information Protection & Governance", group: "Suite pack", addOn: true },
];

export type CellState = "yes" | "partial" | "no";

export interface FeatureRow {
  category: string;
  feature: string;
  /** Products that fully include the feature. */
  yes: CompareId[];
  /** Products that include it partially / conditionally, with a note. */
  partial?: Partial<Record<CompareId, string>>;
  note?: string;
}

const ENT_SUITES: CompareId[] = ["o365-e3", "o365-e5", "m365-e3", "m365-e5", "m365-e7"];
const ALL_SUITES: CompareId[] = ["o365-e1", ...ENT_SUITES];
const E5_FAMILY: CompareId[] = ["m365-e5", "m365-e7"];

export const FEATURE_ROWS: FeatureRow[] = [
  // ---------- Productivity & collaboration ----------
  { category: "Productivity & Collaboration", feature: "Office web & mobile apps", yes: ALL_SUITES },
  { category: "Productivity & Collaboration", feature: "Desktop Office apps (Word, Excel, PowerPoint, Outlook)", yes: ENT_SUITES, note: "O365 E1 = web/mobile only" },
  { category: "Productivity & Collaboration", feature: "Exchange Online mailbox", yes: ALL_SUITES, note: "E1 50 GB; E3/E5 100 GB" },
  { category: "Productivity & Collaboration", feature: "Unlimited / auto-expanding archive", yes: ENT_SUITES },
  { category: "Productivity & Collaboration", feature: "SharePoint & OneDrive (1 TB+)", yes: ALL_SUITES },
  { category: "Productivity & Collaboration", feature: "Microsoft Teams (chat, meetings)", yes: ALL_SUITES, note: "Teams is unbundled in some regions (EEA/Switzerland)" },
  { category: "Productivity & Collaboration", feature: "Teams Phone (PSTN calling)", yes: ["o365-e5", ...E5_FAMILY], note: "Add-on available for other plans" },
  { category: "Productivity & Collaboration", feature: "Audio Conferencing", yes: ["o365-e5", ...E5_FAMILY] },
  { category: "Productivity & Collaboration", feature: "Power BI Pro", yes: ["o365-e5", ...E5_FAMILY] },

  // ---------- Copilot & AI ----------
  { category: "Copilot & AI", feature: "Copilot Chat (web-grounded, Entra account)", yes: ALL_SUITES, note: "Available with Entra ID work account" },
  { category: "Copilot & AI", feature: "Microsoft 365 Copilot (in Word/Excel/PowerPoint/Outlook/Teams)", yes: ["copilot", "m365-e7"], note: "Copilot add-on needs an eligible base plan" },
  { category: "Copilot & AI", feature: "Agent 365 (agent registry, access & governance)", yes: ["agent-365", "m365-e7"] },
  {
    category: "Copilot & AI",
    feature: "Security Copilot",
    yes: [],
    partial: { "m365-e5": "Included with conditions — verify SCU allocation", "m365-e7": "Included with conditions — verify SCU allocation" },
  },

  // ---------- Identity & access ----------
  { category: "Identity & Access", feature: "Entra ID P1 (Conditional Access, MFA, SSPR)", yes: ["m365-e3", ...E5_FAMILY, "ems-e3", "ems-e5"] },
  {
    category: "Identity & Access",
    feature: "Entra ID Protection (risk-based Conditional Access)",
    yes: [...E5_FAMILY, "ems-e5", "entra-suite"],
    partial: { "defender-suite": "Entra ID P2 included — verify SKU" },
  },
  { category: "Identity & Access", feature: "Privileged Identity Management (PIM)", yes: [...E5_FAMILY, "ems-e5"], partial: { "defender-suite": "Entra ID P2 included — verify SKU" } },
  { category: "Identity & Access", feature: "Entra ID Governance (access reviews, entitlement mgmt)", yes: ["entra-suite", "m365-e7"] },
  { category: "Identity & Access", feature: "Entra Private Access (ZTNA)", yes: ["entra-suite", "m365-e7"] },
  { category: "Identity & Access", feature: "Entra Internet Access (secure web gateway)", yes: ["entra-suite", "m365-e7"] },
  { category: "Identity & Access", feature: "Entra Verified ID", yes: ["entra-suite", "m365-e7"] },

  // ---------- Endpoint & device management ----------
  { category: "Endpoint & Device Management", feature: "Intune (MDM / MAM)", yes: ["m365-e3", ...E5_FAMILY, "ems-e3", "ems-e5"] },
  { category: "Endpoint & Device Management", feature: "Windows Enterprise E3 (Autopatch, upgrade rights)", yes: ["m365-e3", ...E5_FAMILY], note: "E5/E7 include Windows Enterprise E5" },
  { category: "Endpoint & Device Management", feature: "Windows 365 / AVD licensing rights (Windows Enterprise)", yes: ["m365-e3", ...E5_FAMILY] },

  // ---------- Security ----------
  { category: "Security (Defender)", feature: "Defender for Endpoint P1", yes: ["m365-e3", ...E5_FAMILY] },
  { category: "Security (Defender)", feature: "Defender for Endpoint P2 (EDR)", yes: [...E5_FAMILY, "defender-suite"] },
  { category: "Security (Defender)", feature: "Defender for Office 365 P2 (Safe Links/Attachments, AIR)", yes: ["o365-e5", ...E5_FAMILY, "defender-suite"] },
  { category: "Security (Defender)", feature: "Defender for Identity", yes: [...E5_FAMILY, "ems-e5", "defender-suite"] },
  { category: "Security (Defender)", feature: "Defender for Cloud Apps (CASB)", yes: [...E5_FAMILY, "ems-e5", "defender-suite"] },
  { category: "Security (Defender)", feature: "Microsoft Defender XDR (unified portal)", yes: [...E5_FAMILY, "defender-suite"] },

  // ---------- Information protection & compliance ----------
  { category: "Information Protection & Compliance (Purview)", feature: "Sensitivity labels (manual)", yes: ["o365-e3", "o365-e5", "m365-e3", ...E5_FAMILY, "ems-e3", "ems-e5", "purview-suite", "e5-ipg"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Auto-labeling & trainable classifiers", yes: [...E5_FAMILY, "ems-e5", "purview-suite", "e5-ipg"] },
  { category: "Information Protection & Compliance (Purview)", feature: "DLP for Exchange / SharePoint / OneDrive", yes: ["o365-e3", "o365-e5", "m365-e3", ...E5_FAMILY, "purview-suite", "e5-ipg"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Endpoint DLP & Teams DLP", yes: [...E5_FAMILY, "purview-suite", "e5-ipg"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Retention policies / basic records", yes: ["o365-e3", "o365-e5", "m365-e3", ...E5_FAMILY, "purview-suite", "e5-ipg"], partial: { "o365-e1": "Limited" } },
  { category: "Information Protection & Compliance (Purview)", feature: "Advanced records / data lifecycle management", yes: [...E5_FAMILY, "purview-suite", "e5-ipg"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Advanced Message Encryption", yes: ["o365-e5", ...E5_FAMILY, "purview-suite", "e5-ipg"] },
  { category: "Information Protection & Compliance (Purview)", feature: "eDiscovery (Standard)", yes: ["o365-e3", "o365-e5", "m365-e3", ...E5_FAMILY, "purview-suite"] },
  { category: "Information Protection & Compliance (Purview)", feature: "eDiscovery (Premium / Advanced)", yes: ["o365-e5", ...E5_FAMILY, "purview-suite"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Advanced Audit", yes: ["o365-e5", ...E5_FAMILY, "purview-suite"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Customer Lockbox", yes: ["o365-e5", ...E5_FAMILY, "purview-suite"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Insider Risk Management", yes: [...E5_FAMILY, "purview-suite"] },
  { category: "Information Protection & Compliance (Purview)", feature: "Communication Compliance", yes: [...E5_FAMILY, "purview-suite"] },
];

export function cellState(row: FeatureRow, id: CompareId): CellState {
  if (row.yes.includes(id)) return "yes";
  if (row.partial && row.partial[id]) return "partial";
  return "no";
}

export function cellNote(row: FeatureRow, id: CompareId): string {
  return row.partial?.[id] ?? "";
}

export const COMPARE_PRESETS: { label: string; ids: CompareId[] }[] = [
  { label: "Office 365 (E1/E3/E5)", ids: ["o365-e1", "o365-e3", "o365-e5"] },
  { label: "Microsoft 365 (E3/E5/E7)", ids: ["m365-e3", "m365-e5", "m365-e7"] },
  { label: "EMS (E3/E5)", ids: ["ems-e3", "ems-e5"] },
  { label: "AI (Copilot, Agent 365, E7)", ids: ["copilot", "agent-365", "m365-e7"] },
  { label: "Suite packs", ids: ["defender-suite", "purview-suite", "entra-suite", "e5-ipg"] },
  { label: "E5 vs E7 + suites", ids: ["m365-e3", "m365-e5", "m365-e7", "defender-suite", "purview-suite", "entra-suite"] },
];
