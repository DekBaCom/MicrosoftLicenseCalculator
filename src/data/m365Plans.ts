import type { M365Plan, M365PlanId } from "../types";

/**
 * Microsoft 365 plan catalog.
 *
 * Prices are placeholder per-user/month in USD — reflecting Microsoft's
 * public price list order of magnitude. Administrators MUST adjust prices
 * to match the customer's agreement (CSP / EA / MCA-E) before quoting.
 */
export const M365_PLANS: M365Plan[] = [
  // ---------------- Enterprise Suite ----------------
  {
    id: "m365-f1",
    name: "Microsoft 365 F1",
    category: "Frontline",
    pricePerUserMonth: 2.25,
    currency: "USD",
    includes: ["Teams", "SharePoint", "OneDrive 2GB", "No mailbox", "EMS F1"],
  },
  {
    id: "m365-f3",
    name: "Microsoft 365 F3",
    category: "Frontline",
    pricePerUserMonth: 8,
    currency: "USD",
    includes: ["Web/mobile Office", "Exchange 2GB mailbox", "Teams", "SharePoint", "EMS F3", "Intune"],
  },
  {
    id: "o365-e3",
    name: "Office 365 E3",
    category: "Enterprise Suite",
    pricePerUserMonth: 23,
    currency: "USD",
    includes: ["Office Apps", "Exchange 100GB", "Teams", "SharePoint", "OneDrive 1TB", "Loop"],
  },
  {
    id: "o365-e5",
    name: "Office 365 E5",
    category: "Enterprise Suite",
    pricePerUserMonth: 38,
    currency: "USD",
    includes: ["Office 365 E3", "Teams Phone", "Defender for O365 P2", "Power BI Pro", "Advanced eDiscovery"],
  },
  {
    id: "m365-e3",
    name: "Microsoft 365 E3",
    category: "Enterprise Suite",
    pricePerUserMonth: 36,
    currency: "USD",
    includes: ["Office 365 E3", "EMS E3", "Intune", "Entra ID P1", "Windows 11 Enterprise E3"],
  },
  {
    id: "m365-e5",
    name: "Microsoft 365 E5",
    category: "Enterprise Suite",
    pricePerUserMonth: 57,
    currency: "USD",
    includes: ["M365 E3", "O365 E5", "EMS E5", "Defender for Endpoint P2", "Defender for Cloud Apps", "Entra ID P2"],
  },
  {
    id: "m365-e7",
    name: "Microsoft 365 E7",
    category: "Enterprise Suite",
    pricePerUserMonth: 99,
    currency: "USD",
    includes: ["Microsoft 365 E5", "Microsoft 365 Copilot", "Entra Suite", "Agent 365", "Security Copilot (eligible)"],
  },

  // ---------------- Business ----------------
  {
    id: "biz-basic",
    name: "Microsoft 365 Business Basic",
    category: "Business",
    pricePerUserMonth: 6,
    currency: "USD",
    includes: ["Web/mobile Office", "Exchange 50GB", "Teams", "SharePoint", "OneDrive 1TB", "Up to 300 users"],
  },
  {
    id: "biz-standard",
    name: "Microsoft 365 Business Standard",
    category: "Business",
    pricePerUserMonth: 12.5,
    currency: "USD",
    includes: ["Desktop Office", "Exchange 50GB", "Teams", "SharePoint", "OneDrive 1TB", "Up to 300 users"],
  },
  {
    id: "biz-premium",
    name: "Microsoft 365 Business Premium",
    category: "Business",
    pricePerUserMonth: 22,
    currency: "USD",
    includes: ["Business Standard", "Intune", "Defender for Business", "Entra ID P1", "Up to 300 users"],
  },

  // ---------------- Apps ----------------
  {
    id: "apps-biz",
    name: "Microsoft 365 Apps for Business",
    category: "Apps",
    pricePerUserMonth: 8.25,
    currency: "USD",
    includes: ["Desktop Word/Excel/PowerPoint/Outlook", "OneDrive 1TB", "No Exchange/Teams", "Up to 300 users"],
  },
  {
    id: "apps-ent",
    name: "Microsoft 365 Apps for Enterprise",
    category: "Apps",
    pricePerUserMonth: 12,
    currency: "USD",
    includes: ["Apps for Business", "No seat cap", "PowerBI Pro (sep. license)"],
  },

  // ---------------- Exchange Online ----------------
  {
    id: "exchange-online-p1",
    name: "Exchange Online (Plan 1)",
    category: "Exchange Online",
    pricePerUserMonth: 4,
    currency: "USD",
    includes: ["50GB mailbox", "Calendar", "Spam/malware filter"],
  },
  {
    id: "exchange-online-p2",
    name: "Exchange Online (Plan 2)",
    category: "Exchange Online",
    pricePerUserMonth: 8,
    currency: "USD",
    includes: ["100GB mailbox", "Unlimited archive", "DLP", "In-place hold"],
  },

  // ---------------- Teams & Phone ----------------
  {
    id: "teams-ess",
    name: "Microsoft Teams Essentials",
    category: "Teams",
    pricePerUserMonth: 4,
    currency: "USD",
    includes: ["Meetings up to 30h", "10GB cloud storage", "No Exchange/SharePoint"],
  },
  {
    id: "teams-phone-std",
    name: "Teams Phone Standard",
    category: "Teams",
    pricePerUserMonth: 8,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["Direct Routing / Operator Connect", "Auto attendant", "Add-on to E3/E5/Business"],
  },

  // ---------------- Copilot ----------------
  {
    id: "copilot-m365",
    name: "Microsoft 365 Copilot",
    category: "Copilot",
    pricePerUserMonth: 30,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["Copilot in Word/Excel/PowerPoint/Outlook/Teams", "Copilot Chat", "Requires M365 E3/E5/Business"],
  },

  // ---------------- Security ----------------
  {
    id: "defender-office-p1",
    name: "Defender for Office 365 (P1)",
    category: "Security",
    pricePerUserMonth: 2,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["Safe Links", "Safe Attachments", "Anti-phishing"],
  },
  {
    id: "defender-office-p2",
    name: "Defender for Office 365 (P2)",
    category: "Security",
    pricePerUserMonth: 5,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["P1 features", "Attack simulator", "Automated investigation & response"],
  },
  {
    id: "ems-e3",
    name: "Enterprise Mobility + Security E3",
    category: "Management",
    pricePerUserMonth: 10.6,
    currency: "USD",
    includes: ["Entra ID P1", "Intune", "Azure Info Protection P1"],
  },
  {
    id: "ems-e5",
    name: "Enterprise Mobility + Security E5",
    category: "Management",
    pricePerUserMonth: 16.4,
    currency: "USD",
    includes: ["EMS E3", "Entra ID P2", "Defender for Cloud Apps", "AIP P2"],
  },
  {
    id: "intune-std",
    name: "Microsoft Intune Plan 1",
    category: "Management",
    pricePerUserMonth: 8,
    currency: "USD",
    includes: ["MDM/MAM", "Device compliance", "Endpoint analytics"],
  },

  // ---------------- Suites (add-on packs) ----------------
  {
    id: "defender-suite",
    name: "Microsoft Defender Suite",
    category: "Suite",
    pricePerUserMonth: 12,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["Entra ID P2", "Defender for Identity", "Defender for Endpoint P2", "Defender for Office 365 P2", "Defender for Cloud Apps"],
  },
  {
    id: "purview-suite",
    name: "Microsoft Purview Suite",
    category: "Suite",
    pricePerUserMonth: 12,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["Information Protection", "Data Loss Prevention", "Insider Risk", "eDiscovery & Audit", "Records Management"],
  },
  {
    id: "entra-suite",
    name: "Microsoft Entra Suite",
    category: "Suite",
    pricePerUserMonth: 12,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["Entra ID P1 + Governance", "Private Access", "Internet Access", "ID Protection", "Verified ID"],
  },
  {
    id: "e5-ipg",
    name: "Microsoft 365 E5 Information Protection & Governance",
    category: "Suite",
    pricePerUserMonth: 10,
    currency: "USD",
    requiresBasePlan: true,
    includes: ["Sensitivity labels (auto)", "DLP", "Records & retention", "Advanced Message Encryption"],
  },
];

