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
  /** Enables Azure Hybrid Benefit modeling (requires SA on applicable licenses). */
  azureHybridBenefit?: boolean;
  /** Azure VM vCores targeted for Windows AHB coverage. */
  azureWindowsVMvCores?: number;
  /** Azure SQL vCores targeted for SQL AHB coverage. */
  azureSqlVCores?: number;
  /** Azure SQL tier for AHB math: General Purpose or Business Critical. */
  azureSqlTier?: "GeneralPurpose" | "BusinessCritical";
}

export type ServerType = "Physical" | "VM";
export type WindowsEdition = "Standard" | "Datacenter" | "Essentials";
export type WindowsLicensingModel = "PerCore" | "PerVM";
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

// ------------------- SQL Server -------------------

export type SQLEdition = "Standard" | "Enterprise";
export type SQLLicensingModel = "PerCore" | "ServerCAL";

export interface SQLServer {
  id: UUID;
  name: string;
  version: string; // e.g. "SQL Server 2022", "SQL Server 2025"
  edition: SQLEdition;
  model: SQLLicensingModel;
  type: ServerType;
  cpuSockets: number;
  cores: number;
  hasSoftwareAssurance: boolean;
  passiveFailover: boolean;
  role?: string;
}

export interface SQLAssessment {
  servers: SQLServer[];
  /** Users or devices accessing SQL via Server+CAL model. */
  calUsers: number;
  ownedServerCAL: number;
  ownedStandardCores: number;
  ownedEnterpriseCores: number;
  ownedServerLicenses: number;
}

export interface SQLCalculationResult {
  totalStandardCoresRequired: number;
  totalEnterpriseCoresRequired: number;
  serverLicensesRequired: number;
  calRequired: number;
  perServer: SQLCoreLicenseResult[];
  notes: string[];
}

export interface SQLCoreLicenseResult {
  serverId: UUID;
  serverName: string;
  edition: SQLEdition;
  model: SQLLicensingModel;
  requiredCoreLicenses: number;
  notes: string[];
}

// ------------------- Microsoft 365 -------------------

export type M365PlanId =
  | "m365-e3"
  | "m365-e5"
  | "m365-f3"
  | "m365-f1"
  | "o365-e3"
  | "o365-e5"
  | "ems-e3"
  | "ems-e5"
  | "biz-basic"
  | "biz-standard"
  | "biz-premium"
  | "apps-biz"
  | "apps-ent"
  | "exchange-online-p1"
  | "exchange-online-p2"
  | "teams-ess"
  | "teams-phone-std"
  | "copilot-m365"
  | "defender-office-p1"
  | "defender-office-p2"
  | "intune-std";

export type M365Category =
  | "Enterprise Suite"
  | "Frontline"
  | "Business"
  | "Apps"
  | "Exchange Online"
  | "Teams"
  | "Copilot"
  | "Security"
  | "Management";

export interface M365Plan {
  id: M365PlanId;
  name: string;
  category: M365Category;
  pricePerUserMonth: number;
  currency: Currency;
  includes: string[]; // Short feature bullets
  requiresBasePlan?: boolean; // Add-ons that stack on E3/E5/F3
}

export interface M365LineItem {
  planId: M365PlanId;
  users: number;
}

export interface M365Assessment {
  licenses: M365LineItem[];
  annualBilling: boolean; // vs monthly
  notes?: string;
}

export interface M365CostLine {
  planName: string;
  users: number;
  unitPricePerMonth: number;
  monthlyTotal: number;
  annualTotal: number;
  currency: Currency;
}

export interface M365CostSummary {
  currency: Currency;
  lines: M365CostLine[];
  totalMonthly: number;
  totalAnnual: number;
}

// ------------------- Windows 11 -------------------

export type Windows11Edition = "Pro" | "Enterprise E3" | "Enterprise E5";

export interface Windows11Assessment {
  totalDevices: number;
  /** Devices still running Windows 10 (subset of totalDevices). */
  devicesOnWindows10: number;
  /** Windows 10 devices that already meet Windows 11 hardware requirements. */
  devicesHardwareReady: number;
  targetEdition: Windows11Edition;
  /** Named users licensed for Windows Enterprise (per-user subscription). */
  users: number;
}

export interface Windows11Result {
  currency: Currency;
  alreadyOnWindows11: number;
  inPlaceUpgrade: number;
  needReplacement: number;
  enterpriseUsersRequired: number;
  unitPricePerMonth: number;
  monthlyTotal: number;
  annualTotal: number;
  notes: string[];
}

// ------------------- Azure Hybrid Benefit -------------------

export interface AHBResult {
  windowsVMsCoverableByAHB: number;
  windowsLicensesConsumed: number;
  sqlvCoresCoverableByAHB: number;
  sqlLicensesConsumed: number;
  notes: string[];
}

// ------------------- Current license inventory -------------------

export type InventoryProduct =
  | "Windows Server Standard"
  | "Windows Server Datacenter"
  | "Windows Server Essentials"
  | "Windows Server CAL"
  | "RDS CAL"
  | "Exchange Server Standard"
  | "Exchange Server Enterprise"
  | "Exchange Standard CAL"
  | "Exchange Enterprise CAL"
  | "SQL Server Standard"
  | "SQL Server Enterprise"
  | "SQL Server CAL"
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

export type ProductCategory =
  | "Windows Server"
  | "Windows CAL"
  | "RDS"
  | "Exchange Server"
  | "Exchange CAL"
  | "SQL Server"
  | "SQL CAL"
  | "Other";

export interface ProductPricing {
  id: string;
  product: string;
  sku: string;
  category: ProductCategory;
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
  sql?: SQLAssessment;
  m365?: M365Assessment;
  windows11?: Windows11Assessment;
  inventory: LicenseInventoryItem[];
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  owner?: string;
}
