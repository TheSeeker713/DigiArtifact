'use client'

import { useState } from 'react'
import { artifacts } from '@/data/artifacts'
import ArtifactCard from '@/components/ArtifactCard'
import { Mic, Music, Waves, Filter } from 'lucide-react'

const audioCategories = [
  { id: 'all', label: 'All Tracks' },
  { id: 'music-album', label: 'Music Albums' },
  { id: 'sfx-pack', label: 'Sound Effects' },
  { id: 'ambient', label: 'Ambient' },
]

export default function StudioPage() {
  const [activeFilter, setActiveFilter] = useState('all')

  const audioArtifacts = artifacts.filter(a => a.type === 'audio')
  const filteredArtifacts = activeFilter === 'all'
    ? audioArtifacts
    : audioArtifacts.filter(a => 
        a.category === activeFilter || a.tags.includes(activeFilter)
      )

  return (
    <main className="min-h-screen pt-20 md:pt-8 px-4 sm:px-6 pb-24 md:pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-hologram-cyan">
            <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
              For the Ears
            </h1>
            <Waves className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Sonic treasures from the sound archives. Music, ambient soundscapes, 
            and effects ready to elevate your projects.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-2 sm:gap-3 justify-center md:justify-start">
          <div className="flex items-center gap-2 text-hologram-cyan w-full sm:w-auto justify-center sm:justify-start mb-2 sm:mb-0">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wide">Filter:</span>
          </div>
          {audioCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-mono text-xs sm:text-sm transition-all min-h-[44px] active:scale-95 ${
                activeFilter === cat.id
                  ? 'bg-hologram-cyan text-obsidian'
                  : 'bg-slate/50 text-sand hover:bg-slate hover:text-hologram-cyan active:bg-slate'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Audio Grid */}
        {filteredArtifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredArtifacts.map(artifact => (
              <ArtifactCard key={artifact.id} {...artifact} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg font-mono">
              No audio artifacts found. More coming soon...
            </p>
          </div>
        )}

        {/* Licensing Info */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="excavation-border p-6 bg-slate/20">
            <Music className="w-8 h-8 text-gold mb-3" />
            <h3 className="font-display text-xl text-gold mb-2">Personal Use</h3>
            <p className="text-slate-300 text-sm">
              Use in personal projects, YouTube videos, and non-commercial work with attribution.
            </p>
          </div>
          <div className="excavation-border p-6 bg-slate/20">
            <Waves className="w-8 h-8 text-hologram-cyan mb-3" />
            <h3 className="font-display text-xl text-hologram-cyan mb-2">Commercial License</h3>
            <p className="text-slate-300 text-sm">
              Full commercial rights included. Use in games, films, podcasts, and client work.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
