# DigiArtifact Development Log - November 2025

> Full November timeline across the original DigiArtifact site, SecretVault, and Workers. Times are Mountain Time (UTC-7), 12-hour format.

---

## November 2025

### Week of November 18-24

- **Nov 22, 2025 (8:01 AM)** — Backed up the legacy static site and deployed the Next.js build artifacts to the root so the old experience stayed preserved. _(Commit `41aa322`)_
- **Nov 22, 2025 (3:57 PM)** — Made DigiArtifact Hub fully responsive across mobile, tablet, and desktop. _(Commit `1dafe0d`)_
- **Nov 22, 2025 (4:07 PM)** — Added product detail pages for all artifacts to improve discoverability. _(Commit `d8d42b9`)_
- **Nov 24, 2025 (7:58 PM)** — Added the SecretVault landing page with cinematic video backgrounds and removed the chronicleos submodule from the root. _(Commit `4240e41`)_
- **Nov 24, 2025 (8:57 PM)** — SecretVault inception: renamed the folder to `secretvault` for Cloudflare compatibility and stood up the dark-fantasy landing page with ambient motion. _(Commit `bcb54bd`)_

### Week of November 25-30

#### SecretVault rollout
- **Nov 25, 2025 (3:51 PM)** — Wired the Mailchimp signup form into the SecretVault landing page to capture leads. _(Commit `a99bc5e`)_
- **Nov 25, 2025 (7:18 PM)** — Added a Spooky expansion banner to the SecretVault homepage. _(Commit `b888808`)_
- **Nov 25, 2025 (7:39 PM)** — Published the Link-in-Bio page at `/links` for social discovery. _(Commit `674d029`)_

#### Workers platform launch (project inception)
- **Nov 25, 2025 (11:23 AM)** — First Workers commit laid down the time-tracking architecture and portal shell. _(Commit `5391b4e`)_
- **Nov 25, 2025 (2:59 PM)** — Shipped the full Workers Portal: Next.js frontend + Cloudflare Worker API, end-to-end time tracking, PIN auth, and core contexts (Auth, Settings, Gamification). _(Commit `1e06ef7`)_
- **Nov 25, 2025 (3:15 PM)** — Connected the frontend to the deployed Worker API so live data flowed through the dashboard. _(Commit `ffcac47`)_
- **Nov 25, 2025 (3:19 PM)** — Added PIN change/reset UX and matching API endpoints. _(Commit `cc7912e`)_
- **Nov 25, 2025 (7:16 PM)** — Hardening pass: fixed portal functionality, expanded Settings, and added the Spooky landing page. _(Commit `598182f`)_

#### Static site refresh
- **Nov 25, 2025 (12:04 PM)** — Rebuilt the static export with video assets to keep the root deployment in sync. _(Commit `3652b56`)_

---

*Last Updated: December 8, 2025*
