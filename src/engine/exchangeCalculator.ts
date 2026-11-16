import type { ExchangeAssessment, ExchangeCalculationResult } from "../types";

export function calculateExchange(ex: ExchangeAssessment): ExchangeCalculationResult {
  const serverLicensesRequired = ex.servers.length;
  const standardServers = ex.servers.filter((s) => s.edition === "Standard").length;
  const enterpriseServers = ex.servers.filter((s) => s.edition === "Enterprise").length;

  // Active mailbox users need a CAL. Shared mailboxes themselves do not require a CAL
  // but users accessing them do; those users are typically already counted in mailboxUsers.
  const totalUsers = ex.mailboxUsers;

  let standardCAL = 0;
  let enterpriseCAL = 0;
  if (ex.calType === "Standard") {
    standardCAL = totalUsers;
  } else if (ex.calType === "Enterprise") {
    // Enterprise CAL is additive; both Standard and Enterprise CAL are required per user.
    standardCAL = totalUsers;
    enterpriseCAL = totalUsers;
  } else {
    // Mixed: half and half as an estimate — adjust as policy dictates.
    standardCAL = totalUsers;
    enterpriseCAL = Math.round(totalUsers * 0.5);
  }

  const dagCopies = ex.dag ? Math.max(2, ex.servers.filter((s) => s.dagMember).length) : 1;

  return {
    serverLicensesRequired,
    serverLicenseByEdition: { standard: standardServers, enterprise: enterpriseServers },
    standardCALRequired: standardCAL,
    enterpriseCALRequired: enterpriseCAL,
    dagCopies,
  };
}
