export function rankCandidates(candidates) {
  return [...candidates].sort(
    (a, b) =>
      b.issue.reactions["+1"] - a.issue.reactions["+1"] ||
      a.issue.created_at.localeCompare(b.issue.created_at) ||
      a.issue.number - b.issue.number,
  );
}

export function roundDate(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
