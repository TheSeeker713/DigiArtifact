# DigiArtifact Project Structure

> Complete file structure of the DigiArtifact ecosystem
> Generated: December 5, 2025

---

## 📁 Root Directory Overview

```
DigiArtifact/
├── 📂 artifact/              # Individual artifact product pages
├── 📂 artifacts/             # Artifact thumbnails and assets
├── 📂 assets/                # Global assets (images, music, video)
├── 📂 digiartifact-hub/      # Main hub website (Next.js)
├── 📂 original-site-backup/  # Backup of original static site
├── 📂 secretvault/           # Members-only vault area
├── 📂 workers/               # Workers Portal app (Next.js)
├── 📂 _next/                 # Next.js static export cache
├── 📄 404.html               # Custom 404 page
├── 📄 CNAME                  # GitHub Pages domain config
├── 📄 DEVLOG.md              # Development log
├── 📄 gallery.html           # Gallery page
├── 📄 index.html             # Root landing page
├── 📄 README.md              # Project readme
├── 📄 ROADMAP.md             # Development roadmap
├── 📄 studio.html            # Studio page
├── 📄 terminal.html          # Terminal page
├── 📄 test1.html             # Test page
└── 📄 vault.html             # Vault landing page
```

---

## 📂 artifact/ - Product Pages

Individual HTML pages for each digital artifact product.

```
artifact/
├── 📄 ambient-fantasy-music-vol1.html
├── 📄 ambient-fantasy-music-vol1.txt
├── 📄 botanical-oil-paintings.html
├── 📄 botanical-oil-paintings.txt
├── 📄 dark-fantasy-coloring-book.html
├── 📄 dark-fantasy-coloring-book.txt
├── 📄 fantasy-sound-effects-pack.html
├── 📄 fantasy-sound-effects-pack.txt
├── 📄 mystic-manor-visual-novel.html
├── 📄 mystic-manor-visual-novel.txt
├── 📄 pixel-art-rpg-kit.html
└── 📄 pixel-art-rpg-kit.txt
```

---

## 📂 artifacts/ - Thumbnails

SVG thumbnail images for artifact products.

```
artifacts/
├── 📄 ambient-music-thumb.svg
├── 📄 botanical-thumb.svg
├── 📄 dark-fantasy-thumb.svg
├── 📄 fantasy-sfx-thumb.svg
├── 📄 mystic-manor-thumb.svg
└── 📄 pixel-rpg-thumb.svg
```

---

## 📂 assets/ - Global Assets

Shared media assets for the entire project.

```
assets/
├── 📂 images/                # Image assets
├── 📂 music/                 # Audio files
│   └── 📄 Driftwood Dreams.mp3
└── 📂 video/                 # Video backgrounds
    ├── 📄 background_loop.mp4
    ├── 📄 background_loop.webm
    ├── 📄 Driftwood Dreams.mp4
    └── 📄 Driftwood Dreams_final.mp4
```

---

## 📂 digiartifact-hub/ - Main Hub Website

Next.js application for the main DigiArtifact website.

```
digiartifact-hub/
├── 📂 app/                   # Next.js App Router
│   ├── 📂 artifact/          # Artifact detail pages
│   │   └── 📂 [slug]/        # Dynamic route
│   │       └── 📄 page.tsx
│   ├── 📂 gallery/           # Gallery route
│   │   └── 📄 page.tsx
│   ├── 📂 secretvault/       # Vault route
│   │   └── 📄 page.tsx
│   ├── 📂 studio/            # Studio route
│   │   └── 📄 page.tsx
│   ├── 📂 terminal/          # Terminal route
│   │   └── 📄 page.tsx
│   ├── 📂 vault/             # Vault route
│   │   └── 📄 page.tsx
│   ├── 📄 globals.css        # Global styles
│   ├── 📄 layout.tsx         # Root layout
│   └── 📄 page.tsx           # Home page
│
├── 📂 components/            # React components
│   ├── 📄 ArtifactCard.tsx   # Artifact display card
│   ├── 📄 AudioDemoButton.tsx
│   ├── 📄 ChooseYourPath.tsx
│   ├── 📄 Footer.tsx
│   ├── 📄 GlobalAudioPlayer.tsx
│   ├── 📄 Hero.tsx
│   ├── 📄 NavigationDeck.tsx
│   └── 📄 RecentExcavations.tsx
│
├── 📂 contexts/              # React contexts
│   └── 📄 AudioContext.tsx
│
├── 📂 data/                  # Data files
│   └── 📄 artifacts.ts       # Artifact definitions
│
├── 📂 public/                # Static assets
│   ├── 📂 artifacts/         # Artifact images
│   └── 📂 assets/
│       └── 📂 video/
│
├── 📄 .eslintrc.json
├── 📄 CNAME
├── 📄 IMPLEMENTATION_STATUS.md
├── 📄 next-env.d.ts
├── 📄 next.config.js
├── 📄 package.json
├── 📄 postcss.config.js
├── 📄 README.md
├── 📄 tailwind.config.ts
└── 📄 tsconfig.json
```

