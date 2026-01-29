"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type Gem = {
  name: string
  route: string
  label: string
  external?: boolean
}

const gems: Gem[] = [
  { name: 'Ruby', route: '/transmission', label: 'The Transmission' },
  { name: 'Amber', route: '/origin', label: 'The Origin' },
  { name: 'Sapphire', route: '/blueprint', label: 'The Blueprint' },
  { name: 'Emerald', route: '/paradigm', label: 'The Paradigm' },
  { name: 'Amethyst', route: '/lore', label: 'The Lore' },
  { name: 'Opal', route: '/prism', label: 'The Prism' },
  { name: 'Quartz', route: '/odyssey', label: 'The Odyssey' },
  { name: 'Onyx', route: '/void', label: 'The Void' },
  { name: 'Topaz', route: '/works', label: 'The Works' },
  { name: 'Pearl', route: '/echo', label: 'The Echo' },
  { name: 'Moonstone', route: '/r3s3t', label: 'The R3S3T' },
  { name: 'Garnet', route: '/alliance', label: 'The Alliance' },
  { name: 'Obsidian', route: 'https://workers.digiartifact.com', label: 'The Gate', external: true },
]

export default function Reliquary() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [radius, setRadius] = useState(0)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const compute = () => {
      // radius based on container size, leave padding for portal and gem size
      const size = Math.min(el.clientWidth, el.clientHeight)
      setRadius(size * 0.38)
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const count = gems.length

  return (
    <section className="w-full flex justify-center items-center py-12">
      <div
        ref={wrapRef}
        className="relative w-[18rem] h-[18rem] sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[36rem] lg:h-[36rem]"
        aria-label="Reliquary of Gems"
      >
        {/* Portal center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0.9 }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.95, 1, 0.95] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-amber-900 via-slate-900 to-emerald-900 shadow-2xl flex items-center justify-center border border-amber-800 relative overflow-hidden"
          >
            <Image
              src="/assets/images/Logo_DigiArtifact.png"
              alt="DigiArtifact Logo"
              fill
              className="object-contain p-2"
              priority
            />
          </motion.div>
          <div className="mt-3 text-center text-xs text-slate-300/80">The Portal</div>
        </div>

        {/* Gems positioned radially */}
        {gems.map((gem, i) => {
          const angle = (360 / count) * i
          const angleRad = (angle * Math.PI) / 180
          // compute absolute pixel offset using radius
          const x = radius * Math.cos(angleRad)
          const y = radius * Math.sin(angleRad)

          const GemInner = (
            <div className="relative w-full h-full">
              <motion.div
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx((s) => (s === i ? null : s))}
                whileTap={{ scale: 0.96 }}
                className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden shadow-lg bg-slate-900/50 border border-slate-800 cursor-pointer"
              >
              {/* static image - use next/image with fill so it respects responsive parent */}
              <div className="w-full h-full relative">
                <Image
                  src={`/assets/images/gems/${gem.name}.webp`}
                  alt={gem.label}
                  fill
                  className="object-contain"
                  draggable={false}
                  quality={90}
                />

                {/* video overlay - fades in on hover (higher z-index) */}
                <motion.video
                  src={`/assets/video/gems/${gem.name}.webm`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 mix-blend-screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoverIdx === i ? 1 : 0 }}
                  transition={{ duration: 0.28 }}
                  aria-hidden={hoverIdx === i ? 'false' : 'true'}
                />
              </div>

                {/* floating label on hover */}
                <AnimatePresence>
                  {hoverIdx === i && (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-1/2 -translate-x-1/2 -bottom-8 md:-bottom-10 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-200 backdrop-blur whitespace-nowrap"
                    >
                      {gem.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )

          // wrap with Link or anchor depending on external
          return (
            <div 
              key={gem.name} 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
            >
              {gem.external ? (
                <a
                  href={gem.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={gem.label}
                  title={gem.label}
                >
                  {GemInner}
                </a>
              ) : (
                <Link href={gem.route} aria-label={gem.label} title={gem.label}>
                  {GemInner}
                </Link>
              )}
            </div>
          )
        })}

        {/* Subtle cavern backdrop */}
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-slate-900/30 mix-blend-overlay" />
      </div>
    </section>
  )
}
