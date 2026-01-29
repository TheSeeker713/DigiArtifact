'use client'

import React, { useState } from 'react'
import Reliquary from '@/components/Reliquary'

export default function HomePage() {
  const [hasEntered, setHasEntered] = useState(false)

  if (!hasEntered) {
    return (
      <main className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden relative">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80" />
        
        {/* Splash Screen Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-4">
          {/* Portal-like central element */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-amber-900 via-slate-900 to-emerald-900 shadow-2xl flex items-center justify-center border-2 border-amber-700 animate-pulse">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-heading text-amber-300 mb-2">◊</div>
              <p className="font-mono text-xs text-amber-200/70">DIGIARTIFACT</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl md:text-4xl text-amber-300">
              Welcome, Seeker
            </h1>
            <p className="font-mono text-sm text-slate-400 max-w-xs">
              Initialize the interface to begin your expedition
            </p>
          </div>

          {/* Initialize Button */}
          <button
            onClick={() => setHasEntered(true)}
            className="mt-8 px-8 py-3 font-mono text-sm font-bold text-obsidian bg-relic-gold hover:bg-amber-400 rounded-lg shadow-gold-glow hover:shadow-[0_0_30px_rgba(204,164,59,0.8)] transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-black"
          >
            → INITIALIZE INTERFACE
          </button>

          {/* Decorative runes */}
          <div className="mt-12 flex gap-6 text-slate-600 text-xl font-mono">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>◈</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>◆</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>◈</span>
          </div>
        </div>
      </main>
    )
  }

  // Main content after splash screen
  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden relative">
      {/* Background Ambience - Subtle Void Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80" />
      
      {/* The Main Artifact: The Circle of 13 */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Reliquary />
      </div>
    </main>
  )
}