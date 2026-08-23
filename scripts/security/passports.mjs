const RANKS = Object.freeze({
  scout: Object.freeze({ id: "scout", title: "Scout", level: 1 }),
  builder: Object.freeze({ id: "builder", title: "Builder", level: 2 }),
  pathfinder: Object.freeze({ id: "pathfinder", title: "Pathfinder", level: 3 }),
  trailblazer: Object.freeze({ id: "trailblazer", title: "Trailblazer", level: 4 }),
});

export function compilePassports({ acceptedIssues = [], winnerIssues = [], mergedPullRequests = [] }) {
  const records = new Map();
  addUnique(records, acceptedIssues, "accepted", (item) => item.number);
  addUnique(records, winnerIssues, "wins", (item) => item.number);
  addUnique(records, mergedPullRequests.filter((item) => item.merged_at), "merges", (item) => item.number);

  return [...records.values()]
    .map(({ login, accepted, wins, merges }) => {
      const stats = {
        acceptedProposals: accepted.size,
        winningProposals: wins.size,
        mergedContributions: merges.size,
      };
      const rank = earnedRank(stats);
      return {
        login,
        profileUrl: `https://github.com/${login}`,
        rank,
        badges: earnedBadges(stats),
        stats,
        nextMilestone: nextMilestone(stats),
      };
    })
    .sort((a, b) => b.rank.level - a.rank.level
      || b.stats.winningProposals - a.stats.winningProposals
      || b.stats.mergedContributions - a.stats.mergedContributions
      || a.login.localeCompare(b.login));
}

export function safeLogin(value) {
  const login = String(value ?? "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39);
  return login || null;
}

function addUnique(records, items, field, identity) {
  for (const item of items) {
    if (item?.user?.type === "Bot") continue;
    const login = safeLogin(item?.user?.login);
    if (!login) continue;
    const key = login.toLowerCase();
    if (!records.has(key)) records.set(key, { login, accepted: new Set(), wins: new Set(), merges: new Set() });
    records.get(key)[field].add(Number(identity(item)) || 0);
  }
}

function earnedRank(stats) {
  if (stats.winningProposals > 0 && stats.mergedContributions > 0) return RANKS.trailblazer;
  if (stats.winningProposals > 0) return RANKS.pathfinder;
  if (stats.mergedContributions > 0) return RANKS.builder;
  return RANKS.scout;
}

function earnedBadges(stats) {
  const badges = [];
  if (stats.acceptedProposals > 0) badges.push("scout");
  if (stats.mergedContributions > 0) badges.push("builder");
  if (stats.winningProposals > 0) badges.push("pathfinder");
  if (stats.winningProposals > 0 && stats.mergedContributions > 0) badges.push("trailblazer");
  return badges;
}

function nextMilestone(stats) {
  if (stats.winningProposals > 0 && stats.mergedContributions > 0) return "Keep shipping public-good sidequests.";
  if (stats.winningProposals > 0) return "Merge a contribution to unlock Trailblazer.";
  if (stats.mergedContributions > 0) return "Win a daily round to unlock Trailblazer.";
  return "Merge a contribution or win a daily round.";
}
