# DigiArtifact Roadmap

> Last Updated: December 6, 2025

## Vision

DigiArtifact is a digital asset marketplace and creative studio, blending archaeological mystique with modern technology to deliver premium digital products and tools.

---

## ✅ Recently Completed

### Google OAuth Migration (December 6, 2025) ✅
- [x] **Authentication Overhaul** - Replaced PIN-based login with Google OAuth
  - Removed PIN storage and verification from database
  - Implemented Google Sign-In with redirect flow (no popups)
  - Created OAuth endpoints: `/api/auth/google/start`, `/callback`, `/verify`
  - Added `google_id` and `google_picture` columns to users table
  - Custom-styled Google Sign-In button
  - Works in all browsers including embedded/Simple Browser

---

## 2025 - Foundation Year ✅

### Q4 2025 (Current)

- [x] **Main Website** - digiartifact.com landing page
- [x] **Secret Vault** - Digital asset storefront (secretvault.digiartifact.com)
  - Product pages for coloring books, music packs, game assets
  - Gumroad integration for sales
  - Mailchimp email capture
- [x] **Workers Portal v1** - Internal time tracking system (workers.digiartifact.com)
  - Clock in/out with break tracking
  - Project management
  - Admin dashboard for team oversight
  - Cloudflare Workers + D1 backend
  - ✅ Timezone support with 12 IANA options
  - ✅ 12/24 hour time format toggle
  - ✅ Smart Suggestions system (pseudo-AI with 150+ suggestions)
  - ✅ Notes & Reports tools
- [x] **Spooky But Cute Pets Expansion** - Waitlist landing page
- [x] **Links Page** - Social bio link hub

---

## Workers Portal Feature Roadmap

### 🔴 Immediate Development - ✅ ALL COMPLETED (December 4, 2025)

