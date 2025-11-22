'use client'

import Link from 'next/link'
import { Eye, Mic, Gamepad2 } from 'lucide-react'

const paths = [
  {
    title: 'For the Eyes',
    description: 'Art • Coloring Books • Visual Novels',
    href: '/gallery',
    icon: Eye,
    gradient: 'from-relic-gold/20 to-baked-clay/20',
  },
  {
    title: 'For the Ears',
    description: 'Music • Voice-overs • Sound FX',
    href: '/studio',
    icon: Mic,
    gradient: 'from-hologram-cyan/20 to-rarity-sapphire/20',
  },
  {
    title: 'For the Experience',
    description: 'Interactive • Visual Stories • Games',
    href: '/terminal',
    icon: Gamepad2,
    gradient: 'from-rarity-emerald/20 to-rarity-ruby/20',
  },
]

export default function ChooseYourPath() {
  return (
    <section id="choose-path" className="py-20 px-6 bg-obsidian relative">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-overlay opacity-10" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-heading text-center mb-4 text-sand">
          Choose Your Path
        </h2>
        <p className="text-center text-text-slate font-mono text-sm mb-12 terminal-text">
          &gt;&gt; SELECT ARTIFACT TYPE TO BEGIN EXPLORATION
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {paths.map((path) => {
            const Icon = path.icon
            return (
              <Link
                key={path.href}
                href={path.href}
                className="group relative aspect-[3/4] rounded-lg overflow-hidden excavation-border bg-slate hover:scale-105 transition-all duration-300"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${path.gradient}`} />
                
                {/* Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent p-6 flex flex-col justify-end">
                  <Icon className="w-12 h-12 text-relic-gold mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-heading text-3xl text-sand mb-2">
                    {path.title}
                  </h3>
                  <p className="text-text-slate font-mono text-sm mb-4">
                    {path.description}
                  </p>
                  <div className="font-mono text-hologram-cyan group-hover:translate-x-2 transition-transform text-glow-cyan">
                    &gt;&gt; Enter {path.title.split(' ')[2] || 'Wing'} →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
