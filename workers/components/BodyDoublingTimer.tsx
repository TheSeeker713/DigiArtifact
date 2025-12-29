'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGamification } from '@/contexts/GamificationContext'

interface BodyDoublingSession {
  id: string
  startTime: number
  endTime?: number
  duration: number // planned duration in seconds
  partnersCount: number // simulated number of virtual partners
  completed: boolean
}

// Pre-defined session durations
const SESSION_PRESETS = [
  { label: '15 min Sprint', duration: 15 * 60, icon: '🏃' },
  { label: '30 min Focus', duration: 30 * 60, icon: '🎯' },
  { label: '45 min Deep Work', duration: 45 * 60, icon: '🧠' },
  { label: '60 min Marathon', duration: 60 * 60, icon: '🏆' },
  { label: '90 min Ultra', duration: 90 * 60, icon: '⚡' },
]

// Virtual co-workers (for the simulation)
const VIRTUAL_PARTNERS = [
  { name: 'Alex', avatar: '👨‍💻', status: 'Deep in code' },
  { name: 'Sam', avatar: '👩‍💼', status: 'Writing documentation' },
  { name: 'Jordan', avatar: '🧑‍🎨', status: 'Designing layouts' },
  { name: 'Casey', avatar: '👨‍🔬', status: 'Analyzing data' },
  { name: 'Riley', avatar: '👩‍🔧', status: 'Fixing bugs' },
  { name: 'Morgan', avatar: '🧑‍💻', status: 'Building features' },
  { name: 'Taylor', avatar: '👨‍🎓', status: 'Learning new skills' },
  { name: 'Quinn', avatar: '👩‍🚀', status: 'Launching projects' },
]

