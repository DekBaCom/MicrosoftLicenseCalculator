import type { RDSCALInput, RDSCalculationResult } from "../types";
import { CAL_DEVICE_FACTOR } from "../data/licenseRules";

export function calculateRDSCAL(input: RDSCALInput): RDSCalculationResult {
  const userCALRequired = Math.max(input.rdsUsers, input.concurrentUsers);
  const deviceCALRequired = input.rdsDevices;

  let recommendedModel: RDSCalculationResult["recommendedModel"];
  let reasoning: string;

  if (input.accessType === "User") {
    recommendedModel = "User";
    reasoning = "Each unique remote user needs an RDS User CAL.";
  } else if (input.accessType === "Device") {
    recommendedModel = "Device";
    reasoning = "Shared devices (kiosks, shift workstations) → Device CAL is more economical.";
  } else if (deviceCALRequired > 0 && userCALRequired > deviceCALRequired * CAL_DEVICE_FACTOR) {
    recommendedModel = "Device";
    reasoning = `Remote users (${userCALRequired}) exceed devices (${deviceCALRequired}); Device CAL recommended.`;
  } else {
    recommendedModel = "User";
    reasoning = "User CAL recommended for mobile/remote workforce — portable across devices.";
  }

  return { userCALRequired, deviceCALRequired, recommendedModel, reasoning };
}
