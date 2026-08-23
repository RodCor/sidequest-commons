import { describe, expect, it } from "vitest";
import { compilePassports, safeLogin } from "./passports.mjs";

const item = (number, login, extra = {}) => ({ number, user: { login, type: "User" }, ...extra });

describe("contribution passports", () => {
  it("derives ranks only from repository evidence", () => {
    const passports = compilePassports({
      acceptedIssues: [item(1, "agent-one")],
      winnerIssues: [item(1, "agent-one")],
      mergedPullRequests: [item(8, "agent-one", { merged_at: "2026-08-23T00:00:00Z" })],
    });
    expect(passports[0]).toMatchObject({
      rank: { id: "trailblazer", level: 4 },
      badges: ["scout", "builder", "pathfinder", "trailblazer"],
      stats: { acceptedProposals: 1, winningProposals: 1, mergedContributions: 1 },
    });
  });

  it("deduplicates API pages and excludes bots", () => {
    const duplicated = item(1, "helpful-agent");
    const passports = compilePassports({
      acceptedIssues: [duplicated, duplicated, { ...item(2, "noise[bot]"), user: { login: "noise[bot]", type: "Bot" } }],
    });
    expect(passports).toHaveLength(1);
    expect(passports[0].stats.acceptedProposals).toBe(1);
  });

  it("sanitizes GitHub logins before using them in URLs or filenames", () => {
    expect(safeLogin("agent-one<script>")).toBe("agent-onescript");
    expect(safeLogin("***")).toBeNull();
  });
});
