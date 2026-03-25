# DigiArtifact Monorepo

DigiArtifact contains multiple web applications and APIs in one repository:

- `kaia/` - KAIA productivity app (Next.js + Cloudflare/OpenNext + D1)
- `workers/` - Workers Portal frontend
- `workers/api/` - Cloudflare Workers API backend
- `digiartifact-hub/` - DigiArtifact public hub/site
- `documents/` - operational and product documentation

## Repository Policy

- Root automation policy files:
  - `AGENTS.md`
  - `CLAUDE.md`
- Cursor always-apply rule:
  - `.cursor/rules/read-policy-first.mdc`

Production deployment policy is Linux CI first (`ubuntu-latest`) with workflow validation before smoke checks.

## Local Development

### KAIA

```bash
cd kaia
npm install
npm run dev
```

Useful commands:

- `npm run lint`
- `npm run build`
- `npm run cf:build`
- `npm run db:local`

### Workers Portal + API

```bash
cd workers
npm install
npm run dev
```

Useful commands:

- `npm run lint`
- `npm run build`
- `npm run api:dev`

### DigiArtifact Hub

```bash
cd digiartifact-hub
npm install
npm run dev
```

Useful commands:

- `npm run lint`
- `npm run build`

## CI Workflows

- `.github/workflows/deploy-kaia.yml`
- `.github/workflows/deploy-workers-api.yml`
- `.github/workflows/deploy-hub.yml`

## Operational Notes

- Keep Cloudflare credentials only in GitHub Actions secrets and Cloudflare secrets store.
- Do not commit credentials, tokens, or default secrets.
- See `documents/project-docs/OPTIMIZATION_RUNBOOK.md` for incident response and rollback guidance.