---

## 📂 secretvault/ - Members Area

Static HTML members-only section.

```
secretvault/
├── 📂 assets/
│   ├── 📂 clips/
│   │   ├── 📄 da_backgroundclip.mp4
│   │   └── 📄 da_backgroundclip.webm
│   └── 📂 images/
│
├── 📂 links/
│   └── 📄 index.html
│
├── 📂 spooky/
│   └── 📄 index.html
│
├── 📄 CNAME
├── 📄 index.html             # Main vault page
└── 📄 landingpage.html       # Landing page
```

---

## 📂 workers/ - Workers Portal Application

Full-featured Next.js productivity application.

```
workers/
├── 📂 api/                   # Cloudflare Workers API
│   ├── 📂 src/
│   │   └── 📄 index.ts       # API entry point (1376 lines)
│   ├── 📄 schema.sql         # Database schema
│   ├── 📄 schema-v2.sql      # Schema version 2
│   ├── 📄 schema-v3-blocks.sql
│   ├── 📄 tsconfig.json
│   └── 📄 wrangler.toml      # Cloudflare config
│
├── 📂 app/                   # Next.js App Router
│   ├── 📂 dashboard/         # Main dashboard
│   │   ├── 📂 admin/
│   │   │   ├── 📂 entries/
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📂 users/
│   │   │       └── 📄 page.tsx
│   │   ├── 📂 analytics/
│   │   │   └── 📄 page.tsx   # Analytics (733 lines)
│   │   ├── 📂 blocks/
│   │   │   └── 📄 page.tsx   # Block schedule (345 lines)
│   │   ├── 📂 goals/
│   │   │   └── 📄 page.tsx   # Goal tracking (635 lines)
│   │   ├── 📂 history/
│   │   │   └── 📄 page.tsx
│   │   ├── 📂 journal/
│   │   │   └── 📄 page.tsx   # Journal (200 lines)
│   │   ├── 📂 projects/
│   │   │   └── 📄 page.tsx   # Projects (369 lines)
│   │   ├── 📂 reports/
│   │   │   └── 📄 page.tsx   # Reports (368 lines)
│   │   ├── 📂 schedule/
│   │   │   └── 📄 page.tsx
│   │   ├── 📂 settings/
│   │   │   └── 📄 page.tsx   # Settings (1028 lines)
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx       # Dashboard home
│   ├── 📄 globals.css
│   ├── 📄 layout.tsx
│   └── 📄 page.tsx           # Login page
│
├── 📂 assets/                # Screenshots and media
│   ├── 📂 presentation/
│   └── 📄 Screenshot 2025-12-05 *.png (9 files)
│
├── 📂 components/            # React components (28 files)
│   ├── 📄 AdminDataManagement.tsx
│   ├── 📄 AdminUserManagement.tsx
│   ├── 📄 BlockTimeline.tsx
│   ├── 📄 BodyDoublingTimer.tsx
│   ├── 📄 ClockWidget.tsx
│   ├── 📄 DebugPanel.tsx
│   ├── 📄 FocusTimer.tsx
│   ├── 📄 GamificationWidget.tsx
│   ├── 📄 InstallPrompt.tsx
│   ├── 📄 JournalEditor.tsx
│   ├── 📄 JournalLibrary.tsx
│   ├── 📄 MobileNav.tsx
│   ├── 📄 MobileQuickActions.tsx
│   ├── 📄 MorningCheckIn.tsx
│   ├── 📄 NotesTool.tsx
│   ├── 📄 NotificationSettings.tsx
│   ├── 📄 QuickNotesWidget.tsx
│   ├── 📄 QuickStats.tsx
│   ├── 📄 RecentEntries.tsx
│   ├── 📄 ReportsTool.tsx
│   ├── 📄 ScheduleEditor.tsx
│   ├── 📄 Sidebar.tsx
│   ├── 📄 SmartSuggestionBubble.tsx
│   ├── 📄 StickyHeader.tsx
│   ├── 📄 StreakCounter.tsx
│   ├── 📄 TodaysAgenda.tsx
│   ├── 📄 WalkthroughTutorial.tsx
│   └── 📄 WeeklyChart.tsx
│
├── 📂 contexts/              # React contexts (7 files)
│   ├── 📄 AuthContext.tsx
│   ├── 📄 DebugContext.tsx
│   ├── 📄 GamificationContext.tsx
│   ├── 📄 JournalContext.tsx
│   ├── 📄 PWAContext.tsx
│   ├── 📄 SettingsContext.tsx
│   └── 📄 TutorialContext.tsx
│
├── 📂 data/
│   └── 📄 smart-suggestions.json
│
├── 📂 documents/             # Generated documentation
│   ├── 📂 content/           # Content text files (12 files)
│   │   ├── 📄 01-overview.txt
│   │   ├── 📄 02-dashboard.txt
│   │   ├── 📄 03-time-tracking.txt
│   │   ├── 📄 04-block-schedule.txt
│   │   ├── 📄 05-journal.txt
│   │   ├── 📄 06-analytics.txt
│   │   ├── 📄 07-goals.txt
│   │   ├── 📄 08-projects.txt
│   │   ├── 📄 09-settings.txt
│   │   ├── 📄 10-gamification.txt
│   │   ├── 📄 11-reports.txt
│   │   └── 📄 12-technical.txt
│   ├── 📄 DigiArtifact_Workers_Portal_Presentation.pdf
│   └── 📄 PROJECT_STRUCTURE.md  # This file
│
├── 📂 hooks/                 # Custom React hooks
│   ├── 📄 useDynamicSchedule.ts
│   ├── 📄 useSmartSuggestions.ts
│   └── 📄 useSwipe.ts
│
├── 📂 public/                # PWA assets
│   ├── 📄 CNAME
│   ├── 📄 manifest.json
│   ├── 📄 offline.html
│   └── 📄 sw.js              # Service worker
│
├── 📂 scripts/               # Build scripts
│   └── 📄 generate-presentation.js
│
├── 📂 utils/                 # Utility functions
│   └── 📄 pdfExport.ts
│
├── 📄 CNAME
├── 📄 index.html
├── 📄 next-env.d.ts
├── 📄 next.config.js
├── 📄 package.json
├── 📄 postcss.config.js
├── 📄 README.md
├── 📄 tailwind.config.ts
└── 📄 tsconfig.json
```

