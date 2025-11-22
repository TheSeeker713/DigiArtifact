'use client'

import { Play } from 'lucide-react'
import { useAudio } from '@/contexts/AudioContext'

interface AudioDemoButtonProps {
  artifactId: string
  title: string
  demoUrl: string
  thumbnail: string
  type: 'audio' | 'visual' | 'interactive'
}

export default function AudioDemoButton({ artifactId, title, demoUrl, thumbnail, type }: AudioDemoButtonProps) {
  const { play } = useAudio()
  
  const handlePlayDemo = () => {
    play({
      id: artifactId,
      title,
      artist: 'DigiArtifact',
      url: demoUrl,
      thumbnail,
    })
  }

  return (
    <button
      onClick={handlePlayDemo}
      className="btn-hologram w-full flex items-center justify-center gap-2"
    >
      <Play className="w-4 h-4" />
      {type === 'audio' ? 'Listen to Demo' : type === 'interactive' ? 'Try Demo' : 'Preview'}
    </button>
  )
}
