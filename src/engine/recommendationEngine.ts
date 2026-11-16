import type { Assessment, GapLine, Recommendation } from "../types";
import { calculateWindowsLicensing } from "./windowsCalculator";
import { DATACENTER_VM_BREAKPOINT } from "../data/licenseRules";

export function generateRecommendations(a: Assessment, gaps: GapLine[]): Recommendation[] {
  const recs: Recommendation[] = [];

  gaps.forEach((g, idx) => {
    if (g.gap > 0) {
      recs.push({
        id: `rec-${idx}`,
        product: g.product,
        current: g.owned,
        required: g.required,
        gap: g.gap,
        action: `Purchase ${g.gap.toLocaleString()} additional ${g.product}.`,
        priority: g.gap > g.required * 0.25 ? "High" : "Medium",
      });
    } else if (g.surplus > g.required * 0.25 && g.required > 0) {
      recs.push({
        id: `rec-surplus-${idx}`,
        product: g.product,
        current: g.owned,
        required: g.required,
        gap: -g.surplus,
        action: `Review surplus of ${g.surplus.toLocaleString()} ${g.product}. Consider reassigning or optimizing.`,
        priority: "Low",
        note: "Surplus may be intentional (growth buffer, Software Assurance).",
      });
    }
  });

  // Windows virtualization optimization
  const win = calculateWindowsLicensing(a.windowsServers);
  const heavyVmHosts = a.windowsServers.filter(
    (s) => s.type === "Physical" && s.edition === "Standard" && s.vmCount >= DATACENTER_VM_BREAKPOINT
  );
  if (heavyVmHosts.length > 0) {
    recs.push({
      id: `rec-virt-opt`,
      product: "Windows Server Virtualization",
      current: win.requiredStandardCoreLicenses,
      required: win.requiredStandardCoreLicenses,
      gap: 0,
      action: `Review Datacenter licensing on ${heavyVmHosts.length} host(s) running ≥${DATACENTER_VM_BREAKPOINT} VMs.`,
      priority: "Medium",
      note: "Datacenter edition typically becomes more cost-effective at this VM density.",
    });
  }

  // Exchange DAG consistency warning
  const dagMembers = a.exchange.servers.filter((s) => s.dagMember).length;
  if (a.exchange.dag && dagMembers < 2) {
    recs.push({
      id: `rec-dag`,
      product: "Exchange DAG",
      current: dagMembers,
      required: 2,
      gap: 2 - dagMembers,
      action: `DAG is enabled but only ${dagMembers} server(s) marked as DAG members. Add at least one more for HA.`,
      priority: "High",
    });
  }

  return recs;
}
