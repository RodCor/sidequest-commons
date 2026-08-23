import { readFileSync } from "node:fs";
import { evaluateProposal, parseIssueForm } from "./security/guardrails.mjs";
import { evaluateProposalQuota } from "./security/quotas.mjs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;
if (!token || !repository || !eventPath) throw new Error("GITHUB_TOKEN, GITHUB_REPOSITORY, and GITHUB_EVENT_PATH are required");

const event = JSON.parse(readFileSync(eventPath, "utf8"));
const issue = event.issue;
if (!issue || issue.pull_request) throw new Error("This validator only accepts issue events");

let result = evaluateProposal(parseIssueForm(issue.body ?? ""), { title: issue.title });
let quota = null;
if (result.verdict === "allow") {
  const author = safeLogin(issue.user?.login);
  if (!author) {
    result = { ...result, verdict: "deny", reasons: [{ code: "IDENTITY_INVALID", field: "author" }] };
  } else {
    const [proposals, winnerResponse] = await Promise.all([
      github(`/repos/${repository}/issues?state=all&creator=${encodeURIComponent(author)}&labels=proposal&sort=created&direction=desc&per_page=100`),
      github(`/repos/${repository}/issues?state=all&creator=${encodeURIComponent(author)}&labels=winner&per_page=1`),
    ]);
    const hasWin = Array.isArray(winnerResponse) && winnerResponse.some((candidate) => !candidate.pull_request);
    const mergedPullRequests = hasWin ? 0 : await mergedPullRequestCount(author);
    quota = evaluateProposalQuota({
      issue,
      proposals: Array.isArray(proposals) ? proposals.filter((candidate) => !candidate.pull_request) : [],
      signals: { wins: hasWin ? 1 : 0, mergedPullRequests },
    });
    if (!quota.allowed) result = { ...result, verdict: "deny", reasons: quota.reasons };
  }
}
const stateLabel = result.verdict === "allow" ? "eligible" : result.verdict === "review" ? "needs-review" : "blocked";
const existing = (issue.labels ?? []).map((label) => typeof label === "string" ? label : label.name).filter(Boolean);
const labels = [...new Set(existing.filter((label) => !["eligible", "needs-review", "blocked"].includes(label)).concat("proposal", stateLabel))];

await github(`/repos/${repository}/issues/${issue.number}`, { method: "PATCH", body: JSON.stringify({ labels }) });
const codes = result.reasons.map((reason) => `\`${reason.code}\``).join(", ");
const quotaGuidance = result.reasons.find((reason) => reason.message)?.message;
const message = [
  "<!-- commons-policy -->",
  `**Commons policy result: ${result.verdict.toUpperCase()}**`,
  result.verdict === "allow"
    ? `This proposal passed deterministic screening and is eligible for the daily selection. Quota tier: **${quota?.tier.id ?? "newcomer"}**. Maintainers may still pause it for review.`
    : quotaGuidance
      ? `Reason codes: ${codes}. ${quotaGuidance} The issue can become eligible after the rolling window clears or another open proposal is closed.`
      : `Reason codes: ${codes || "manual review required"}. Edit the structured proposal to address these boundaries.`,
  "",
  "Raw proposal text is never passed to the build agent. Eligibility does not guarantee selection or implementation.",
].join("\n\n");

const comments = await github(`/repos/${repository}/issues/${issue.number}/comments?per_page=100`);
const prior = comments.find((comment) => comment.user?.type === "Bot" && comment.body?.includes("<!-- commons-policy -->"));
if (prior) await github(`/repos/${repository}/issues/comments/${prior.id}`, { method: "PATCH", body: JSON.stringify({ body: message }) });
else await github(`/repos/${repository}/issues/${issue.number}/comments`, { method: "POST", body: JSON.stringify({ body: message }) });

console.log(JSON.stringify({ issue: issue.number, verdict: result.verdict, reasons: result.reasons }));

async function mergedPullRequestCount(author) {
  const query = encodeURIComponent(`repo:${repository} is:pr is:merged author:${author}`);
  const response = await github(`/search/issues?q=${query}&per_page=1`);
  return Math.max(0, Number(response?.total_count) || 0);
}

function safeLogin(value) {
  return String(value ?? "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39);
}

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
