'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Play, ZoomIn, Terminal } from 'lucide-react'
import { useAudio } from '@/contexts/AudioContext'

interface ArtifactCardProps {
  id: string
  slug: string
  title: string
  type: 'visual' | 'audio' | 'interactive'
  category: string
  thumbnail: string
  rarity?: 'gold' | 'silver' | 'standard'
  price?: number
}

const rarityColors = {
  gold: 'bg-rarity-gold',
  silver: 'bg-rarity-silver',
  standard: 'bg-text-slate',
}

export default function ArtifactCard({
  slug,
  title,
  type,
  category,
  thumbnail,
  rarity = 'standard',
  price,
}: ArtifactCardProps) {
  const { play } = useAudio()
  
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault()
    // For now, use a placeholder track
    play({
      id: slug,
      title,
      artist: 'DigiArtifact',
      url: '/audio/placeholder.mp3',
      thumbnail,
    })
  }
  
  if (type === 'visual') {
    return (
      <Link
        href={`/gallery/${slug}`}
        className="group relative aspect-[4/5] rounded-lg overflow-hidden excavation-border artifact-card block"
      >
        <div className="relative w-full h-full bg-slate">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <ZoomIn className="w-12 h-12 text-hologram-cyan" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian p-4">
          <h3 className="font-heading text-lg text-sand mb-1">{title}</h3>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded ${rarityColors[rarity]} text-obsidian font-mono`}>
              {category}
            </span>
            {price && <span className="text-relic-gold font-mono text-sm">${price}</span>}
          </div>
        </div>
      </Link>
    )
  }
  
  if (type === 'audio') {
    return (
      <div className="group aspect-square rounded-lg overflow-hidden excavation-border artifact-card bg-slate">
        <Link href={`/studio/${slug}`} className="block h-3/4 relative">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
          />
          <button
            onClick={handlePlayAudio}
            className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <Play className="w-16 h-16 text-hologram-cyan" fill="currentColor" />
          </button>
        </Link>
        <div className="h-1/4 p-3 bg-obsidian/80">
          <h3 className="font-mono text-sm truncate text-sand">{title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs px-2 py-0.5 rounded ${rarityColors[rarity]} text-obsidian`}>
              {category}
            </span>
            {price && <span className="text-relic-gold font-mono text-xs">${price}</span>}
          </div>
        </div>
      </div>
    )
  }
  
  // interactive type
  return (
    <Link
      href={`/terminal/${slug}`}
      className="group aspect-video rounded-lg overflow-hidden excavation-border artifact-card block"
    >
      <div className="relative w-full h-full bg-slate">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent">
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-heading text-xl text-sand mb-2">{title}</h3>
            <div className="flex items-center justify-between">
              <button className="px-4 py-2 bg-hologram-cyan text-obsidian font-mono hover:shadow-cyan-glow transition-shadow flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                &gt;&gt; LAUNCH
              </button>
              {price && <span className="text-relic-gold font-mono text-sm">${price}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
