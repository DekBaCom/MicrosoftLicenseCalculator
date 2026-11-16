import type { Windows11Edition } from "../types";

/**
 * Placeholder USD per user/month for Windows Enterprise subscriptions.
 * Adjust to the customer's agreement (CSP / EA / MCA-E) before quoting.
 * Windows 11 Pro is licensed per device (OEM / upgrade rights), so it has no subscription price here.
 */
export const WINDOWS11_PRICE_USD: Record<Windows11Edition, number> = {
  Pro: 0,
  "Enterprise E3": 7,
  "Enterprise E5": 11,
};

export const WINDOWS11_EDITIONS: Windows11Edition[] = ["Pro", "Enterprise E3", "Enterprise E5"];

export const WINDOWS11_REQUIREMENTS = [
  "64-bit CPU, 1 GHz+, 2+ cores on the supported-processor list (generally Intel 8th gen / AMD Zen 2 or newer)",
  "4 GB RAM and 64 GB storage minimum",
  "UEFI firmware with Secure Boot capability",
  "TPM 2.0",
];
