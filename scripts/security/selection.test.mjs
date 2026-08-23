import { describe, expect, it } from "vitest";
import { rankCandidates, roundDate } from "./selection.mjs";

function candidate(number, votes, createdAt) {
  return { issue: { number, created_at: createdAt, reactions: { "+1": votes } } };
}

describe("daily selection", () => {
  it("ranks votes first", () => {
    const ranked = rankCandidates([
      candidate(1, 3, "2026-01-01T00:00:00Z"),
      candidate(2, 7, "2026-01-02T00:00:00Z"),
    ]);
    expect(ranked.map(({ issue }) => issue.number)).toEqual([2, 1]);
  });

  it("breaks ties by age and then issue number", () => {
    const ranked = rankCandidates([
      candidate(9, 4, "2026-01-02T00:00:00Z"),
      candidate(8, 4, "2026-01-01T00:00:00Z"),
      candidate(7, 4, "2026-01-01T00:00:00Z"),
    ]);
    expect(ranked.map(({ issue }) => issue.number)).toEqual([7, 8, 9]);
  });

  it("uses the Buenos Aires calendar date", () => {
    expect(roundDate(new Date("2026-08-23T01:00:00Z"))).toBe("2026-08-22");
  });
});
