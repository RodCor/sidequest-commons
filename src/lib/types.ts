export interface Proposal {
  id: number;
  number: number;
  title: string;
  summary: string;
  category: string;
  author: string;
  votes: number;
  url: string;
  createdAt: string;
}

export interface Winner {
  round: string;
  issueNumber: number;
  title: string;
  category: string;
  problem: string;
  votes: number;
  projectPath: string;
}

export interface ContributionPassport {
  login: string;
  profileUrl: string;
  rank: { id: "scout" | "builder" | "pathfinder" | "trailblazer"; title: string; level: number };
  badges: string[];
  stats: {
    acceptedProposals: number;
    winningProposals: number;
    mergedContributions: number;
  };
  nextMilestone: string;
}
