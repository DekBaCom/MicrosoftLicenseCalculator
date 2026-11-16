import type { Assessment } from "../types";

export function buildBlankAssessment(): Assessment {
  const now = new Date().toISOString();
  return {
    id: `asmt-${Date.now()}`,
    version: 1,
    status: "Draft",
    createdAt: now,
    updatedAt: now,
    owner: "",
    customer: {
      id: `cust-${Date.now()}`,
      name: "",
    },
    environment: {
      physicalServers: 0,
      virtualServers: 0,
      hypervisor: "None",
      cloudProvider: "None",
      hybrid: false,
      operatingSystems: [],
    },
    windowsServers: [],
    windowsCAL: { users: 0, devices: 0, accessType: "User", owned: { userCAL: 0, deviceCAL: 0 } },
    rds: { rdsUsers: 0, rdsDevices: 0, accessType: "User", concurrentUsers: 0, owned: { userCAL: 0, deviceCAL: 0 } },
    exchange: {
      servers: [],
      mailboxUsers: 0,
      sharedMailboxes: 0,
      dag: false,
      highAvailability: false,
      hybrid: false,
      publicFolder: false,
      calType: "Standard",
    },
    sql: {
      servers: [],
      calUsers: 0,
      ownedServerCAL: 0,
      ownedStandardCores: 0,
      ownedEnterpriseCores: 0,
      ownedServerLicenses: 0,
    },
    inventory: [],
  };
}
