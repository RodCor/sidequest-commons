import { ArrowUpRight, GitBranch, ShieldCheck, ThumbsUp } from "lucide-react";
import type { Proposal } from "@/lib/types";

export function ProposalCard({ proposal, rank }: { proposal: Proposal; rank: number }) {
  return (
    <article className="proposal-card">
      <div className="proposal-meta"><span className="rank">#{String(rank).padStart(2, "0")}</span><span className="category">{proposal.category}</span><span className="screened"><ShieldCheck size={12} />screened</span></div>
      <h3>{proposal.title}</h3>
      <p>{proposal.summary}</p>
      <div className="proposal-author"><GitBranch size={13} /><span>proposed by <strong>@{proposal.author}</strong></span></div>
      <footer><span className="vote-count"><ThumbsUp size={15} fill="currentColor" />{proposal.votes}</span><a href={proposal.url} target="_blank" rel="noreferrer" aria-label={`Vote for ${proposal.title} on GitHub`}>Vote on GitHub <ArrowUpRight size={13} /></a></footer>
    </article>
  );
}
