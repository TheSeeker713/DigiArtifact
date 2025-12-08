# DigiArtifact Codebase Guide

## Architecture Overview

This repository contains **three distinct web projects** representing DigiArtifact's digital ecosystem:

1. **Root Landing (`/index.html`)** - Standalone HTML site with embedded CSS/JS using Tailwind CDN
2. **DigiArtifact Hub (`/digiartifact-hub/`)** - Next.js + React + TypeScript application for artifact gallery and exploration
3. **Workers Portal (`/workers/`)** - Next.js + Cloudflare Workers backend for team time tracking and task management

All projects share the **archaeological/digital exploration theme** for consistent brand identity.

## Project Structure Patterns

### Root Project (Company Landing Site)
- **Single-file architecture**: All CSS embedded in `<style>` blocks within `index.html`
- **CDN dependencies**: Tailwind CSS, GSAP animations loaded via CDN
- **Custom color system**: CSS variables for primary colors
- **Archaeological theming**: Services called "expeditions", discovery-focused messaging

### DigiArtifact Hub (Next.js Application)
- **Framework**: Next.js 14.2+ with TypeScript
- **Component-based**: React functional components in `components/` directory
- **State management**: Context API for global state (AudioContext)
- **Custom Tailwind config**: Extended color palette with obsidian, gold, and emerald tones
- **Data structure**: Artifact metadata in `data/artifacts.ts`
- **Responsive design**: Mobile-first approach with Tailwind breakpoints
- **Asset handling**: Images and audio in `public/` subdirectories

### Workers Portal (Next.js + Cloudflare Workers)
- **Framework**: Next.js 16+ with TypeScript and Cloudflare Workers
- **Backend**: Wrangler CLI for API development and deployment
- **Database**: D1 SQLite database for persistent data storage
- **Components**: Specialized components for time tracking, analytics, and admin panels
- **Features**: User authentication, dashboard analytics, journal system, gamification

## Development Workflow

### DigiArtifact Hub
```bash
cd digiartifact-hub
npm install
npm run dev     # Development server (localhost:3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

### Workers Portal
```bash
cd workers
npm install
npm run dev        # Development server
npm run api:dev    # Local API development
npm run build      # Production build
npm run db:migrate # Run database migrations
```

### Key Configuration Files
- **`tailwind.config.ts`**: Custom color palette and theme definitions
- **`next.config.js`**: Next.js build configuration
- **`postcss.config.js`**: PostCSS/Tailwind processing
- **`tsconfig.json`**: TypeScript compiler options
- **`wrangler.toml`** (Workers only): Cloudflare Workers configuration

## Component Patterns

### React Component Structure
- **Functional components** with hooks (`useState`, `useEffect`)
- **Accessibility first**: Proper ARIA labels, semantic HTML, screen reader support
- **Animation integration**: Canvas-based particle effects in Hero component
- **Responsive design**: Mobile-first approach with `md:` breakpoint patterns

### Example Component Pattern:
```jsx
export default function ComponentName() {
  const [state, setState] = useState(false)
  
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Component content with consistent spacing */}
      </div>
    </section>
  )
}
```

## Styling Conventions

### Color Usage
- **Primary brand**: `text-gold`, `bg-obsidian`
- **Interactive states**: Hover effects with `hover:opacity-100`, `hover:scale-110`
- **Gradients**: Consistent use of `bg-gradient-to-br` for visual depth
- **Transparency**: Strategic use of `/20`, `/50` opacity variants

### Typography Hierarchy
- **Display headings**: `font-display text-4xl md:text-5xl font-bold`
- **Body text**: `text-slate-300 leading-relaxed`
- **Accent text**: `text-amber-400` or `text-teal-400` for highlights

## Build & Deployment

### Deployment Strategy
- **Root site**: Deploys directly from root `index.html` to GitHub Pages
- **DigiArtifact Hub**: Next.js build optimized for static hosting or Vercel deployment
- **Workers Portal**: Deployed via Wrangler to Cloudflare Workers and D1 database
- **CNAME files**: Each project includes CNAME for custom domain configuration

### Asset Management
- **Root project**: Images in `assets/images/` with CDN optimization
- **Next.js projects**: Static assets in `public/` directories, optimized by Next.js
- **Format support**: JPG, WebP, PNG with responsive image handling
- **Audio assets**: Music and sound effects stored in `assets/music/` and `assets/video/`

## Brand Identity Guidelines

### Messaging Tone
- **Archaeological metaphors**: "expeditions", "discoveries", "artifacts", "excavation"
- **Professional mystique**: Blend of ancient wisdom and modern technology
- **Service positioning**: Technical expertise framed as treasure hunting/exploration

### Visual Elements
- **Logo treatment**: Shield icon with gradient backgrounds
- **Color psychology**: Gold for premium/discovery, teal for technology/innovation
- **Animation style**: Subtle entrance animations, particle effects for premium feel

## Common Patterns to Follow

### When adding new components:
1. Use consistent `py-20 px-4 sm:px-6` section padding
2. Wrap content in `max-w-6xl mx-auto` containers
3. Include proper TypeScript-style prop validation
4. Add accessibility attributes for interactive elements
5. Follow mobile-first responsive design patterns

### When extending colors:
1. Add to `tailwind.config.js` extended colors object
2. Maintain contrast ratios for accessibility
3. Use consistent opacity variants (`/10`, `/20`, `/50`)
4. Test in both light and dark contexts

## File Size Guidelines

### Code Document Limits
- **Maximum file size**: Each document must be **500 lines of code or less**
- **Refactoring requirement**: If a file exceeds 500 LoC during development, break it down into multiple files without breaking the app
- **Splitting strategy**:
  - Extract related functionality into separate modules/files
  - Ensure imports are properly maintained across files
  - Maintain the same public API to avoid breaking existing imports
  - Test functionality after splitting to confirm app integrity
- **Common refactoring patterns**:
  - Extract utility functions into `utils/` subdirectories
  - Separate component logic from UI in React components
  - Split configuration files by concern (colors, typography, spacing)
  - Create separate files for constants and enums