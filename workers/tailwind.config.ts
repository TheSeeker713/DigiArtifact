import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Cinzel', 'Trajan', 'serif'],
        mono: ['Space Mono', 'Courier New', 'monospace'],
        body: ['Merriweather', 'Georgia', 'serif'],
      },
      colors: {
        // Core backgrounds
        obsidian: '#0a0a0a',
        slate: '#1e1e24',
        'dark-sand': '#2a2419',
        
        // Text colors
        sand: '#e3d5ca',
        'text-slate': '#94a3b8',
        ink: '#0b1320',
        
        // Accent colors
        'relic-gold': '#cca43b',
        'hologram-cyan': '#00f0ff',
        'baked-clay': '#9f5f3f',
        
        // Status colors
        'status-active': '#22c55e',
        'status-break': '#f59e0b',
        'status-offline': '#ef4444',
        
        // Rarity tier system
        'rarity-gold': '#cba135',
        'rarity-silver': '#bfc7ca',
        'rarity-emerald': '#046c4e',
        'rarity-sapphire': '#0f5298',
        'rarity-ruby': '#9b111e',
      },
      backgroundImage: {
        'grid-overlay': 'linear-gradient(90deg, rgba(159,95,63,0.1) 1px, transparent 1px), linear-gradient(rgba(159,95,63,0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(204,164,59,0.6)',
        'cyan-glow': '0 0 15px rgba(0,240,255,0.6)',
        'green-glow': '0 0 15px rgba(34,197,94,0.6)',
        'amber-glow': '0 0 15px rgba(245,158,11,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(204,164,59,0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(204,164,59,0.8)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
