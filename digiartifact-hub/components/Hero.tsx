'use client'

import { ChevronDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video background placeholder - will add actual video later */}
      <div className="absolute inset-0 bg-gradient-to-br from-obsidian via-slate to-dark-sand" />
      
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-grid-overlay opacity-20" />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian/80 via-obsidian/50 to-obsidian" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-6">
        <h1 className="font-heading text-6xl md:text-8xl font-bold text-relic-gold mb-4 text-glow-gold animate-fade-in">
          DIGIARTIFACT
        </h1>
        <p className="text-2xl md:text-3xl text-sand mb-6 animate-fade-in-delay-1">
          The intersection of Art, Audio, and Interactive, Immersive Experiences.
        </p>
        <p className="text-lg md:text-xl font-mono text-hologram-cyan mb-8 text-glow-cyan animate-fade-in-delay-2">
          &quot;Premium Digital Assets for Creators & Dreamers.&quot;
        </p>
        
        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
          <a
            href="#choose-path"
            className="btn-rune"
          >
            &gt;&gt; Explore the Archive
          </a>
          <a
            href="/vault"
            className="btn-hologram"
          >
            &gt;&gt; Access My Vault
          </a>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-relic-gold" />
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-fade-in-delay-1 {
          animation: fade-in 1s ease-out 0.3s both;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.6s both;
        }
        .animate-fade-in-delay-3 {
          animation: fade-in 1s ease-out 0.9s both;
        }
      `}</style>
    </section>
  )
}
