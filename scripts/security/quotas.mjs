export const QUOTA_TIERS = Object.freeze({
  newcomer: Object.freeze({ id: "newcomer", proposalsPer24Hours: 1, maxOpenProposals: 3 }),
  contributor: Object.freeze({ id: "contributor", proposalsPer24Hours: 3, maxOpenProposals: 6 }),
});

export function quotaTier(signals = {}) {
  return Number(signals.wins) > 0 || Number(signals.mergedPullRequests) > 0
    ? QUOTA_TIERS.contributor
    : QUOTA_TIERS.newcomer;
}

export function evaluateProposalQuota({ issue, proposals = [], signals = {}, now = new Date() }) {
  const tier = quotaTier(signals);
  const currentNumber = Number(issue.number);
  const currentCreatedAt = validTime(issue.created_at);
  const normalized = uniqueByNumber(proposals.concat(issue)).map((proposal) => ({
    number: Number(proposal.number),
    state: proposal.state === "closed" ? "closed" : "open",
    createdAt: validTime(proposal.created_at),
  }));

  const open = normalized
    .filter((proposal) => proposal.state === "open")
    .sort(byAgeThenNumber);
  const openPosition = open.findIndex((proposal) => proposal.number === currentNumber);
  if (openPosition >= tier.maxOpenProposals) {
    return denied(tier, "OPEN_PROPOSAL_QUOTA", `Keep at most ${tier.maxOpenProposals} open proposals at once.`);
  }

  const windowStart = now.getTime() - 24 * 60 * 60 * 1_000;
  if (currentCreatedAt >= windowStart) {
    const recent = normalized
      .filter((proposal) => proposal.createdAt >= windowStart)
      .sort(byAgeThenNumber);
    const recentPosition = recent.findIndex((proposal) => proposal.number === currentNumber);
    if (recentPosition >= tier.proposalsPer24Hours) {
      return denied(tier, "DAILY_PROPOSAL_QUOTA", `This tier allows ${tier.proposalsPer24Hours} new proposal${tier.proposalsPer24Hours === 1 ? "" : "s"} per rolling 24 hours.`);
    }
  }

  return { allowed: true, tier, reasons: [] };
}

function denied(tier, code, message) {
  return { allowed: false, tier, reasons: [{ code, field: "author", message }] };
}

function uniqueByNumber(proposals) {
  const found = new Map();
  for (const proposal of proposals) {
    const number = Number(proposal?.number);
    if (Number.isSafeInteger(number) && number > 0) found.set(number, proposal);
  }
  return [...found.values()];
}

function validTime(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function byAgeThenNumber(a, b) {
  return a.createdAt - b.createdAt || a.number - b.number;
}
