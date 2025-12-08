# DigiArtifact Development Log - December 2025

> Full-project log (DigiArtifact root, SecretVault, and Workers). Times are Mountain Time (UTC-7) in 12-hour format.

---

## December 2025

### December 2 — Foundations & polish
- **4:42 PM** — Fixed clock timer drift and ignored stray mp4 assets. _(Workers, `7cc0afd`)_
- **5:06 PM** — Added timezone/time-format settings (MT by default). _(Workers, `2bfe764`)_
- **5:48 PM** — Updated credits for DigiArtifact + J.W. _(Workers, `7b686fe`)_
- **6:17 PM** — Shipped a hidden burrito easter egg. _(Workers, `70e0b5c`)_
- **6:25 PM** — Corrected timezone display; swapped burrito → fortune cookie. _(Workers, `260e3fc`)_

### December 3 — Feature avalanche
- **12:44 PM** — Smart Suggestions + Notes & Reports tools. _(Workers, `e72a6ea`)_
- **1:09 PM** — All Immediate Priority features delivered. _(Workers, `9439942`)_
- **2:47 PM** — All High Priority features (PWA, Analytics, Goals). _(Workers, `0e1ae2a`)_
- **3:37 PM** — Added missing `lucide-react`, fixed TS errors. _(Workers, `dc25598`)_
- **7:17 PM** — Block-based scheduling with gamification. _(Workers, `e2f6130`)_
- **7:24 PM** — Synced XP/schedule to D1; carry-over logic. _(Workers, `5e7208f`)_
- **7:45 PM** — PDF export with charts/tables. _(Workers, `f4e02e9`)_
- **7:58 PM** — Onboarding tutorial + enhanced help/admin data management. _(Workers, `cb4c8f6`)_
- **8:07 PM** — Functional PDF & CSV export for analytics. _(Workers, `f7f2186`)_
- **8:23 PM** — Analytics wired to real API data. _(Workers, `0ceb3f7`)_
- **8:45 PM** — Replaced all placeholder data with real API data. _(Workers, `cdb9053`)_

### December 4 — Admin, schedule, and debug tools
- **11:48 AM** — Schedule editor, admin user management, debug system. _(Workers, `c89e28e`)_

### December 5 — Tutorials, UX fixes, journals, cleanup, and upgrades
- **9:09 AM** — Interactive tutorial with click-through overlay. _(Workers, `c9999aa`)_
- **9:16 AM** — Tutorial uses 4-piece overlay for true click-through. _(Workers, `0da6006`)_
- **9:20 AM** — Suppress tutorial while clocked in. _(Workers, `db45363`)_
- **9:24 AM** — Show tutorial only for truly new users. _(Workers, `e9cb6a9`)_
- **9:45 AM** — Removed placeholder streak data; use real API data. _(Workers, `190f4b6`)_
- **10:10 AM** — Added sticky header (level/XP/date/time/theme toggle). _(Workers, `f69f370`)_
- **11:33 AM** — Journal system v1.1.0 shipped. _(Workers, `2c38b70`)_
- **12:15 PM** — Fixed light-mode contrast in Journal components. _(Workers, `0905b9a`)_
- **12:38 PM** — Restored dark defaults; `.light-mode` overrides. _(Workers, `3bf83e2`)_
- **1:21 PM** — Core theme colors & input contrast fixes. _(Workers, `29d75bc`)_
- **6:41 PM** — Major modular refactor (API + settings) and cleanup. _(Workers, `558a09a`)_
- **8:39 PM** — Upgraded to Next.js 16.0.7 / React 19.2.1. _(Workers, `b68b9c9`)_

### December 6 — OAuth migration and architecture hardening
- **8:30 AM** — Updated README/ROADMAP for v1.1.0. _(Workers, `20b3952`)_
- **8:42 AM** — Implemented Google OAuth (redirect flow). _(Workers, `6166cbd`)_
- **10:16 AM** — Fixed SQLite migration for OAuth columns. _(Workers, `b0011e3`)_
- **11:21 AM** — Switched OAuth to redirect flow; docs updated. _(Workers, `2974b3c`)_
- **11:57 AM** — Updated `next-env.d.ts` after build. _(Workers, `e2ea7c5`)_
- **12:07 PM** — Added deployment verification markers. _(Workers, `295223e`)_
- **12:55 PM** — Opened middleware for `/api/auth/google/start`. _(Workers, `4262657`)_
- **9:22 PM** — Upgraded Wrangler. _(Workers, `fe777a8`)_
- **10:11 PM** — Modularized API router with registry pattern. _(Workers, `5c6f360`)_
- **10:20 PM** — Removed PIN login; OAuth-only. _(Workers, `ba9fd6f`)_
- **11:01 PM** — Fixed OAuth redirect to browser. _(Workers, `1933ac6`)_
- **11:53 PM** — Set `auth_token` cookie for cross-site OAuth redirect. _(Workers, `da0a440`)_

### December 7 — OAuth finish, gamification persistence, site polish
- **12:14 AM** — URL token handoff for OAuth auth. _(Workers, `af8573f`)_
- **9:41 AM** — Updated docs for OAuth + refactors. _(Workers, `187a56e`)_
- **10:19 AM** — Server persistence for gamification XP. _(Workers, `92fdcb7`)_
- **10:25 AM** — Achievement unlock endpoint. _(Workers, `50784c1`)_
- **10:29 AM** — Persist achievement unlocks to server. _(Workers, `70dd5ee`)_
- **10:31 AM** — Added “Under Construction” page for main site. _(Root, `f263d0b`)_
- **10:33 AM** — Alternate achievement unlock route. _(Workers, `80e7e5e`)_
- **11:01 AM** — ClockWidget XP: +10 clock in, +20 clock out. _(Workers, `132c39d`)_
- **11:08 AM** — QuickNotes XP: +5 per note. _(Workers, `65a8917`)_
- **12:08 PM** — Completed multi-component gamification integration & docs cleanup. _(Workers, `bfd02af`)_
- **6:14 PM** — Ignored presentation screenshots. _(Root, `74efefe`)_
- **7:02 PM** — Glass texture overlay on artifact cards (50% opacity). _(Root, `57bda56`)_
- **7:32 PM** — Shattered glass overlay on Workers dashboard widgets (mix-blend-screen). _(Workers, `ac44768`)_

### December 8 — Code standards & documentation
- **Updated copilot-instructions.md**: Revised entire document to reflect current DigiArtifact architecture (removed all ChronicleOS references). _(Root, documentation)_
- **Added code standards**: Documented 500 LoC maximum file size limit with refactoring requirements and splitting strategies. _(Root, documentation)_
- **Time not logged** — Fixed gamification XP persistence with D1-compatible UPSERT and default Level 1 fallback for new users. _(Workers, pending)_

---

*Last Updated: December 8, 2025*

