import type { Assessment, ExchangeServer, SQLServer, WindowsServer } from "../types";
import { buildBlankAssessment } from "./blankAssessment";
import { uid } from "../utils/id";

export type TemplateId = "smb" | "mid" | "enterprise";

export interface AssessmentTemplate {
  id: TemplateId;
  name: string;
  tagline: string;
  highlights: string[];
  build: (customerName: string) => Assessment;
}

function win(
  name: string,
  p: Partial<WindowsServer> & Pick<WindowsServer, "cpuSockets" | "coresPerCpu" | "edition" | "vmCount">
): WindowsServer {
  return {
    id: uid("srv"),
    name,
    type: "Physical",
    version: "Windows Server 2022",
    ha: false,
    totalCores: p.cpuSockets * p.coresPerCpu,
    ...p,
  };
}

function exch(name: string, p: Partial<ExchangeServer> & Pick<ExchangeServer, "edition">): ExchangeServer {
  return {
    id: uid("exch"),
    name,
    version: "Exchange 2019",
    type: "Physical",
    cpuSockets: 2,
    cores: 16,
    dagMember: false,
    mailboxDatabases: 4,
    status: "Active",
    ...p,
  };
}

function sqlSrv(name: string, p: Partial<SQLServer> & Pick<SQLServer, "edition" | "cores">): SQLServer {
  return {
    id: uid("sql"),
    name,
    version: "SQL Server 2022",
    model: "PerCore",
    type: "VM",
    cpuSockets: 1,
    hasSoftwareAssurance: true,
    passiveFailover: false,
    ...p,
  };
}

function base(customerName: string, users: number, employees: number): Assessment {
  const a = buildBlankAssessment();
  a.customer = {
    ...a.customer,
    name: customerName,
    numberOfUsers: users,
    numberOfEmployees: employees,
    assessmentDate: new Date().toISOString().slice(0, 10),
  };
  a.windowsCAL = { users, devices: Math.round(users * 1.1), accessType: "User", owned: { userCAL: 0, deviceCAL: 0 } };
  a.exchange.mailboxUsers = users;
  return a;
}

