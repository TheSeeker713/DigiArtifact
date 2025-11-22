'use client'

import ArtifactCard from './ArtifactCard'
import { artifacts } from '@/data/artifacts'

export default function RecentExcavations() {
  // Get latest 6 artifacts
  const recentArtifacts = artifacts.slice(0, 6)
  
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-obsidian to-slate">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading mb-4 text-sand">
            Recent Excavations
          </h2>
          <p className="font-mono text-hologram-cyan terminal-text">
            &gt;&gt; LATEST ARTIFACTS DISCOVERED
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentArtifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} {...artifact} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a
            href="/gallery"
            className="btn-hologram inline-block"
          >
            &gt;&gt; View All Artifacts
          </a>
        </div>
      </div>
    </section>
  )
}
