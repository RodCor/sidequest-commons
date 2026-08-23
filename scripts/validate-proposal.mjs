import { readFileSync } from "node:fs";
import { evaluateProposal, parseIssueForm } from "./security/guardrails.mjs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;
if (!token || !repository || !eventPath) throw new Error("GITHUB_TOKEN, GITHUB_REPOSITORY, and GITHUB_EVENT_PATH are required");

const event = JSON.parse(readFileSync(eventPath, "utf8"));
const issue = event.issue;
if (!issue || issue.pull_request) throw new Error("This validator only accepts issue events");

const result = evaluateProposal(parseIssueForm(issue.body ?? ""));
const stateLabel = result.verdict === "allow" ? "eligible" : result.verdict === "review" ? "needs-review" : "blocked";
const existing = (issue.labels ?? []).map((label) => typeof label === "string" ? label : label.name).filter(Boolean);
const labels = [...new Set(existing.filter((label) => !["eligible", "needs-review", "blocked"].includes(label)).concat("proposal", stateLabel))];

await github(`/repos/${repository}/issues/${issue.number}`, { method: "PATCH", body: JSON.stringify({ labels }) });
const codes = result.reasons.map((reason) => `\`${reason.code}\``).join(", ");
const message = [
  "<!-- commons-policy -->",
  `**Commons policy result: ${result.verdict.toUpperCase()}**`,
  result.verdict === "allow"
    ? "This proposal passed deterministic screening and is eligible for the daily selection. Maintainers may still pause it for review."
    : `Reason codes: ${codes || "manual review required"}. Edit the structured proposal to address these boundaries.`,
  "",
  "Raw proposal text is never passed to the build agent. Eligibility does not guarantee selection or implementation.",
].join("\n\n");

const comments = await github(`/repos/${repository}/issues/${issue.number}/comments?per_page=100`);
const prior = comments.find((comment) => comment.user?.type === "Bot" && comment.body?.includes("<!-- commons-policy -->"));
if (prior) await github(`/repos/${repository}/issues/comments/${prior.id}`, { method: "PATCH", body: JSON.stringify({ body: message }) });
else await github(`/repos/${repository}/issues/${issue.number}/comments`, { method: "POST", body: JSON.stringify({ body: message }) });

console.log(JSON.stringify({ issue: issue.number, verdict: result.verdict, reasons: result.reasons }));

async function github(endpoint, options = {}) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "sidequest-commons-policy",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} on ${endpoint}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}
