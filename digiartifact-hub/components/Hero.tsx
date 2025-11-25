'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Force video to play on mount
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed:', err)
      })
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-0">
      {/* Video background */}
      <video 
        ref={videoRef}
        autoPlay 
        loop 
        muted 
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/assets/video/background_loop.webm" type="video/webm" />
        <source src="/assets/video/background_loop.mp4" type="video/mp4" />
      </video>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-grid-overlay opacity-20 z-[1]" />
      
      {/* Overlay gradient - darkens video for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian/70 via-obsidian/40 to-obsidian/80 z-[2]" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-relic-gold mb-3 sm:mb-4 text-glow-gold animate-fade-in leading-tight">
          DIGIARTIFACT
        </h1>
        <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-sand mb-4 sm:mb-6 animate-fade-in-delay-1 leading-relaxed px-2">
          The intersection of Art, Audio, and Interactive, Immersive Experiences.
        </p>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-mono text-hologram-cyan mb-6 sm:mb-8 text-glow-cyan animate-fade-in-delay-2 px-2">
          &quot;Premium Digital Assets for Creators & Dreamers.&quot;
        </p>
        
        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-delay-3 px-4">
          <a
            href="#choose-path"
            className="btn-rune text-sm sm:text-base min-h-[44px] flex items-center justify-center"
          >
            &gt;&gt; Explore the Archive
          </a>
          <a
            href="/vault"
            className="btn-hologram text-sm sm:text-base min-h-[44px] flex items-center justify-center"
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
