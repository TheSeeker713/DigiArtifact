# DigiArtifact Codebase Guide

## Architecture Overview

This repository contains **two distinct web projects** representing DigiArtifact's company presence:

1. **Root Landing (`/index.html`)** - Standalone HTML site with embedded CSS/JS using Tailwind CDN
2. **ChronicleOS Scaffold (`/chronicleos/`)** - Vite + React + Tailwind development environment

Both projects share the **archaeological/digital exploration theme** but use different tech stacks.

## Project Structure Patterns

### Root Project (Company Site)
- **Single-file architecture**: All CSS embedded in `<style>` blocks within `index.html`
- **CDN dependencies**: Tailwind CSS, GSAP animations loaded via CDN
- **Custom color system**: `--bg-primary`, `--accent-gold`, `--accent-teal` CSS variables
- **Archaeological theming**: Services called "expeditions", process steps as "archaeological method"

### ChronicleOS Scaffold (React App)
- **Component-based**: All UI components in `src/components/` following pattern `ComponentName.jsx`
- **Custom Tailwind config**: Extended colors (`parchment`, `obsidian`, `gold`, `emerald`, `sapphire`, `ruby`)
- **Typography**: Uses `font-display` (Cinzel) for headings, `font-serif` (Merriweather) for body
- **Error boundaries**: App component includes try-catch with fallback UI

## Development Workflow

### ChronicleOS Development
```bash
cd chronicleos
npm install
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

### Key Configuration Files
- **`tailwind.config.js`**: Custom color palette and font definitions
- **`vite.config.js`**: Custom build plugin copies `CNAME` for GitHub Pages deployment
- **`postcss.config.cjs`**: Tailwind CSS processing

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

### GitHub Pages Configuration
- **Root site**: Deploys directly from root `index.html`
- **ChronicleOS**: Vite build outputs to `dist/` with CNAME file auto-copy
- **Base URL**: Configured for absolute paths (`base: '/'`)

### Asset Management
- **Images**: Stored in `assets/images/` with both `.jpg` and `.webp` variants
- **Optimization**: Vite automatically handles asset hashing in production

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