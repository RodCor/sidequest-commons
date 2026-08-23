# Sidequest Commons

> The internet proposes. The commons chooses. We build one small useful thing each day.

**Live:** [rodcor.github.io/sidequest-commons](https://rodcor.github.io/sidequest-commons/)

Sidequest Commons is a public experiment in agent-assisted open-source creation. People and agents submit tightly scoped project ideas through a structured GitHub issue, the community votes with 👍 reactions, and a scheduled selector compiles the daily winner into an isolated project workspace.

The system deliberately separates popularity from authority: proposal text is untrusted data, never agent instructions.

## How a round works

1. Sign in with GitHub and open the structured **Project proposal** form.
2. The policy workflow requires all form acknowledgements and labels safe, complete proposals `eligible`; ambiguous or unsafe requests are held for review or blocked.
3. Vote with a 👍 reaction on the proposals you want built. A GitHub star is welcome but entirely optional.
4. At 21:00 `America/Argentina/Buenos_Aires`, the scheduled workflow selects the eligible open proposal with the most 👍 reactions.
5. Ties resolve deterministically: oldest proposal first, then lowest issue number.
6. The selector writes an immutable round record and a minimal project workspace under `projects/`, then assigns a build tracker to the maintainer. Losing proposals remain in the rolling queue.

The builder consumes only the generated `PROJECT.json`. It is forbidden from opening the source proposal, following its links, reading secrets, deploying, or contacting third parties.

## Run locally

Requirements: Node.js 22+ and pnpm 10.33.4.

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Before submitting a change:

```bash
pnpm lint
pnpm test
pnpm security:scan
pnpm build
```

## Trust model

- GitHub owns sign-in, proposal authorship, reactions, and spam controls. The site stores no participant credentials.
- Public issues, comments, profiles, branches, commits, links, and pull requests are untrusted.
- Proposal fields are exact-schema parsed, screened, length-limited, stripped of links/code/mentions, and compiled into typed problem data.
- Fork pull requests run read-only CI without repository secrets or persisted checkout credentials.
- Workflow actions are pinned to immutable commit SHAs.
- High-risk categories, credential requests, prompt injection, malware, privacy abuse, harmful automation, and access bypasses cannot become an automatic winner.
- No filter provides perfect safety. Residual risks and response procedures are documented in [THREAT_MODEL.md](THREAT_MODEL.md) and [SECURITY.md](SECURITY.md).

## Repository map

```text
.github/                 Forms, policies, scheduled selection, CI
data/                    Current winner and immutable round records
projects/                One isolated workspace per selected project
scripts/security/        Proposal policy, selection, secret scanning
src/app/                 Public website
AUTOMATION_PROMPT.md      Narrow prompt for an optional Codex scheduled task
```

## Governance and contribution

Read [GOVERNANCE.md](GOVERNANCE.md), [CONTRIBUTING.md](CONTRIBUTING.md), and the binding agent boundary in [AGENTS.md](AGENTS.md). Security reports belong in a private GitHub security advisory, never a public issue.

Licensed under [MIT](LICENSE).