- [x] **Time Entry Enhancements** ✅ SHIPPED
  - Mood tracking with 5-level emoji scale
  - Energy level tracking with visual battery indicator
  - Tags for categorization (#deepwork, #meeting, #admin, #creative, #learning, #collab)
  - Inline session notes while working
  - Enhanced clock-out modal with full session summary

- [x] **Schedule System** ✅ SHIPPED
  - Weekly calendar view (Monday start)
  - Week navigation (prev/next/today)
  - Shift display with status colors (draft/published/acknowledged)
  - Shift detail modal with acknowledge feature
  - Payroll estimate modal with:
    - Configurable hourly rate
    - Regular vs overtime breakdown (40h threshold)
    - 1.5x overtime calculation
  - Week summary stats

- [x] **Dashboard Widgets Expansion** ✅ SHIPPED
  - Focus Timer (Pomodoro-style, 15/25/45/60 min presets)
  - Today's Agenda (auto-populates from entries + custom tasks)
  - Quick Notes widget (pin, delete, relative timestamps)
  - Streak Counter (week grid, milestone progress, motivational messages)
  - Visual progress rings and animations

- [x] **Gamification System** ✅ SHIPPED
  - 10-level progression: Apprentice → Mythic
  - XP rewards for all activities
  - 17 achievements across 4 categories
  - Weekly challenges with auto-refresh
  - XP notification toasts
  - Achievement gallery with category filtering

- [x] **Body Doubling Timer** ✅ SHIPPED
  - Virtual "work with me" sessions
  - 5 session presets (15-90 minutes)
  - Simulated virtual partners (2-5 random)
  - Visual countdown with progress ring
  - Session history tracking
  - Browser notifications

### 🟠 High Priority (Q1 2026) - ✅ ALL COMPLETED (December 5, 2025)

- [x] **Mobile PWA Improvements** ✅ SHIPPED
  - Add to Home Screen prompt with animated banner
  - Offline clock-in/out with service worker sync queue
  - Push notifications for breaks/reminders (NotificationSettings component)
  - Swipe gestures for common actions (useSwipe hook, MobileQuickActions)
  - PWAContext for install prompt and offline detection

- [x] **Smart Analytics Dashboard** ✅ SHIPPED
  - Best productivity hours identification (morning/afternoon/evening)
  - Weekly/monthly trend charts with bar visualization
  - Project time breakdown with percentage bars
  - Insights panel with personalized recommendations
  - Compare periods (this week vs last week, month vs month)

- [x] **Goals & Targets** ✅ SHIPPED
  - Weekly hour goals (per project and total)
  - Daily, Weekly, Monthly goal types
  - Visual progress bars with percentage
  - Over/under target indicators
  - Goal streaks with gamification integration
  - Goal creation modal with custom targets

### 🟡 Medium Priority (Q2 2026)

- [ ] **Templates System**
  - Save common notes as templates
  - Quick-fill report structures
  - Reusable shift schedules
  - Project setup templates
  - Import/export templates

- [ ] **Transition Alerts**
  - 10-min warning before shift ends
  - "Start wrapping up" prompts
  - Visual countdown overlay
  - Customizable buffer times
  - Audio/visual notification options

- [ ] **Hyperfocus Protection**
  - Detect long sessions (4+ hours no break)
  - Gentle but persistent break reminders
  - Optional screen lock after X hours
  - Encouraging messaging
  - Customizable thresholds

- [ ] **Decision Fatigue Reduction**
  - Default project based on day/time
  - "Continue where you left off" quick action
  - Simplified view modes
  - Preset work blocks (2h, 4h, 8h)
  - Smart defaults based on history

- [ ] **Focus Mode**
  - Distraction-free timer view
  - Hide all non-essential UI
  - Ambient sounds (rain, coffee shop, lo-fi)
  - "Do Not Disturb" status
  - Fullscreen option

### 🟢 Lower Priority (Q3 2026)

- [ ] **Daily Standup Generator** (Settings: OFF by default)
  - Auto-generate from yesterday's entries
  - "Yesterday / Today / Blockers" format
  - Copy to clipboard
  - Send to Discord/Slack webhook
  - Customizable templates

- [ ] **Export Options**
  - CSV export for spreadsheets
  - PDF reports with charts and visuals
  - HTML reports (styled, printable)
  - JSON backup of all data
  - ZIP download of all exports
  - Scheduled automatic exports

- [ ] **Invoicing Integration**
  - Generate invoices from time entries
  - Hourly rate calculations per project
  - Client-ready PDF export
  - Track paid/unpaid status
  - Tax calculations (optional)
  - Invoice templates

---

## 2026 - Growth & Expansion

### Q1-Q2 2026

- [ ] **Product Catalog Expansion**
  - 5+ new digital asset packs
  - Expand into categories (UI kits, templates, sound effects)
- [ ] **Secret Vault Enhancements**
  - Product filtering and search
  - User accounts and purchase history
  - Wishlist functionality
- [ ] **Mobile Optimization**
  - Mobile-first redesign for Secret Vault

### Q3-Q4 2026

- [ ] **Analytics Dashboard** (Secret Vault)
  - Sales tracking and reporting
  - Traffic and conversion metrics
- [ ] **Subscription/Membership Model**
  - Monthly access to asset library
  - Exclusive member-only products
  - Early access to new releases
- [ ] **Community Features**
  - User reviews and ratings
  - Customer showcase gallery
  - Discord community integration

---

## 2027 - Scale & Intelligence

### Q1-Q2 2027

- [ ] **Localization**
  - Multi-language support
  - Regional pricing
- [ ] **White-label Solutions** - Offer platform to other creators
- [ ] **API Marketplace** - Let developers integrate DigiArtifact assets

### Q3-Q4 2027

- [ ] **🤖 AI Integration - "The Vault Keeper"**
  - AI-powered concierge for Secret Vault
  - Product recommendations based on user needs
  - Natural language search ("I need spooky music for a game")
  - Powered by on-demand serverless GPU (Modal/similar)
  - Auto-shutdown when idle to minimize costs
- [ ] **AI-Assisted Product Creation**
  - AI-generated product descriptions
  - Automated social media content
  - Smart tagging and categorization

---

## 2028 & Beyond - Enterprise

- [ ] **Creator Tools** - Enable other artists to sell through the platform
- [ ] **Enterprise Licensing** - B2B asset licensing for studios
- [ ] **Advanced AI Features**
  - Personalized storefront per user
  - Predictive inventory (what to create next)
  - Automated customer support chatbot
  - Voice search and accessibility features

---

## 💭 Potential Future Features

*Features under consideration - not yet scheduled*

- [ ] Voice Input for notes (Web Speech API)
- [ ] Google Calendar sync
- [ ] Notion export integration
- [ ] Discord webhook notifications
- [ ] Toggl/Clockify data import
- [ ] Sensory controls (reduce motion, high contrast themes)
- [ ] Custom accent color picker
- [ ] Font size adjustment
- [ ] Keyboard shortcuts customization
- [ ] Multi-user collaboration features
- [ ] Client portal (share reports with clients)
- [ ] Time rounding options (nearest 15 min, etc.)
- [ ] Billable vs non-billable time tracking
- [ ] Project budgets and burn rate
- [ ] Affiliate Program for Secret Vault
- [ ] Mobile app (native iOS/Android)

---

## 2027 - Intelligence & Automation

### Q1 2027

- [ ] **🤖 AI Integration - "The Vault Keeper"**
  - AI-powered concierge for Secret Vault
  - Product recommendations based on user needs
  - Natural language search ("I need spooky music for a game")
  - Powered by on-demand serverless GPU (Modal/similar)
  - Auto-shutdown when idle to minimize costs

### Q2 2027

- [ ] **AI-Assisted Product Creation**
  - AI-generated product descriptions
  - Automated social media content
  - Smart tagging and categorization

### Q3-Q4 2027

- [ ] **Advanced AI Features**
  - Personalized storefront per user
  - Predictive inventory (what to create next)
  - Automated customer support chatbot
  - Voice search and accessibility features

---

## 2028 & Beyond - Scale

- [ ] **White-label Solutions** - Offer platform to other creators
- [ ] **API Marketplace** - Let developers integrate DigiArtifact assets
- [ ] **Creator Tools** - Enable other artists to sell through the platform
- [ ] **Enterprise Licensing** - B2B asset licensing for studios

---

## Technical Debt & Maintenance

Ongoing priorities:

- [ ] Performance optimization
- [ ] Security audits
- [ ] Dependency updates
- [ ] Database backups and redundancy
- [ ] Documentation improvements
- [ ] Unit and E2E testing
- [ ] Accessibility audits (WCAG compliance)

---

## Notes

### AI Implementation Strategy (2027)

The AI integration is planned for 2027 to allow:
1. **Cost reduction** - Serverless GPU pricing will likely decrease
2. **Model improvements** - Better small models (sub-4B parameters) with higher quality
3. **Infrastructure maturity** - More stable on-demand GPU providers
4. **User base growth** - More users to justify the investment

**Proposed Architecture:**
```
User → Cloudflare Worker → Modal.com (Serverless GPU)
                              ↓
                         Phi-3 / Llama 4 Mini / Future Model
                              ↓
                         Auto-shutdown after idle
```

**Budget Estimate:** $30-50/month for light-moderate usage with auto-scaling.

### Workers Portal Priority Legend
- 🔴 **Immediate** - This sprint, highest priority
- 🟠 **High** - Next quarter, essential features
- 🟡 **Medium** - Following quarter, important but not urgent
- 🟢 **Lower** - Nice to have, schedule as capacity allows
- 💭 **Potential** - Under consideration, not yet committed

---

## Contributing

This roadmap is maintained by DigiArtifact and J.W.

For suggestions or feature requests, contact: support@digiartifact.com

---

*"Unearthing digital treasures, one artifact at a time."*
