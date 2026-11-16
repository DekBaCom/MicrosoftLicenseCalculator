import type { Currency, Windows11Assessment, Windows11Result } from "../types";
import { WINDOWS11_PRICE_USD } from "../data/windows11";
import { FX_FROM_USD } from "./m365Calculator";

export function calculateWindows11(
  input: Windows11Assessment | undefined,
  currency: Currency
): Windows11Result {
  const empty: Windows11Result = {
    currency,
    alreadyOnWindows11: 0,
    inPlaceUpgrade: 0,
    needReplacement: 0,
    enterpriseUsersRequired: 0,
    unitPricePerMonth: 0,
    monthlyTotal: 0,
    annualTotal: 0,
    notes: [],
  };
  if (!input || input.totalDevices <= 0) return empty;

  const total = Math.max(0, input.totalDevices);
  const onWin10 = Math.min(total, Math.max(0, input.devicesOnWindows10));
  const ready = Math.min(onWin10, Math.max(0, input.devicesHardwareReady));

  const alreadyOnWindows11 = total - onWin10;
  const inPlaceUpgrade = ready;
  const needReplacement = onWin10 - ready;

  const isEnterprise = input.targetEdition !== "Pro";
  const enterpriseUsersRequired = isEnterprise ? Math.max(0, input.users) : 0;
  const unitPricePerMonth = WINDOWS11_PRICE_USD[input.targetEdition] * FX_FROM_USD[currency];
  const monthlyTotal = unitPricePerMonth * enterpriseUsersRequired;

  const notes: string[] = [];
  if (onWin10 > 0) {
    notes.push(
      `${onWin10} device(s) still run Windows 10, which reached end of support on 14 Oct 2025. Unsupported devices need paid Extended Security Updates or migration to Windows 11.`
    );
  }
  if (needReplacement > 0) {
    notes.push(`${needReplacement} device(s) fail Windows 11 hardware requirements and need replacement (hardware cost not included).`);
  }
  if (input.targetEdition === "Pro") {
    notes.push("Windows 11 Pro is licensed per device (OEM or an eligible Windows 10 Pro upgrade); no subscription cost modeled.");
  } else {
    notes.push(
      `Windows ${input.targetEdition} is a per-user subscription (up to 5 devices per user). Also included in Microsoft 365 E3/E5 — avoid double-buying if the customer has those.`
    );
    if (input.users <= 0) notes.push("Enter the number of users to price the Enterprise subscription.");
  }

  return {
    currency,
    alreadyOnWindows11,
    inPlaceUpgrade,
    needReplacement,
    enterpriseUsersRequired,
    unitPricePerMonth,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    notes,
  };
}
