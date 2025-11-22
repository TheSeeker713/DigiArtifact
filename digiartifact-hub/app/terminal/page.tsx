'use client'

import { useState } from 'react'
import { artifacts } from '@/data/artifacts'
import ArtifactCard from '@/components/ArtifactCard'
import { Gamepad2, Terminal as TerminalIcon, Filter, Cpu } from 'lucide-react'

const interactiveCategories = [
  { id: 'all', label: 'All Experiences' },
  { id: 'visual-novel', label: 'Visual Novels' },
  { id: 'game-assets', label: 'Game Assets' },
  { id: 'interactive', label: 'Interactive' },
]

export default function TerminalPage() {
  const [activeFilter, setActiveFilter] = useState('all')

  const interactiveArtifacts = artifacts.filter(a => a.type === 'interactive')
  const filteredArtifacts = activeFilter === 'all'
    ? interactiveArtifacts
    : interactiveArtifacts.filter(a => 
        a.category === activeFilter || a.tags.includes(activeFilter)
      )

  return (
    <main className="min-h-screen pt-20 md:pt-8 px-4 sm:px-6 pb-24 md:pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Terminal-Style Header */}
        <div className="mb-8 sm:mb-12">
          <div className="excavation-border bg-slate/30 p-4 sm:p-6 md:p-8 font-mono">
            <div className="flex items-center gap-2 text-hologram-cyan mb-3 sm:mb-4">
              <TerminalIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm">&gt;&gt; SYSTEM INITIALIZED</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gold">
                For the Experience
              </h1>
            </div>
            
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">
              <span className="text-hologram-cyan">&gt;</span> Interactive artifacts and game resources. 
              Visual novels, asset packs, and playable experiences await initialization.
            </p>
            
            <div className="mt-3 sm:mt-4 text-xs text-slate-500">
              <span className="text-hologram-cyan">[INFO]</span> {filteredArtifacts.length} artifact(s) loaded
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-2 sm:gap-3 justify-center md:justify-start">
          <div className="flex items-center gap-2 text-gold w-full sm:w-auto justify-center sm:justify-start mb-2 sm:mb-0">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wide">Filter:</span>
          </div>
          {interactiveCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-mono text-xs sm:text-sm transition-all min-h-[44px] active:scale-95 ${
                activeFilter === cat.id
                  ? 'bg-gold text-obsidian'
                  : 'bg-slate/50 text-sand hover:bg-slate hover:text-gold active:bg-slate'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Interactive Grid */}
        {filteredArtifacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredArtifacts.map(artifact => (
              <ArtifactCard key={artifact.id} {...artifact} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 excavation-border bg-slate/20">
            <TerminalIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-mono">
              <span className="text-hologram-cyan">[ERROR]</span> No artifacts match filter criteria
            </p>
            <p className="text-slate-500 text-sm mt-2">Try selecting a different category</p>
          </div>
        )}

        {/* Asset Info Panels */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="excavation-border p-6 bg-slate/20">
            <Gamepad2 className="w-8 h-8 text-gold mb-3" />
            <h3 className="font-display text-lg text-gold mb-2">Game Assets</h3>
            <p className="text-slate-300 text-sm">
              Complete asset packs for Unity, Godot, Unreal, and more. Ready to integrate.
            </p>
          </div>
          <div className="excavation-border p-6 bg-slate/20">
            <TerminalIcon className="w-8 h-8 text-hologram-cyan mb-3" />
            <h3 className="font-display text-lg text-hologram-cyan mb-2">Playable Demos</h3>
            <p className="text-slate-300 text-sm">
              Try before you buy. Most interactive artifacts include browser demos.
            </p>
          </div>
          <div className="excavation-border p-6 bg-slate/20">
            <Cpu className="w-8 h-8 text-baked-clay mb-3" />
            <h3 className="font-display text-lg text-baked-clay mb-2">Documentation</h3>
            <p className="text-slate-300 text-sm">
              Every pack includes setup guides, usage examples, and technical specs.
            </p>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="mt-12 excavation-border bg-slate/30 p-6 font-mono text-sm">
          <div className="text-hologram-cyan mb-2">
            <span>&gt;&gt;</span> SYSTEM MESSAGE
          </div>
          <p className="text-slate-300">
            New interactive experiences are compiled regularly. Subscribe to notifications 
            for release alerts and exclusive beta access.
          </p>
        </div>
      </div>
    </main>
  )
}
