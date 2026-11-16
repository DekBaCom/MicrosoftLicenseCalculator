import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Assessment, Currency, ProductPricing } from "../types";
import { storage } from "../utils/storage";
import { DEFAULT_PRICING } from "../data/pricing";

interface Settings {
  companyName: string;
  defaultCurrency: Currency;
  defaultCountry: string;
}

interface AppState {
  assessments: Assessment[];
  currentId: string | null;
  pricing: ProductPricing[];
  settings: Settings;
}

interface AppApi extends AppState {
  current: Assessment | null;
  setCurrentId: (id: string | null) => void;
  createAssessment: (a?: Assessment) => Assessment;
  updateAssessment: (a: Assessment) => void;
  deleteAssessment: (id: string) => void;
  duplicateAssessment: (id: string) => Assessment | null;
  setPricing: (p: ProductPricing[]) => void;
  updateSettings: (s: Partial<Settings>) => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  clearAll: () => void;
}

const defaultSettings: Settings = {
  companyName: "Presales Lab",
  defaultCurrency: "THB",
  defaultCountry: "Thailand",
};

const AppContext = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [assessments, setAssessments] = useState<Assessment[]>(() =>
    storage.get<Assessment[]>("assessments", [])
  );
  const [currentId, setCurrentIdState] = useState<string | null>(() =>
    storage.get<string | null>("currentId", null)
  );
  const [pricing, setPricingState] = useState<ProductPricing[]>(() =>
    storage.get<ProductPricing[]>("pricing", DEFAULT_PRICING)
  );
  const [settings, setSettingsState] = useState<Settings>(() =>
    storage.get<Settings>("settings", defaultSettings)
  );

  useEffect(() => storage.set("assessments", assessments), [assessments]);
  useEffect(() => storage.set("currentId", currentId), [currentId]);
  useEffect(() => storage.set("pricing", pricing), [pricing]);
  useEffect(() => storage.set("settings", settings), [settings]);

  const current = useMemo(
    () => assessments.find((a) => a.id === currentId) ?? null,
    [assessments, currentId]
  );

  const api: AppApi = {
    assessments,
    currentId,
    pricing,
    settings,
    current,
    setCurrentId: setCurrentIdState,
    createAssessment: (a) => {
      const base: Assessment = a ?? buildBlankAssessment();
      setAssessments((prev) => [base, ...prev]);
      setCurrentIdState(base.id);
      return base;
    },
    updateAssessment: (a) => {
      setAssessments((prev) =>
        prev.map((x) => (x.id === a.id ? { ...a, updatedAt: new Date().toISOString() } : x))
      );
    },
    deleteAssessment: (id) => {
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      if (currentId === id) setCurrentIdState(null);
    },
    duplicateAssessment: (id) => {
      const src = assessments.find((a) => a.id === id);
      if (!src) return null;
      const copy: Assessment = JSON.parse(JSON.stringify(src));
      copy.id = `${src.id}-copy-${Date.now()}`;
      copy.customer.name = `${src.customer.name} (Copy)`;
      copy.createdAt = new Date().toISOString();
      copy.updatedAt = copy.createdAt;
      copy.status = "Draft";
      setAssessments((prev) => [copy, ...prev]);
      return copy;
    },
    setPricing: setPricingState,
    updateSettings: (s) => setSettingsState((prev) => ({ ...prev, ...s })),
    exportJSON: () =>
      JSON.stringify({ assessments, pricing, settings }, null, 2),
    importJSON: (json) => {
      try {
        const data = JSON.parse(json);
        if (Array.isArray(data.assessments)) setAssessments(data.assessments);
        if (Array.isArray(data.pricing)) setPricingState(data.pricing);
        if (data.settings) setSettingsState({ ...defaultSettings, ...data.settings });
        return true;
      } catch {
        return false;
      }
    },
    clearAll: () => {
      storage.clearAll();
      setAssessments([]);
      setCurrentIdState(null);
      setPricingState(DEFAULT_PRICING);
      setSettingsState(defaultSettings);
    },
  };

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function buildBlankAssessment(): Assessment {
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
