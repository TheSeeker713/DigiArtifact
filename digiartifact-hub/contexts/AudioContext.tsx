'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

export interface Track {
  id: string
  title: string
  artist: string
  url: string
  thumbnail: string
  duration?: number
}

interface AudioContextType {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  play: (track: Track) => void
  pause: () => void
  togglePlayPause: () => void
  setVolume: (volume: number) => void
  seek: (time: number) => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
      
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      })
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0)
      })
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
      })
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack])

  const play = (track: Track) => {
    if (audioRef.current) {
      if (currentTrack?.id !== track.id) {
        audioRef.current.src = track.url
        setCurrentTrack(track)
        setCurrentTime(0)
      }
      setIsPlaying(true)
    }
  }

  const pause = () => {
    setIsPlaying(false)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        duration,
        play,
        pause,
        togglePlayPause,
        setVolume,
        seek,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}
