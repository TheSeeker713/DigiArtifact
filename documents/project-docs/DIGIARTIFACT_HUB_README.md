# DigiArtifact Hub

The Digital Curiosity Shop - A post-purchase hub and gallery for digital products.

## Theme
"Ancient Wisdom Meets Future Technology" - High-tech archaeological site aesthetic with museum archive UI.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Backend**: Supabase (Auth + Database)
- **Auth**: Magic Link (Passwordless)
- **Hosting**: Cloudflare Pages
- **Storage**: Cloudflare R2

## Project Structure
```
app/
├── layout.tsx           # Global layout with AudioProvider
├── page.tsx             # Homepage (The Hub)
├── gallery/             # Visual Art Wing
├── studio/              # Audio Wing
├── terminal/            # Interactive Wing
└── vault/               # Download Area (Protected)

components/
├── ArtifactCard.tsx     # Universal product card
├── NavigationDeck.tsx   # Sidebar/mobile navigation
├── GlobalAudioPlayer.tsx # Persistent audio player
└── ...

contexts/
└── AudioContext.tsx     # Global audio state management

data/
└── artifacts.ts         # Product catalog
```

## Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup
```powershell
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Deployment to Cloudflare Pages
```powershell
# Build for Cloudflare
npm run pages:build

# Deploy
npm run deploy
```

## Design System

### Colors
- **Backgrounds**: Obsidian (#0a0a0a), Slate (#1e1e24), Dark Sand (#2a2419)
- **Text**: Sand (#e3d5ca), Text Slate (#94a3b8), Ink (#0b1320)
- **Accents**: Relic Gold (#cca43b), Hologram Cyan (#00f0ff), Baked Clay (#9f5f3f)

### Typography
- **Headings**: Cinzel (serif) - Stone-carved aesthetic
- **Body**: Merriweather (serif) - Readable long-form
- **Terminal**: Space Mono (monospace) - Data log feel

### UI Patterns
- **Buttons**: Rune commands with glow effects
- **Borders**: Excavation grid lines with corner markers
- **Cards**: Artifact cards with hover animations

## Features
- 🎨 Three product wings (Gallery, Studio, Terminal)
- 🎵 Persistent audio player across page navigation
- 🔒 Secure vault system for post-purchase downloads
- 🌓 Responsive design (mobile-first)
- ♿ Accessibility-first components
- 🚀 Static export for Cloudflare Pages

## License
© 2025 DigiArtifact LLC. All rights reserved.
