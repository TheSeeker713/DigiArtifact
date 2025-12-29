# DEVLOG — SecretVault Recovery

**Date:** 2025-12-29 (Mountain Standard Time, UTC-7)

## Summary
On Dec 29, 2025 an accidental deletion removed the `secretvault/` folder from the repository root during a root cleanup operation. The deletion was identified and the folder was restored from an earlier commit. This devlog documents the timeline, commits, and actions taken to recover the subpage `secretvault.digiartifact.com`.

## Timeline of relevant events (MST)
- **Nov 24, 2025 08:57 PM** — `fix: rename Secret Vault folder to secretvault for Cloudflare` (commit `bcb54bdaf22d294a0daecfdc42847be4465c5b8d`).
- **Nov 25, 2025 03:51 PM** — `Connect Mailchimp signup form to SecretVault landing page` (commit `a99bc5e041dcf3b6b643d0d605f0fccaa9a0f399`).
- **Nov 25, 2025 07:18 PM** — `Add Spooky expansion banner to SecretVault homepage` (commit `b8888085a00978da5afaf6c1b3c12a30fbf8ea41`).
- **Nov 25, 2025 07:39 PM** — `Add Link in Bio page at /links` (commit `674d029f12afe21d48ef2f17f1f14bf2ec272668`).

## Incident (Dec 29, 2025)
- **~11:38 AM MST** — An interactive root cleanup script (`cleanup-root.ps1`) was executed with `-Force` in the repository root to remove legacy static files. The cleanup script deleted a number of legacy files and (unexpectedly) removed the `secretvault/` folder.
- **11:39–11:41 AM MST** — The repository was inspected and the deletion of `secretvault/` was identified as accidental. The folder was restored from commit `674d029f12afe21d48ef2f17f1f14bf2ec272668` (the last commit touching that path) and verified in the working tree.
- **11:41:35 AM MST** — Recovery actions were recorded and a devlog entry prepared (this document).

## Actions taken
1. Verified repository state and located latest commits affecting `secretvault/` using `git log`.
2. Restored `secretvault/` from commit `674d029f12afe21d48ef2f17f1f14bf2ec272668` into the working tree and confirmed files were present.
3. Prepared this devlog and added `cleanup-root.ps1` to the repo (script lives in the repository root and supports `-DryRun` and `-Force`).
4. Built the project (see build notes below).
5. Committed the devlog and cleanup script for auditability and pushed changes to `main`.

## Notes & next steps
- No site downtime occurred beyond the brief window between deletion and restoration.
- We will add an additional confirmation step to the cleanup script and optionally log deletions for auditability.

---
*Recorded and authored by the DigArtifact Engineering Team.*
