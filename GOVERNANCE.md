# Governance

## Daily selection

At 21:00 `America/Argentina/Buenos_Aires`, the selector considers open issues carrying both `proposal` and `eligible`. A proposal needs at least one 👍 reaction to enter the selection. It re-runs policy evaluation, then orders candidates by:

1. 👍 reaction count, descending.
2. Issue creation time, ascending.
3. Issue number, ascending.

The result is written to `data/rounds/YYYY-MM-DD.json`. A round is idempotent: once that file exists, automation cannot select another winner for the date.

## Moderation

Deterministic screening is an entry filter, not a promise. Maintainers may move proposals to `needs-review` or `blocked`, pause selection, remove coordinated reactions from consideration, or decline a project that creates unacceptable legal, safety, privacy, or maintenance risk.

## Stars

Stars are an optional expression of interest. They are never required to propose, vote, contribute, or win, and they do not alter vote weight.

## Changes to governance

Changes to selection, guardrails, workflow permissions, or agent boundaries require CODEOWNER review and must preserve a public audit trail.