export default function BodyDoublingTimer() {
  const { recordAction } = useGamification()
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(SESSION_PRESETS[1].duration)
  const [timeRemaining, setTimeRemaining] = useState(selectedDuration)
  const [sessionHistory, setSessionHistory] = useState<BodyDoublingSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [activePartners, setActivePartners] = useState<typeof VIRTUAL_PARTNERS>([])
  const [currentSession, setCurrentSession] = useState<BodyDoublingSession | null>(null)

  // Load session history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('workers_body_doubling_history')
    if (saved) {
      try {
        setSessionHistory(JSON.parse(saved))
      } catch {
        setSessionHistory([])
      }
    }
  }, [])

  // Save session history to localStorage
  useEffect(() => {
    localStorage.setItem('workers_body_doubling_history', JSON.stringify(sessionHistory))
  }, [sessionHistory])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isSessionActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && isSessionActive) {
      completeSession()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSessionActive, timeRemaining])

  // Randomly change partner activities
  useEffect(() => {
    if (!isSessionActive) return
    
    const activities = [
      'Deep in code', 'Writing docs', 'In the zone', 'Making progress',
      'Taking notes', 'Problem solving', 'Building features', 'Testing',
      'Brainstorming', 'Almost done', 'On a roll', 'Crushing it'
    ]
    
    const interval = setInterval(() => {
      setActivePartners(prev => prev.map(p => ({
        ...p,
        status: activities[Math.floor(Math.random() * activities.length)]
      })))
    }, 15000) // Update every 15 seconds
    
    return () => clearInterval(interval)
  }, [isSessionActive])

  const startSession = useCallback(() => {
    // Select random partners (2-5)
    const partnerCount = Math.floor(Math.random() * 4) + 2
    const shuffled = [...VIRTUAL_PARTNERS].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, partnerCount)
    
    setActivePartners(selected)
    setTimeRemaining(selectedDuration)
    setIsSessionActive(true)
    
    const session: BodyDoublingSession = {
      id: Date.now().toString(),
      startTime: Date.now(),
      duration: selectedDuration,
      partnersCount: partnerCount,
      completed: false,
    }
    setCurrentSession(session)
    
    // Play a subtle notification sound (browser API)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Body Doubling Session Started', {
        body: `Working with ${partnerCount} virtual partners. Let's focus together!`,
        icon: '/favicon.ico'
      })
    }
  }, [selectedDuration])

  const completeSession = useCallback(() => {
    setIsSessionActive(false)
    
    if (currentSession) {
      const completedSession: BodyDoublingSession = {
        ...currentSession,
        endTime: Date.now(),
        completed: true,
      }
      setSessionHistory(prev => [completedSession, ...prev.slice(0, 19)]) // Keep last 20
      
      // Award XP for completing the session
      recordAction('BODY_DOUBLING_SESSION', { reason: 'Body Doubling Session' })
    }
    
    setCurrentSession(null)
    setActivePartners([])
    
    // Celebration notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Session Complete!', {
        body: 'Great work! You stayed focused with your virtual team.',
        icon: '/favicon.ico'
      })
    }
  }, [currentSession, recordAction])

  const cancelSession = () => {
    setIsSessionActive(false)
    setTimeRemaining(selectedDuration)
    setCurrentSession(null)
    setActivePartners([])
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`
  }

  const getProgressPercentage = (): number => {
    return ((selectedDuration - timeRemaining) / selectedDuration) * 100
  }

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <h3 className="font-heading text-lg text-sand">Body Doubling</h3>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-mono text-text-slate hover:text-relic-gold transition-colors"
        >
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      {!isSessionActive ? (
        <>
          {/* Session Setup */}
          <div className="text-center mb-6">
            <p className="text-text-slate text-sm mb-4">
              Work alongside virtual co-workers to stay accountable and focused.
            </p>
            
            {/* Duration Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {SESSION_PRESETS.map((preset) => (
                <button
                  key={preset.duration}
                  onClick={() => setSelectedDuration(preset.duration)}
                  className={`p-3 rounded-lg text-sm font-mono transition-all ${
                    selectedDuration === preset.duration
                      ? 'bg-relic-gold/30 text-relic-gold border border-relic-gold'
                      : 'bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-relic-gold/30'
                  }`}
                >
                  <span className="text-lg block mb-1">{preset.icon}</span>
                  <span className="text-xs">{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Start Button */}
            <button
              onClick={startSession}
              className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-relic-gold to-amber-500 text-obsidian font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Start Co-Working Session
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Active Session */}
          <div className="text-center mb-6">
            {/* Timer Display */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              {/* Progress Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-obsidian"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (553 * getProgressPercentage()) / 100}
                  strokeLinecap="round"
                  className="text-relic-gold transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-bold text-relic-gold">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-text-slate text-xs font-mono mt-1">remaining</span>
              </div>
            </div>

            {/* Virtual Partners */}
            <div className="mb-6">
              <p className="text-sand text-sm font-mono mb-3">
                Working with {activePartners.length} virtual partners
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {activePartners.map((partner) => (
                  <div
                    key={partner.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-obsidian/50 border border-baked-clay/30"
                  >
                    <span className="text-xl">{partner.avatar}</span>
                    <div className="text-left">
                      <p className="text-sand text-xs font-mono">{partner.name}</p>
                      <p className="text-text-slate/60 text-xs">{partner.status}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={cancelSession}
              className="px-6 py-2 rounded-lg bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-red-500/50 hover:text-red-400 transition-colors text-sm font-mono"
            >
              End Session Early
            </button>
          </div>
        </>
      )}

      {/* Session History */}
      {showHistory && sessionHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-baked-clay/30">
          <h4 className="text-sand text-sm font-mono mb-3">Recent Sessions</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessionHistory.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-2 rounded-lg bg-obsidian/30"
              >
                <div className="flex items-center gap-3">
                  <span className={session.completed ? 'text-green-400' : 'text-yellow-400'}>
                    {session.completed ? '✓' : '○'}
                  </span>
                  <div>
                    <p className="text-sand text-xs font-mono">
                      {formatDuration(session.duration)} with {session.partnersCount} partners
                    </p>
                    <p className="text-text-slate/60 text-xs">
                      {new Date(session.startTime).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty History State */}
      {showHistory && sessionHistory.length === 0 && (
        <div className="mt-4 pt-4 border-t border-baked-clay/30 text-center py-6">
          <span className="text-3xl">📭</span>
          <p className="text-text-slate text-sm mt-2">No sessions yet</p>
          <p className="text-text-slate/60 text-xs">Start your first co-working session!</p>
        </div>
      )}
    </div>
  )
}
