import type {
  CoreLicenseResult,
  WindowsCalculationResult,
  WindowsServer,
} from "../types";
import { LICENSE_RULES, DATACENTER_VM_BREAKPOINT } from "../data/licenseRules";

/**
 * Compute per-physical-server Windows Server core license requirement
 * applying minimum per-processor / per-server rules and virtualization rights.
 */
export function computeServerCoreRequirement(server: WindowsServer): CoreLicenseResult {
  const stdRule = LICENSE_RULES["windows-std"];
  const dcRule = LICENSE_RULES["windows-dc"];
  const notes: string[] = [];

  const minPerProc = stdRule.minimumCoresPerProcessor ?? 8;
  const minPerServer = stdRule.minimumCoresPerServer ?? 16;

  // Derive actual cores from inputs, honoring per-processor minimum.
  const physicalCores = Math.max(
    server.totalCores,
    server.cpuSockets * Math.max(server.coresPerCpu, minPerProc)
  );
  const serverCores = Math.max(physicalCores, minPerServer);

  // Standard: each 16-core license permits 2 VMs on the host.
  // VMs beyond that require additional stacked Standard licenses re-licensing the host.
  let requiredCores = serverCores;
  if (server.edition === "Standard") {
    const vmFactor = Math.max(1, Math.ceil(server.vmCount / (stdRule.virtualizationRights || 2)));
    requiredCores = serverCores * vmFactor;
    if (vmFactor > 1) {
      notes.push(
        `Standard edition requires re-licensing host ${vmFactor}× to cover ${server.vmCount} VMs.`
      );
    }
  }

  // Recommend Datacenter if VM count exceeds breakpoint.
  let recommendedEdition = server.edition;
  if (server.type === "Physical" && server.vmCount >= DATACENTER_VM_BREAKPOINT && server.edition === "Standard") {
    recommendedEdition = "Datacenter";
    notes.push(
      `With ${server.vmCount} VMs, Datacenter is likely more cost-effective (threshold ${DATACENTER_VM_BREAKPOINT}+ VMs).`
    );
  }

  if (server.edition === "Datacenter") {
    notes.push(dcRule.notes || "Datacenter: unlimited virtualization on fully licensed host.");
  }

  if (server.edition === "Essentials") {
    const essentials = LICENSE_RULES["windows-essentials"];
    requiredCores = 0;
    notes.push(
      `Essentials: 1 server license covers single-socket host, up to ${essentials.maxUsers} users / ${essentials.maxDevices} devices. No separate CAL required.`
    );
  }

  return {
    serverId: server.id,
    serverName: server.name,
    edition: server.edition,
    requiredCoreLicenses: requiredCores,
    recommendedEdition,
    notes,
  };
}

export function calculateWindowsLicensing(servers: WindowsServer[]): WindowsCalculationResult {
  const physical = servers.filter((s) => s.type === "Physical");
  const totalPhysicalCores = physical.reduce((sum, s) => sum + s.totalCores, 0);
  const totalCpuSockets = physical.reduce((sum, s) => sum + s.cpuSockets, 0);
  const totalVMs = servers.reduce((sum, s) => sum + s.vmCount, 0);

  const perServer = physical.map(computeServerCoreRequirement);

  const requiredStandardCoreLicenses = perServer
    .filter((r) => r.edition === "Standard")
    .reduce((sum, r) => sum + r.requiredCoreLicenses, 0);

  const requiredDatacenterCoreLicenses = perServer
    .filter((r) => r.edition === "Datacenter")
    .reduce((sum, r) => sum + r.requiredCoreLicenses, 0);

  return {
    totalPhysicalCores,
    totalCpuSockets,
    totalVMs,
    perServer,
    requiredStandardCoreLicenses,
    requiredDatacenterCoreLicenses,
  };
}
