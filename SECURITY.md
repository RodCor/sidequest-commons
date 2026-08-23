# Security policy

## Report privately

Use the repository's **Security → Report a vulnerability** flow. Do not open a public issue with exploit details, credentials, tokens, private data, or a proof of concept that can affect third parties.

## Credential posture

Sidequest Commons does not operate its own participant identity system. Proposals and votes use GitHub Issues and reactions. The website does not request or persist participant OAuth tokens.

Fork pull requests run with read-only repository permissions and no secrets. The daily selector uses GitHub's short-lived workflow token and cannot access deployment environments. Deployment, if configured, must use a protected environment unavailable to pull-request workflows.

## Supported surface

Security reports are accepted for the website, policy compiler, daily selector, generated project boundary, and workflow configuration on the current `main` branch.

## Response

Maintainers may pause proposal intake or daily selection while investigating. A confirmed trust-boundary bypass blocks releases until the boundary is restored and a regression test exists.

