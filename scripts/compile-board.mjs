import { writeFileSync } from "node:fs";
import { evaluateProposal, parseIssueForm, sanitizePlainText } from "./security/guardrails.mjs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY ?? "RodCor/sidequest-commons";
if (!token) throw new Error("GITHUB_TOKEN is required");

const issues = await allEligibleIssues();
const proposals = issues
  .filter((issue) => !issue.pull_request)
  .map((issue) => ({ issue, screening: evaluateProposal(parseIssueForm(issue.body ?? "")) }))
  .filter(({ screening }) => screening.verdict === "allow")
  .map(({ issue, screening }) => ({
    id: Number(issue.id),
    number: Number(issue.number),
    title: sanitizePlainText(String(issue.title).replace(/^\[Proposal\]:\s*/i, ""), 90),
    summary: sanitizePlainText(screening.fields.problem || screening.fields.mvp, 280),
    category: sanitizePlainText(screening.fields.category, 40),
    author: String(issue.user?.login ?? "unknown").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39),
    votes: Math.max(0, Number(issue.reactions?.["+1"]) || 0),
    url: trustedIssueUrl(issue.html_url, issue.number),
    createdAt: validDate(issue.created_at),
  }))
  .sort((a, b) => b.votes - a.votes || a.createdAt.localeCompare(b.createdAt) || a.number - b.number);

writeFileSync("data/site-proposals.json", JSON.stringify({ proposals, generatedAt: new Date().toISOString() }, null, 2) + "\n");
console.log(`Compiled ${proposals.length} screened proposal${proposals.length === 1 ? "" : "s"} for the public board.`);

async function allEligibleIssues() {
  const collected = [];
  for (let page = 1; page <= 100; page += 1) {
    const batch = await github(`/repos/${repository}/issues?state=open&labels=proposal,eligible&sort=created&direction=asc&per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("GitHub returned a malformed issue page");
    collected.push(...batch);
    if (batch.length < 100) return collected;
  }
  throw new Error("Eligible queue exceeds the 10,000-proposal safety cap");
}

function trustedIssueUrl(value, number) {
  const expected = `https://github.com/${repository}/issues/${Number(number)}`;
  return value === expected ? value : expected;
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "1970-01-01T00:00:00.000Z" : date.toISOString();
}

async function github(endpoint) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "sidequest-commons-board-compiler",
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} on ${endpoint}: ${await response.text()}`);
  return response.json();
}
