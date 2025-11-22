'use client'

import { useAudio } from '@/contexts/AudioContext'
import { Play, Pause, Volume2 } from 'lucide-react'
import Image from 'next/image'

export default function GlobalAudioPlayer() {
  const { currentTrack, isPlaying, volume, currentTime, duration, togglePlayPause, setVolume } = useAudio()
  
  if (!currentTrack) return null
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  
  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 h-20 bg-obsidian/95 backdrop-blur-md border-t-2 border-baked-clay flex items-center px-6 z-50">
      {/* Album Art */}
      <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
        <Image
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          fill
          className="object-cover"
        />
      </div>
      
      {/* Track Info */}
      <div className="ml-4 flex-1 min-w-0">
        <h4 className="font-mono text-sm text-sand truncate">{currentTrack.title}</h4>
        <p className="text-xs text-text-slate truncate">{currentTrack.artist}</p>
        
        {/* Progress Bar */}
        <div className="mt-1 flex items-center gap-2 text-xs text-text-slate">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-slate rounded-full overflow-hidden">
            <div
              className="h-full bg-hologram-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4 ml-4">
        <button
          onClick={togglePlayPause}
          className="p-3 hover:bg-slate/20 rounded-full transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-hologram-cyan" />
          ) : (
            <Play className="w-5 h-5 text-hologram-cyan" fill="currentColor" />
          )}
        </button>
        
        {/* Volume Control */}
        <div className="hidden sm:flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-text-slate" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-hologram-cyan"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