export const TEMPLATES: AssessmentTemplate[] = [
  {
    id: "smb",
    name: "SMB",
    tagline: "~50 users · small on-prem footprint",
    highlights: [
      "2 Hyper-V hosts (Windows Server Standard)",
      "1 Exchange Standard server, no DAG",
      "1 SQL Server Standard VM (4 cores)",
      "50 Windows User CALs",
    ],
    build: (name) => {
      const a = base(name, 50, 60);
      a.environment = { ...a.environment, physicalServers: 2, virtualServers: 6, hypervisor: "Hyper-V" };
      a.windowsServers = [
        win("HV-HOST-01", { cpuSockets: 1, coresPerCpu: 16, edition: "Standard", vmCount: 3, role: "Hyper-V host" }),
        win("HV-HOST-02", { cpuSockets: 1, coresPerCpu: 16, edition: "Standard", vmCount: 3, role: "Hyper-V host" }),
      ];
      a.exchange = {
        ...a.exchange,
        servers: [exch("EXCH-01", { edition: "Standard", type: "VM", cpuSockets: 1, cores: 8, mailboxDatabases: 2 })],
      };
      a.sql!.servers = [sqlSrv("SQL-01", { edition: "Standard", cores: 4, cpuSockets: 1, role: "ERP database" })];
      return a;
    },
  },
  {
    id: "mid",
    name: "Mid-market",
    tagline: "~500 users · virtualized, HA mail & database",
    highlights: [
      "4 Hyper-V hosts (Windows Server Datacenter)",
      "3-node Exchange DAG (Standard)",
      "2 SQL Server Standard (active + passive, SA)",
      "500 Windows User CALs, RDS for 80 users",
    ],
    build: (name) => {
      const a = base(name, 500, 600);
      a.environment = { ...a.environment, physicalServers: 4, virtualServers: 60, hypervisor: "Hyper-V" };
      a.windowsServers = Array.from({ length: 4 }, (_, i) =>
        win(`HV-HOST-0${i + 1}`, {
          cpuSockets: 2,
          coresPerCpu: 16,
          edition: "Datacenter",
          vmCount: 15,
          ha: true,
          role: "Hyper-V cluster node",
        })
      );
      a.rds = { ...a.rds, rdsUsers: 80, rdsDevices: 0, concurrentUsers: 50 };
      a.exchange = {
        ...a.exchange,
        dag: true,
        highAvailability: true,
        servers: [
          exch("EXCH-01", { edition: "Standard", dagMember: true, status: "Active", type: "VM", cpuSockets: 2, cores: 16 }),
          exch("EXCH-02", { edition: "Standard", dagMember: true, status: "Active", type: "VM", cpuSockets: 2, cores: 16 }),
          exch("EXCH-03", { edition: "Standard", dagMember: true, status: "Passive", type: "VM", cpuSockets: 2, cores: 16 }),
        ],
      };
      a.sql!.servers = [
        sqlSrv("SQL-01", { edition: "Standard", cores: 16, cpuSockets: 2, role: "Primary" }),
        sqlSrv("SQL-02", { edition: "Standard", cores: 16, cpuSockets: 2, role: "Secondary", passiveFailover: true }),
      ];
      return a;
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "~2,000 users · clustered, hybrid cloud",
    highlights: [
      "8 VMware hosts (Windows Server Datacenter)",
      "4-node Exchange DAG (Enterprise) + hybrid",
      "3-node SQL Server Enterprise AG (SA, 1 passive)",
      "RDS farm for 300 users · M365 E3 + F3 mix",
    ],
    build: (name) => {
      const a = base(name, 2000, 2400);
      a.environment = {
        ...a.environment,
        physicalServers: 8,
        virtualServers: 320,
        hypervisor: "VMware",
        cloudProvider: "Azure",
        hybrid: true,
      };
      a.windowsServers = Array.from({ length: 8 }, (_, i) =>
        win(`ESX-HOST-0${i + 1}`, {
          cpuSockets: 2,
          coresPerCpu: 24,
          edition: "Datacenter",
          vmCount: 40,
          ha: true,
          role: "VMware cluster host",
        })
      );
      a.rds = { ...a.rds, rdsUsers: 300, rdsDevices: 0, concurrentUsers: 180 };
      a.exchange = {
        ...a.exchange,
        dag: true,
        highAvailability: true,
        hybrid: true,
        calType: "StandardPlusEnterprise",
        servers: [
          exch("EXCH-01", { edition: "Enterprise", dagMember: true, cpuSockets: 2, cores: 24, mailboxDatabases: 8 }),
          exch("EXCH-02", { edition: "Enterprise", dagMember: true, cpuSockets: 2, cores: 24, mailboxDatabases: 8 }),
          exch("EXCH-03", { edition: "Enterprise", dagMember: true, cpuSockets: 2, cores: 24, mailboxDatabases: 8, status: "Passive" }),
          exch("EXCH-04", { edition: "Enterprise", dagMember: true, cpuSockets: 2, cores: 24, mailboxDatabases: 8, status: "Passive" }),
        ],
      };
      a.sql!.servers = [
        sqlSrv("SQL-AG-01", { edition: "Enterprise", cores: 32, cpuSockets: 2, role: "AG primary" }),
        sqlSrv("SQL-AG-02", { edition: "Enterprise", cores: 32, cpuSockets: 2, role: "AG sync replica" }),
        sqlSrv("SQL-AG-03", { edition: "Enterprise", cores: 32, cpuSockets: 2, role: "AG DR replica", passiveFailover: true }),
      ];
      a.m365 = {
        annualBilling: true,
        licenses: [
          { planId: "m365-e3", users: 1500 },
          { planId: "m365-f3", users: 500 },
        ],
      };
      return a;
    },
  },
];
