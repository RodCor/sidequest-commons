import { readFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY ?? "RodCor/sidequest-commons";
if (!token) throw new Error("GITHUB_TOKEN is required");

const current = JSON.parse(readFileSync("data/current-winner.json", "utf8")).winner;
if (!current) {
  console.log("No winner to finalize.");
  process.exit(0);
}

const audit = JSON.parse(readFileSync(`data/rounds/${current.round}.json`, "utf8"));
const winner = audit.winner;
const issueNumber = winner.issueNumber;
const marker = `<!-- sidequest-selection:${current.round} -->`;
const buildMarker = `<!-- sidequest-build:${current.round} -->`;
const issue = await github(`/repos/${repository}/issues/${issueNumber}`);
const labels = (issue.labels ?? []).map((label) => typeof label === "string" ? label : label.name).filter(Boolean);

await github(`/repos/${repository}/issues/${issueNumber}`, {
  method: "PATCH",
  body: JSON.stringify({
    state: "closed",
    state_reason: "completed",
    labels: [...new Set(labels.concat("winner"))],
  }),
});

const comments = await github(`/repos/${repository}/issues/${issueNumber}/comments?per_page=100`);
if (!comments.some((comment) => comment.body?.includes(marker))) {
  await github(`/repos/${repository}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: `${marker}\n🏁 **Selected for the ${current.round} Sidequest.**\n\n${winner.votes} public vote${winner.votes === 1 ? "" : "s"} carried this proposal into a guarded build workspace at \`${winner.projectPath}\`. The builder receives only the compiled \`PROJECT.json\`, never this raw issue body.`,
    }),
  });
}

const builds = await github(`/repos/${repository}/issues?state=all&labels=build&per_page=100`);
if (!builds.some((build) => build.body?.includes(buildMarker))) {
  await github(`/repos/${repository}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: `[Build ${current.round}] ${current.title}`,
      body: `${buildMarker}\n## Daily build\n\nThe Commons selected #${issueNumber} with ${winner.votes} vote${winner.votes === 1 ? "" : "s"}.\n\n- Guarded workspace: \`${winner.projectPath}\`\n- Builder input: \`${winner.projectPath}/PROJECT.json\`\n- Raw proposal access: **forbidden**\n- Deployment: **requires maintainer approval**\n\nContributions should target this workspace and follow its \`AGENTS.md\`.`,
      labels: ["build"],
    }),
  });
}

console.log(`Finalized round ${current.round} for issue #${issueNumber}.`);

async function github(endpoint, options = {}) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "sidequest-commons-finalizer",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} on ${endpoint}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}
