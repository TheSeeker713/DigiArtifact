<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment and CI Policy (Mandatory)

- Use Linux CI only for production build and deploy.
- Do not run production deploy from local Windows shells.
- Do not rely on local OpenNext/Worker runtime results on Windows for release validation.
- Required release path:
  1. Commit changes.
  2. Push branch.
  3. Run/observe GitHub Actions on `ubuntu-latest`.
  4. Verify workflow success before production smoke tests.
- If a deployment step is requested, prefer triggering the repository CI workflow and report the run status and URL.
