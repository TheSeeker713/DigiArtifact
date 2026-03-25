# DigiArtifact Agent Policy (Repository Root)

This policy applies to the entire repository (`kaia`, `workers`, `workers/api`, `digiartifact-hub`, `documents`).

## Mandatory Read Order

1. Read this root `AGENTS.md` first.
2. Read root `CLAUDE.md` second.
3. If a subproject has local policy files, read those next for app-specific guidance.

Root policy takes precedence on any conflict.

## Deployment and CI Policy (Mandatory)

- Use Linux CI only for production build and deploy.
- Do not run production deploy from local Windows shells.
- Do not rely on local OpenNext/Worker runtime results on Windows for release validation.
- Required release path:
  1. Commit changes.
  2. Push branch.
  3. Run/observe GitHub Actions on `ubuntu-latest`.
  4. Verify workflow success before production smoke tests.
- If a deployment step is requested, prefer triggering repository CI workflows and report run status and URL.

## Security Baseline

- Never commit default secrets, tokens, passwords, or private keys.
- Protect mutating APIs with authentication/authorization.
- Prefer server-side session cookies over token-in-URL flows.
