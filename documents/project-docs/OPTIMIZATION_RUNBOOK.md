# DigiArtifact Operations Runbook

## Incident Response

1. Confirm blast radius (`kaia`, `workers/api`, `digiartifact-hub`).
2. Check latest GitHub Actions deployments and failing jobs.
3. Validate production health endpoints:
   - `https://kaia.digiartifact.com/`
   - `https://kaia.digiartifact.com/api/lists`
4. Roll back to previous known-good deployment if user-impacting.

## Secret Rotation

- Rotate Cloudflare API tokens every 60-90 days.
- Keep secrets only in GitHub Actions secrets and Cloudflare secrets store.
- Do not commit any default JWT or API credentials to source control.

## Deploy Rollback

1. Identify last successful workflow run.
2. Re-run deploy from known-good commit SHA.
3. Verify health and API smoke tests after rollback.

## Database Migration Safety

1. Run migrations in CI before app deploy where possible.
2. Keep schema changes backward-compatible for one release.
3. Validate reads/writes after migration with smoke checks.
4. Maintain rollback scripts for destructive schema changes.

## Security Verification Checklist

- [ ] No auth token appears in URL query or fragment.
- [ ] Session cookies use `Secure` and `SameSite=Lax`.
- [ ] Mutating API endpoints require authenticated session.
- [ ] Tenant data queries are scoped by user membership.
- [ ] Public debug/archive endpoints are protected.
