'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Palette, Music, Terminal, Lock, Search, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'The Hub' },
  { href: '/gallery', icon: Palette, label: 'The Gallery' },
  { href: '/studio', icon: Music, label: 'The Studio' },
  { href: '/terminal', icon: Terminal, label: 'The Terminal' },
  { href: '/vault', icon: Lock, label: 'Vault Access', highlight: true },
]

export default function NavigationDeck() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Hide navigation completely on home page
  if (pathname === '/') {
    return null
  }
  
  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-obsidian/95 backdrop-blur-md border-b-2 border-baked-clay flex items-center justify-between px-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-relic-gold flex items-center justify-center">
            <span className="font-heading text-obsidian font-bold">D</span>
          </div>
          <span className="font-heading text-lg text-relic-gold">DIGIARTIFACT</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-slate/20 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-obsidian/98 z-40 flex items-center justify-center pt-16">
          <nav className="space-y-4 text-center">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-8 py-4 rounded-lg font-mono transition-all ${
                    item.highlight
                      ? 'bg-relic-gold text-obsidian hover:shadow-gold-glow'
                      : 'text-sand hover:bg-slate/20'
                  }`}
                >
                  <Icon className="w-6 h-6 inline-block mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-obsidian/95 backdrop-blur-md border-r-2 border-baked-clay p-6 z-40">
        {/* Logo */}
        <Link href="/" className="block mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-relic-gold to-baked-clay flex items-center justify-center">
              <span className="font-heading text-obsidian font-bold text-xl">D</span>
            </div>
            <h1 className="font-heading text-2xl text-relic-gold">DIGIARTIFACT</h1>
          </div>
          <p className="font-mono text-xs text-text-slate ml-13">Archive Terminal v2.1</p>
        </Link>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm transition-all ${
                  item.highlight
                    ? 'bg-relic-gold text-obsidian hover:shadow-gold-glow'
                    : 'text-sand hover:bg-slate/20 hover:translate-x-1'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        {/* Bottom Actions */}
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate/20 hover:bg-slate/30 transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
            <span className="font-mono text-sm text-text-slate">Search (⌘K)</span>
          </button>
          
          <div className="text-center">
            <p className="font-mono text-xs text-text-slate/60">
              Ancient Wisdom<br/>Meets Future Tech
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
