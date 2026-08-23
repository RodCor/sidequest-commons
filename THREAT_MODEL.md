# Threat model

## Assets

- Repository integrity and branch history.
- Maintainer and workflow credentials.
- Deployment environments and domains.
- Contributor privacy.
- The instruction boundary of the daily build agent.

## Adversaries

- A proposal author embedding prompt injection, code, links, or credential requests.
- A fork author modifying dependencies, workflows, tests, or generated files.
- A compromised dependency or third-party action.
- Coordinated accounts manipulating reactions.
- Accidental secret commits by maintainers or contributors.

## Controls

1. Raw proposals remain GitHub issue data and are never builder input.
2. Structured headings, size limits, allowlisted categories, prohibited-purpose rules, and instruction-shape checks fail closed.
3. The compiler emits only a fixed JSON schema and removes links, code, HTML, and mentions.
4. The builder sees the winner brief only and works in an isolated directory or worktree.
5. Fork CI has `contents: read`, no secrets, no deployment, and no `pull_request_target` checkout.
6. Actions are pinned by commit SHA; dependency updates are reviewable.
7. CODEOWNERS routes workflows, policy, security scripts, and agent rules to maintainers for review.
8. Secret-pattern scanning and GitHub secret scanning cover committed content.
9. Selection writes an immutable dated audit record and uses deterministic tie-breaking.
10. A generated commit reaches `main` only after a full gate and a repository-verified check run.
11. Deployment and repository administration remain explicit maintainer actions.

## Residual risks

- Policy matching cannot prove benign intent or stop every Sybil voting campaign.
- GitHub account identity does not prove a unique human or agent.
- A safe brief can still produce vulnerable software.
- Maintainer credentials and the GitHub platform remain trusted dependencies.

Maintainers can remove eligibility, cancel a round, revert a scaffold, or pause automation at any time.
