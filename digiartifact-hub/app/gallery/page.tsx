'use client'

import { useState } from 'react'
import { artifacts } from '@/data/artifacts'
import ArtifactCard from '@/components/ArtifactCard'
import { Eye, Filter } from 'lucide-react'

const visualCategories = [
  { id: 'all', label: 'All Artifacts' },
  { id: 'coloring-book', label: 'Coloring Books' },
  { id: 'digital-art', label: 'Digital Art' },
  { id: 'oil-painting', label: 'Oil Paintings' },
]

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState('all')

  const visualArtifacts = artifacts.filter(a => a.type === 'visual')
  const filteredArtifacts = activeFilter === 'all'
    ? visualArtifacts
    : visualArtifacts.filter(a => a.category === activeFilter)

  return (
    <main className="min-h-screen pt-20 md:pt-8 px-4 sm:px-6 pb-24 md:pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-gold">
            <Eye className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
              For the Eyes
            </h1>
            <Eye className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Visual artifacts unearthed from the creative depths. Coloring books, digital art, 
            and paintings ready to adorn your world.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-2 sm:gap-3 justify-center md:justify-start">
          <div className="flex items-center gap-2 text-gold w-full sm:w-auto justify-center sm:justify-start mb-2 sm:mb-0">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wide">Filter:</span>
          </div>
          {visualCategories.map(cat => (
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

        {/* Artifact Grid */}
        {filteredArtifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredArtifacts.map(artifact => (
              <ArtifactCard key={artifact.id} {...artifact} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg font-mono">
              No artifacts found in this category. Check back soon...
            </p>
          </div>
        )}

        {/* Coming Soon Section */}
        <div className="mt-16 text-center excavation-border p-8 bg-slate/20">
          <h2 className="font-display text-2xl text-gold mb-3">More Discoveries Ahead</h2>
          <p className="text-slate-300">
            New visual artifacts are excavated monthly. Subscribe to stay updated on fresh releases.
          </p>
        </div>
      </div>
    </main>
  )
}
