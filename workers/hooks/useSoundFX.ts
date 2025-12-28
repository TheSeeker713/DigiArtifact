'use client'

import { useCallback, useRef, useEffect } from 'react'

/**
 * Lightweight hook for playing sound effects in NextJS
 * Uses Web Audio API for low-latency playback without blocking UI
 * 
 * Features:
 * - Preloads sounds for instant playback
 * - Respects user preferences (reduced motion, muted)
 * - Lightweight and performant
 * - No external dependencies
 */
interface SoundOptions {
  volume?: number // 0.0 to 1.0
  playbackRate?: number // 0.5 to 2.0
}

type SoundType = 'xp-gain' | 'level-up' | 'achievement'

// Sound definitions - using Web Audio API for programmatic generation
// This avoids loading external files and keeps bundle size small
const SOUND_DEFINITIONS: Record<SoundType, () => AudioBuffer> = {
  'xp-gain': () => generateXPChime(),
  'level-up': () => generateLevelUpFanfare(),
  'achievement': () => generateAchievementUnlock(),
}

// Audio context singleton (created once, reused)
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

/**
 * Generate a pleasant chime sound for XP gain
 */
function generateXPChime(): AudioBuffer {
  const ctx = getAudioContext()
  const sampleRate = ctx.sampleRate
  const duration = 0.15 // 150ms
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate)
  const data = buffer.getChannelData(0)
  
  // Two-tone chime (C5 and E5)
  const freq1 = 523.25 // C5
  const freq2 = 659.25 // E5
  
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * 8) // Exponential decay
    const wave1 = Math.sin(2 * Math.PI * freq1 * t) * 0.3
    const wave2 = Math.sin(2 * Math.PI * freq2 * t) * 0.2
    data[i] = (wave1 + wave2) * envelope
  }
  
  return buffer
}

/**
 * Generate an epic fanfare for level up
 */
function generateLevelUpFanfare(): AudioBuffer {
  const ctx = getAudioContext()
  const sampleRate = ctx.sampleRate
  const duration = 0.8 // 800ms
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate)
  const data = buffer.getChannelData(0)
  
  // Ascending chord progression (C major triad ascending)
  const frequencies = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
  
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate
    let sample = 0
    
    // Play each note in sequence
    frequencies.forEach((freq, index) => {
      const noteStart = index * 0.15
      const noteEnd = noteStart + 0.2
      if (t >= noteStart && t <= noteEnd) {
        const noteT = (t - noteStart) / 0.2
        const envelope = Math.exp(-noteT * 3) * (1 - noteT)
        sample += Math.sin(2 * Math.PI * freq * noteT) * envelope * 0.25
      }
    })
    
    // Add a shimmer effect
    const shimmer = Math.sin(2 * Math.PI * 5 * t) * 0.1
    data[i] = sample + shimmer
  }
  
  return buffer
}

/**
 * Generate a satisfying unlock sound for achievements
 */
function generateAchievementUnlock(): AudioBuffer {
  const ctx = getAudioContext()
  const sampleRate = ctx.sampleRate
  const duration = 0.4 // 400ms
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate)
  const data = buffer.getChannelData(0)
  
  // Ascending sweep with a pop
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate
    const freq = 200 + (t / duration) * 800 // Sweep from 200Hz to 1000Hz
    const envelope = Math.exp(-t * 4)
    const wave = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4
    
    // Add a pop at the end
    const popTime = 0.3
    if (t > popTime) {
      const popT = (t - popTime) / (duration - popTime)
      const pop = Math.random() * 0.2 * Math.exp(-popT * 10)
      data[i] = wave + pop
    } else {
      data[i] = wave
    }
  }
  
  return buffer
}

export function useSoundFX() {
  const buffersRef = useRef<Map<SoundType, AudioBuffer>>(new Map())
  const isMutedRef = useRef(false)
  const volumeRef = useRef(0.7) // Default volume

  // Preload sounds on mount
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      isMutedRef.current = true
      return
    }

    // Preload all sounds
    Object.keys(SOUND_DEFINITIONS).forEach((key) => {
      try {
        const buffer = SOUND_DEFINITIONS[key as SoundType]()
        buffersRef.current.set(key as SoundType, buffer)
      } catch (error) {
        console.warn(`Failed to preload sound ${key}:`, error)
      }
    })

    // Cleanup on unmount
    return () => {
      buffersRef.current.clear()
    }
  }, [])

  /**
   * Play a sound effect
   */
  const playSound = useCallback((type: SoundType, options: SoundOptions = {}) => {
    // Don't play if muted or reduced motion
    if (isMutedRef.current) return

    try {
      const buffer = buffersRef.current.get(type)
      if (!buffer) {
        // Generate on-demand if not preloaded
        const newBuffer = SOUND_DEFINITIONS[type]()
        buffersRef.current.set(type, newBuffer)
        playBuffer(newBuffer, options)
      } else {
        playBuffer(buffer, options)
      }
    } catch (error) {
      console.warn(`Failed to play sound ${type}:`, error)
    }
  }, [])

  /**
   * Play an audio buffer
   */
  const playBuffer = useCallback((buffer: AudioBuffer, options: SoundOptions = {}) => {
    try {
      const ctx = getAudioContext()
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const source = ctx.createBufferSource()
      const gainNode = ctx.createGain()
      
      source.buffer = buffer
      source.playbackRate.value = options.playbackRate || 1.0
      
      const volume = options.volume !== undefined ? options.volume : volumeRef.current
      gainNode.gain.value = volume
      
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      source.start(0)
    } catch (error) {
      console.warn('Failed to play audio buffer:', error)
    }
  }, [])

  /**
   * Set global volume (0.0 to 1.0)
   */
  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume))
  }, [])

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current
    return isMutedRef.current
  }, [])

  /**
   * Check if sounds are muted
   */
  const isMuted = useCallback(() => {
    return isMutedRef.current
  }, [])

  return {
    playSound,
    setVolume,
    toggleMute,
    isMuted,
  }
}

