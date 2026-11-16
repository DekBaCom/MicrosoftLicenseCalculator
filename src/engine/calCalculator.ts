import type { CALCalculationResult, WindowsCALInput } from "../types";
import { CAL_DEVICE_FACTOR } from "../data/licenseRules";

export function calculateWindowsCAL(input: WindowsCALInput): CALCalculationResult {
  const userCALRequired = input.users;
  const deviceCALRequired = input.devices;

  let recommendedModel: CALCalculationResult["recommendedModel"];
  let reasoning: string;

  if (input.accessType === "User") {
    recommendedModel = "User";
    reasoning = "Access type set to User — User CALs are required for each unique user.";
  } else if (input.accessType === "Device") {
    recommendedModel = "Device";
    reasoning = "Access type set to Device — Device CALs are required for each shared device.";
  } else if (deviceCALRequired > 0 && userCALRequired > deviceCALRequired * CAL_DEVICE_FACTOR) {
    recommendedModel = "Device";
    reasoning = `Users (${userCALRequired}) exceed devices (${deviceCALRequired}) by more than ${Math.round(
      (CAL_DEVICE_FACTOR - 1) * 100
    )}%. Device CAL is likely cheaper.`;
  } else {
    recommendedModel = "User";
    reasoning = "User CAL recommended — users and devices are comparable, and User CALs are portable across devices.";
  }

  return { userCALRequired, deviceCALRequired, recommendedModel, reasoning };
}
