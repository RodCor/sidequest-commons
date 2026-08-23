import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Proposal, Winner } from "./types";

const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "RodCor";
const repo = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "sidequest-commons";
export const repositoryUrl = `https://github.com/${owner}/${repo}`;

const issueSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  html_url: z.string().url(),
  created_at: z.string(),
  user: z.object({ login: z.string() }),
  labels: z.array(z.union([z.string(), z.object({ name: z.string().nullable() })])),
  reactions: z.object({ "+1": z.number() }),
  pull_request: z.unknown().optional(),
});

export async function getProposals(): Promise<Proposal[]> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    };
    if (process.env.GITHUB_READ_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_READ_TOKEN}`;
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=proposal,eligible&sort=created&direction=desc&per_page=100`,
      { headers },
    );
    if (!response.ok) return [];
    const parsed = z.array(issueSchema).safeParse(await response.json());
    if (!parsed.success) return [];
    return parsed.data
      .filter((issue) => !issue.pull_request && hasLabels(issue.labels, "proposal", "eligible"))
      .map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: clean(issue.title.replace(/^\[Proposal\]:\s*/i, ""), 90),
        summary: clean(readField(issue.body ?? "", "Problem to solve") || readField(issue.body ?? "", "The smallest useful version"), 280),
        category: clean(readField(issue.body ?? "", "Category") || "Open utility", 40),
        author: issue.user.login,
        votes: issue.reactions["+1"],
        url: issue.html_url,
        createdAt: issue.created_at,
      }))
      .sort((a, b) => b.votes - a.votes || a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function getWinner(): Promise<Winner | null> {
  try {
    const headers: HeadersInit = {};
    if (process.env.GITHUB_READ_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_READ_TOKEN}`;
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/data/current-winner.json`,
      { headers },
    );
    const file = response.ok
      ? await response.text()
      : await fs.readFile(path.join(process.cwd(), "data", "current-winner.json"), "utf8");
    const value = JSON.parse(file) as { winner?: Winner | null };
    return value.winner ?? null;
  } catch {
    return null;
  }
}

function readField(body: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`### ${escaped}\\s+([\\s\\S]*?)(?=\\n### |$)`, "i"));
  return match?.[1]?.trim().replace(/^_No response_$/i, "") ?? "";
}

function clean(value: string, length: number) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, length);
}

function hasLabels(labels: Array<string | { name: string | null }>, ...required: string[]) {
  const names = new Set(labels.map((label) => typeof label === "string" ? label : label.name ?? ""));
  return required.every((label) => names.has(label));
}
