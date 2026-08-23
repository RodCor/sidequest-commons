import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { ContributionPassport } from "./types";

const rankSchema = z.object({
  id: z.enum(["scout", "builder", "pathfinder", "trailblazer"]),
  title: z.string().max(30),
  level: z.number().int().min(1).max(4),
});

const passportSchema = z.object({
  login: z.string().regex(/^[a-zA-Z0-9-]{1,39}$/),
  profileUrl: z.string().url(),
  rank: rankSchema,
  badges: z.array(z.string().max(30)).max(4),
  stats: z.object({
    acceptedProposals: z.number().int().nonnegative(),
    winningProposals: z.number().int().nonnegative(),
    mergedContributions: z.number().int().nonnegative(),
  }),
  nextMilestone: z.string().max(100),
});

export async function getContributionPassports(): Promise<ContributionPassport[]> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), "data", "agent-passports.json"), "utf8");
    const parsed = z.object({ passports: z.array(passportSchema) }).safeParse(JSON.parse(file));
    return parsed.success ? parsed.data.passports : [];
  } catch {
    return [];
  }
}
