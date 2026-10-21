# Repository maintenance

Verified 2026-10-21 for [faqihxdev/genesys](https://github.com/faqihxdev/genesys).

## Changes to main

The active [Protect main ruleset](https://github.com/faqihxdev/genesys/rules/25560707)
applies to the default branch, currently `main`.

- Changes must arrive through a pull request.
- The `Verify` check from GitHub Actions must pass against the latest `main`.
- No approving reviews are required. A maintainer can merge their own PR after verification.
- Force pushes and branch deletion are blocked.
- The ruleset has no bypass actors, including administrators and automation.

Create a working branch, open a PR to `main`, and wait for `Verify`. If `main` advances,
update the branch and rerun verification before merging. Existing merge methods remain available.
The required check is the `Verify` job in `.github/workflows/ci.yml`.

## Security services

GitHub repository settings enable secret scanning, push protection, Dependabot alerts and security
updates, and private vulnerability reporting. CodeQL default setup analyzes JavaScript, TypeScript,
and GitHub Actions with the default query suite on standard GitHub-hosted runners.
CodeQL is an additional scan; `Verify` is the required merge check.

These services are available free for this public repository. See
[GitHub's repository security guidance](https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository).

`.github/dependabot.yml` groups security updates by ecosystem for npm dependencies and GitHub
Actions. The npm ecosystem also handles this project's pnpm lockfile. Security updates run when
GitHub detects a supported advisory. npm version-update PRs are disabled with
`open-pull-requests-limit: 0`; that limit does not disable security updates.

The CI workflow pins Actions to commit SHAs. GitHub's
[Dependabot alert limitations](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts#limitations)
exclude SHA-pinned Actions, so Dependabot also checks those pins monthly with one grouped
version-update PR allowed at a time. A maintainer must review and merge dependency PRs after
`Verify` passes.

GitHub settings take effect independently of repository commits. Dependabot grouping uses the
configuration on the default branch. Maintainers can inspect the live configuration under
[rulesets](https://github.com/faqihxdev/genesys/settings/rules) and
[security settings](https://github.com/faqihxdev/genesys/settings/security_analysis).

## Public participation

Maintainers manage development. External contributions and pull requests are not accepted.
Issues remain enabled. Report vulnerabilities through the private route in [SECURITY.md](../SECURITY.md).

## Audit record

The 2026-10-21 audit inspected repository rules, collaborator permissions, Actions permissions,
security settings, issues, and issue comments. A redacted Gitleaks 8.30.1 scan inspected patches
from all reachable Git refs: 177 commits, including 159 non-merge commits scanned by the tool.
The six matches were CI placeholder values and a historical Supabase local demo anonymous key.
No live credentials were identified by that scan. It does not establish that all historical
content or binary files are free of private data.

The first CodeQL analysis completed for both configured languages. Its
[insecure-randomness alert](https://github.com/faqihxdev/genesys/security/code-scanning/1) was triaged
as a false positive: `generatePersonaTraitsFromConfig` samples a synthetic persona's demographic
gender. The random selection does not generate credentials, identifiers, or access-control values.
