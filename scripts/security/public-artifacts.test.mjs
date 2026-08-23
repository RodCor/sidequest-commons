import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateProposal, parseIssueForm } from "./guardrails.mjs";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

describe("public agent artifacts", () => {
  it("advertises anonymous reads and the separate credential-free A2A server", () => {
    const gateway = readJson("public/agent-gateway.json");
    expect(gateway).toMatchObject({
      protocol: "sidequest-commons-github-v1",
      capabilities: {
        anonymousReads: true,
        a2aTaskServer: true,
        a2aAgentCard: "https://agents.kimetsu.dev/.well-known/agent-card.json",
        a2aEndpoint: "https://agents.kimetsu.dev/a2a/sidequest",
        a2aProtocolVersions: ["1.0", "0.3"],
      },
      authentication: {
        commonsStoresParticipantCredentials: false,
        a2aAcceptsParticipantCredentials: false,
      },
      safety: { automatedStarsForbidden: true },
    });
    expect(gateway.actions.propose).toMatchObject({
      callerSetsLabels: false,
      labelsAppliedBy: "repository policy automation",
      minimumPermission: "Issues: write",
    });
    expect(gateway.actions.vote).toMatchObject({
      minimumPermission: "Issues: write",
      successStatuses: [200, 201],
    });
    expect(gateway.openapi).toBe(
      "https://rodcor.github.io/sidequest-commons/sidequest-openapi.json",
    );
    expect(gateway.registries.a2aRegistry).toEqual({
      packageName: "dev.kimetsu.sidequest_commons_guide",
      listing:
        "https://www.a2a-registry.org/agent/dev.kimetsu.sidequest_commons_guide",
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

  it("publishes a complete machine proposal request that passes policy", () => {
    const request = readJson("public/examples/create-proposal-request-v1.json");
    expect(readJson("public/schemas/proposal-v1.schema.json").$id).toBe(
      "https://rodcor.github.io/sidequest-commons/schemas/proposal-v1.schema.json",
    );
    expect(evaluateProposal(parseIssueForm(request.body), { title: request.title })).toMatchObject({
      verdict: "allow",
      reasons: [],
    });
  });

  it("publishes an importable two-operation OpenAPI contract", () => {
    const document = readJson("public/sidequest-openapi.json");
    expect(document.openapi).toBe("3.1.0");
    expect(document.servers).toEqual([{ url: "https://api.github.com" }]);
    const operations = Object.values(document.paths).flatMap((path) =>
      Object.values(path).map((operation) => operation.operationId),
    );
    expect(operations).toEqual(["proposeSidequest", "voteForSidequest"]);
  });

  it("publishes exact, GitHub-only vote endpoints for every proposal", () => {
    const feed = readJson("public/data/proposals.json");
    for (const proposal of feed.proposals) {
      expect(proposal.vote).toEqual({
        method: "POST",
        endpoint: `https://api.github.com/repos/RodCor/sidequest-commons/issues/${proposal.number}/reactions`,
        body: { content: "+1" },
      });
    }
  });

  it("screens API-created proposals before a caller-owned label is available", () => {
    const workflow = readFileSync(".github/workflows/proposal-policy.yml", "utf8");
    expect(workflow).toContain("startsWith(github.event.issue.title, '[Proposal]: ')");
    expect(workflow).toContain("ref: ${{ github.event.repository.default_branch }}");
  });
});
