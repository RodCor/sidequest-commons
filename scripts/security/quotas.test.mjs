import { describe, expect, it } from "vitest";
import { evaluateProposalQuota, quotaTier } from "./quotas.mjs";

const now = new Date("2026-08-23T12:00:00Z");
const proposal = (number, createdAt, state = "open") => ({ number, created_at: createdAt, state });

describe("proposal quotas", () => {
  it("limits newcomers to one proposal per rolling day", () => {
    const current = proposal(2, "2026-08-23T11:00:00Z");
    const result = evaluateProposalQuota({
      issue: current,
      proposals: [proposal(1, "2026-08-23T10:00:00Z"), current],
      now,
    });
    expect(result).toMatchObject({ allowed: false, reasons: [{ code: "DAILY_PROPOSAL_QUOTA" }] });
  });

  it("does not let an edit bypass the original submission quota", () => {
    const current = proposal(3, "2026-08-23T11:30:00Z");
    expect(evaluateProposalQuota({
      issue: current,
      proposals: [proposal(1, "2026-08-23T09:00:00Z"), current],
      now,
    }).allowed).toBe(false);
  });

  it("unlocks a larger allowance after a verified win or merge", () => {
    expect(quotaTier({ wins: 1 }).id).toBe("contributor");
    expect(quotaTier({ mergedPullRequests: 1 }).id).toBe("contributor");
    const current = proposal(3, "2026-08-23T11:30:00Z");
    expect(evaluateProposalQuota({
      issue: current,
      proposals: [proposal(1, "2026-08-23T09:00:00Z"), proposal(2, "2026-08-23T10:00:00Z"), current],
      signals: { mergedPullRequests: 1 },
      now,
    }).allowed).toBe(true);
  });

  it("caps the number of simultaneously open proposals", () => {
    const current = proposal(4, "2026-08-20T10:00:00Z");
    const result = evaluateProposalQuota({
      issue: current,
      proposals: [proposal(1, "2026-08-17T10:00:00Z"), proposal(2, "2026-08-18T10:00:00Z"), proposal(3, "2026-08-19T10:00:00Z"), current],
      now,
    });
    expect(result).toMatchObject({ allowed: false, reasons: [{ code: "OPEN_PROPOSAL_QUOTA" }] });
  });
});
