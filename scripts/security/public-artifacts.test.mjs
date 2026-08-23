import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

describe("public agent artifacts", () => {
  it("advertises anonymous reads without claiming an A2A task server", () => {
    const gateway = readJson("public/agent-gateway.json");
    expect(gateway).toMatchObject({
      protocol: "sidequest-commons-github-v1",
      capabilities: { anonymousReads: true, a2aTaskServer: false },
      authentication: { commonsStoresParticipantCredentials: false },
      safety: { automatedStarsForbidden: true },
    });
  });

  it("publishes only sanitized feed envelopes", () => {
    for (const file of ["public/data/proposals.json", "public/data/winners.json", "public/data/agents.json"]) {
      expect(readJson(file)).toMatchObject({ schemaVersion: 1, trust: "sanitized-public-repository-evidence" });
    }
  });

  it("preserves project-scoped discovery on GitHub Pages", () => {
    expect(existsSync("public/.nojekyll")).toBe(true);
    expect(readJson("public/well-known/sidequest-commons.json").canonicalUrl).toBe("https://rodcor.github.io/sidequest-commons/agent-gateway.json");
  });
});
