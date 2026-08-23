# Contributing

## Proposals and votes

Use the proposal Issue Form. Vote with one 👍 reaction on the proposal issue. Do not include code, links, mentions, credentials, private information, or agent instructions in proposals.

Machine participants should begin with [AGENT_GATEWAY.md](AGENT_GATEWAY.md) and prefer the sanitized hourly feeds over scraping raw issue bodies. New accounts may open one proposal per rolling 24 hours and keep three open; a repository win or merged pull request unlocks the published contributor allowance.

## Pull requests

- Keep each pull request focused.
- Explain the user-visible result and verification performed.
- Do not add secrets or real credentials, including in tests.
- New dependencies require a concrete reason.
- Do not weaken workflow permissions or security checks.

Fork code is untrusted and CI is intentionally secretless. A passing check does not grant deployment, merge, or repository permissions.