/**
 * Plans already covered by another plan. Selecting both means paying twice.
 * Based on Microsoft's published plan comparisons; confirm against the customer's agreement.
 */
const COVERS: Partial<Record<M365PlanId, M365PlanId[]>> = {
  "m365-e7": [
    "m365-e5", "m365-e3", "o365-e5", "o365-e3", "ems-e5", "ems-e3",
    "copilot-m365", "entra-suite", "defender-suite", "purview-suite", "e5-ipg",
    "defender-office-p1", "defender-office-p2", "exchange-online-p1", "exchange-online-p2", "intune-std",
  ],
  "m365-e5": [
    "m365-e3", "o365-e5", "o365-e3", "ems-e5", "ems-e3",
    "defender-suite", "purview-suite", "e5-ipg",
    "defender-office-p1", "defender-office-p2", "exchange-online-p1", "exchange-online-p2", "intune-std",
  ],
};

export function findOverlaps(planIds: M365PlanId[]): string[] {
  const selected = new Set(planIds);
  const out: string[] = [];
  for (const [id, covered] of Object.entries(COVERS) as [M365PlanId, M365PlanId[]][]) {
    if (!selected.has(id)) continue;
    for (const c of covered) {
      if (selected.has(c)) out.push(`${findPlan(id)?.name} already includes ${findPlan(c)?.name} — remove the duplicate to avoid paying twice.`);
    }
  }
  return out;
}

export function findPlan(id: string): M365Plan | undefined {
  return M365_PLANS.find((p) => p.id === id);
}
