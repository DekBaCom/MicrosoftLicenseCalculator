// =====================================================================
// Core domain types for Microsoft License Assessment & Calculator
// =====================================================================

export type UUID = string;

export type AssessmentStatus = "Draft" | "In Review" | "Completed" | "Archived";

export type Currency = "THB" | "USD" | "EUR";

export interface Customer {
  id: UUID;
  name: string;
  customerId?: string;
  industry?: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  numberOfEmployees?: number;
  numberOfUsers?: number;
  numberOfLocations?: number;
  assessmentOwner?: string;
  assessmentDate?: string; // ISO date
  notes?: string;
}

export type Hypervisor = "Hyper-V" | "VMware" | "Nutanix" | "Other" | "None";
export type CloudProvider = "Azure" | "AWS" | "Google Cloud" | "None";

export interface Environment {
  physicalServers: number;
  virtualServers: number;
  hypervisor: Hypervisor;
  cloudProvider: CloudProvider;
  hybrid: boolean;
  operatingSystems: string[]; // e.g. ["Windows Server 2019", "Windows Server 2022"]
}

export type ServerType = "Physical" | "VM";
export type WindowsEdition = "Standard" | "Datacenter" | "Essentials";
export type WindowsVersion =
  | "Windows Server 2016"
  | "Windows Server 2019"
  | "Windows Server 2022"
  | "Windows Server 2025"
  | "Other";

export interface WindowsServer {
  id: UUID;
  name: string;
  type: ServerType;
  cpuSockets: number;
  coresPerCpu: number;
  totalCores: number; // auto = sockets * coresPerCpu
  version: WindowsVersion;
  edition: WindowsEdition;
  vmCount: number;
  role?: string;
  ha: boolean;
}

export type CALAccessType = "User" | "Device" | "Mixed";

export interface WindowsCALInput {
  users: number;
  devices: number;
  accessType: CALAccessType;
  owned: {
    userCAL: number;
    deviceCAL: number;
  };
}

export interface RDSCALInput {
  rdsUsers: number;
  rdsDevices: number;
  accessType: CALAccessType;
  concurrentUsers: number;
  owned: {
    userCAL: number;
    deviceCAL: number;
  };
}

export type ExchangeVersion =
  | "Exchange 2016"
  | "Exchange 2019"
  | "Exchange SE"
  | "Other";
export type ExchangeEdition = "Standard" | "Enterprise";
export type ExchangeCALType = "Standard" | "Enterprise" | "StandardPlusEnterprise";

export interface ExchangeServer {
  id: UUID;
  name: string;
  version: ExchangeVersion;
  edition: ExchangeEdition;
  type: ServerType;
  cpuSockets: number;
  cores: number;
  dagMember: boolean;
  mailboxDatabases: number;
  status: "Active" | "Passive" | "Standby";
}

export interface ExchangeAssessment {
  servers: ExchangeServer[];
  mailboxUsers: number;
  sharedMailboxes: number;
  dag: boolean;
  highAvailability: boolean;
  hybrid: boolean;
  publicFolder: boolean;
  calType: ExchangeCALType;
}

// ------------------- Current license inventory -------------------

export type InventoryProduct =
  | "Windows Server Standard"
  | "Windows Server Datacenter"
  | "Windows Server CAL"
  | "RDS CAL"
  | "Exchange Server Standard"
  | "Exchange Server Enterprise"
  | "Exchange Standard CAL"
  | "Exchange Enterprise CAL"
  | string;

export interface LicenseInventoryItem {
  id: UUID;
  product: InventoryProduct;
  version?: string;
  edition?: string;
  licenseType?: "Core" | "Server" | "User CAL" | "Device CAL" | string;
  quantityOwned: number;
  agreement?: string;
  softwareAssurance?: boolean;
  expiryDate?: string;
  notes?: string;
}

// ------------------- Calculation outputs -------------------

export interface CoreLicenseResult {
  serverId: UUID;
  serverName: string;
  edition: WindowsEdition;
  requiredCoreLicenses: number;
  recommendedEdition: WindowsEdition;
  notes: string[];
}

export interface WindowsCalculationResult {
  totalPhysicalCores: number;
  totalCpuSockets: number;
  totalVMs: number;
  perServer: CoreLicenseResult[];
  requiredStandardCoreLicenses: number;
  requiredDatacenterCoreLicenses: number;
}

export interface CALCalculationResult {
  userCALRequired: number;
  deviceCALRequired: number;
  recommendedModel: "User" | "Device" | "Mixed";
  reasoning: string;
}

export interface RDSCalculationResult {
  userCALRequired: number;
  deviceCALRequired: number;
  recommendedModel: "User" | "Device" | "Mixed";
  reasoning: string;
}

export interface ExchangeCalculationResult {
  serverLicensesRequired: number;
  serverLicenseByEdition: { standard: number; enterprise: number };
  standardCALRequired: number;
  enterpriseCALRequired: number;
  dagCopies: number;
}

// ------------------- Gap & recommendations -------------------

export type GapStatus = "Compliant" | "Review" | "Gap" | "Surplus";

export interface GapLine {
  product: string;
  required: number;
  owned: number;
  gap: number;
  surplus: number;
  status: GapStatus;
}

export interface Recommendation {
  id: string;
  product: string;
  current: number;
  required: number;
  gap: number;
  action: string;
  priority: "High" | "Medium" | "Low";
  note?: string;
}

// ------------------- Cost & scenarios -------------------

export interface ProductPricing {
  id: string;
  product: string;
  sku: string;
  category:
    | "Windows Server"
    | "Windows CAL"
    | "RDS"
    | "Exchange Server"
    | "Exchange CAL"
    | "Other";
  version?: string;
  edition?: string;
  metric: "core" | "user" | "device" | "server";
  unitPrice: number;
  currency: Currency;
  billingType: "Perpetual" | "Subscription" | "SA";
  effectiveDate: string;
  ruleId?: string;
  notes?: string;
  active: boolean;
}

export interface CostLine {
  product: string;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  total: number;
}

export interface CostSummary {
  currency: Currency;
  lines: CostLine[];
  total: number;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  userGrowthPct: number;
  vmGrowthPct: number;
  includeExchangeHybrid: boolean;
}

// ------------------- Assessment -------------------

export interface Assessment {
  id: UUID;
  version: number;
  customer: Customer;
  environment: Environment;
  windowsServers: WindowsServer[];
  windowsCAL: WindowsCALInput;
  rds: RDSCALInput;
  exchange: ExchangeAssessment;
  inventory: LicenseInventoryItem[];
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  owner?: string;
}