---

## 📂 original-site-backup/

Backup of the original static website.

```
original-site-backup/
├── 📂 assets/
│   └── 📂 images/
│       ├── 📄 digiartifact1.png
│       ├── 📄 digiartifact_logo_small.jpg
│       └── 📄 digiartifact_logo_small.webp
└── 📄 index.html
```

---

## 🔧 Technology Stack Summary

| Project | Framework | Language | Styling |
|---------|-----------|----------|---------|
| **digiartifact-hub** | Next.js 14 | TypeScript | Tailwind CSS |
| **workers** | Next.js 14 | TypeScript | Tailwind CSS |
| **workers/api** | Cloudflare Workers | TypeScript | - |
| **secretvault** | Static HTML | HTML/JS | Tailwind CDN |
| **Root pages** | Static HTML | HTML/JS | Tailwind CDN |

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Total Projects** | 4 (hub, workers, secretvault, root) |
| **React Components** | 36 (hub: 8, workers: 28) |
| **React Contexts** | 8 (hub: 1, workers: 7) |
| **API Endpoints** | ~25+ (in workers/api) |
| **Dashboard Pages** | 10 |
| **Custom Hooks** | 3 |
| **Documentation Files** | 12 content files + PDF |

---

## 🌐 Deployment URLs

| Project | URL |
|---------|-----|
| **Main Site** | https://digiartifact.com |
| **Workers Portal** | https://workers.digiartifact.com |
| **Secret Vault** | https://secretvault.digiartifact.com |

---

## 📝 Key Configuration Files

### Package Management
- `package.json` - Node.js dependencies
- `package-lock.json` - Locked dependency versions

### TypeScript
- `tsconfig.json` - TypeScript configuration
- `next-env.d.ts` - Next.js type definitions

### Styling
- `tailwind.config.ts` - Tailwind CSS customization
- `postcss.config.js` - PostCSS configuration
- `globals.css` - Global CSS styles

### Deployment
- `CNAME` - Custom domain for GitHub Pages
- `wrangler.toml` - Cloudflare Workers config
- `next.config.js` - Next.js build configuration

---

*Document generated by DigiArtifact development tools*
