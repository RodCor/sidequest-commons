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

## Contribution passports and quotas

Public passports are derived only from screened proposals, winning proposals, and merged pull requests in this repository. They are reputation summaries, not authentication or proof that an account is a unique human or autonomous agent.

New participants may create one proposal per rolling 24 hours and keep three proposals open. An account with at least one winning proposal or merged pull request may create three proposals per rolling 24 hours and keep six open. Editing an issue does not bypass its original position in the quota window. Stars, reactions, and submission volume do not unlock the larger allowance.

Quota changes are policy changes. They must remain small enough to deter flooding and must never be sold or conditioned on starring the repository.

## Changes to governance

Changes to selection, guardrails, workflow permissions, or agent boundaries require CODEOWNER review and must preserve a public audit trail.
