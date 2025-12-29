'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGamification } from '@/contexts/GamificationContext'

type TimerMode = 'focus' | 'short-break' | 'long-break'

interface TimerConfig {
  focus: number
  shortBreak: number
  longBreak: number
  sessionsUntilLongBreak: number
}

interface TimerState {
  mode: TimerMode
  timeRemaining: number
  isRunning: boolean
  completedSessions: number
  customFocusTime: number
  startedAt: number | null // Timestamp when timer started
}

const DEFAULT_CONFIG: TimerConfig = {
  focus: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
  sessionsUntilLongBreak: 4,
}

const PRESET_DURATIONS = [
  { label: '15 min', value: 15 * 60 },
  { label: '25 min', value: 25 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '60 min', value: 60 * 60 },
]

const STORAGE_KEY = 'workers_focus_timer_state'

export default function FocusTimer() {
  const { recordAction } = useGamification()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_CONFIG.focus)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG)
  const [showSettings, setShowSettings] = useState(false)
  const [customFocusTime, setCustomFocusTime] = useState(DEFAULT_CONFIG.focus)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  
  // Ref to track if we've loaded from storage
  const hasLoadedRef = useRef(false)

  // Load state from localStorage on mount
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved)
        setMode(state.mode)
        setCompletedSessions(state.completedSessions)
        setCustomFocusTime(state.customFocusTime)
        
        // If timer was running, calculate elapsed time
        if (state.isRunning && state.startedAt) {
          const elapsed = Math.floor((Date.now() - state.startedAt) / 1000)
          const remaining = Math.max(0, state.timeRemaining - elapsed)
          
          if (remaining > 0) {
            setTimeRemaining(remaining)
            setIsRunning(true)
            setStartedAt(state.startedAt)
          } else {
            // Timer completed while away
            setTimeRemaining(0)
            setIsRunning(false)
            setStartedAt(null)
          }
        } else {
          setTimeRemaining(state.timeRemaining)
          setIsRunning(false)
        }
      } catch {
        // Invalid state, use defaults
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedRef.current) return
    
    const state: TimerState = {
      mode,
      timeRemaining,
      isRunning,
      completedSessions,
      customFocusTime,
      startedAt,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [mode, timeRemaining, isRunning, completedSessions, customFocusTime, startedAt])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0) {
      // Timer completed
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeRemaining])

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    
    // Play notification sound (browser API)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Timer', {
        body: mode === 'focus' ? 'Great work! Time for a break.' : 'Break over! Ready to focus?',
        icon: '/favicon.ico'
      })
    }

    // Auto-switch modes
    if (mode === 'focus') {
      // Award XP for completing a focus session
      recordAction('FOCUS_SESSION_COMPLETE', { reason: 'Focus Session Complete' })
      
      const newSessionCount = completedSessions + 1
      setCompletedSessions(newSessionCount)
      
      if (newSessionCount % config.sessionsUntilLongBreak === 0) {
        setMode('long-break')
        setTimeRemaining(config.longBreak)
      } else {
        setMode('short-break')
        setTimeRemaining(config.shortBreak)
      }
    } else {
      setMode('focus')
      setTimeRemaining(customFocusTime)
    }
  }, [mode, completedSessions, config, customFocusTime, recordAction])

  const toggleTimer = () => {
    if (!isRunning && timeRemaining === 0) {
      // Reset timer if it was at 0
      setTimeRemaining(mode === 'focus' ? customFocusTime : mode === 'short-break' ? config.shortBreak : config.longBreak)
    }
    
    if (!isRunning) {
      // Starting timer - record start time
      setStartedAt(Date.now())
    } else {
      // Pausing timer - clear start time
      setStartedAt(null)
    }
    
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setStartedAt(null)
    setTimeRemaining(mode === 'focus' ? customFocusTime : mode === 'short-break' ? config.shortBreak : config.longBreak)
  }

  const selectMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setStartedAt(null)
    setMode(newMode)
    switch (newMode) {
      case 'focus':
        setTimeRemaining(customFocusTime)
        break
      case 'short-break':
        setTimeRemaining(config.shortBreak)
        break
      case 'long-break':
        setTimeRemaining(config.longBreak)
        break
    }
  }

  const setFocusDuration = (seconds: number) => {
    setCustomFocusTime(seconds)
    if (mode === 'focus' && !isRunning) {
      setTimeRemaining(seconds)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (): number => {
    const total = mode === 'focus' ? customFocusTime : mode === 'short-break' ? config.shortBreak : config.longBreak
    return ((total - timeRemaining) / total) * 100
  }

  const getModeConfig = (m: TimerMode) => {
    switch (m) {
      case 'focus':
        return { label: 'Focus', color: 'text-relic-gold', bgColor: 'bg-relic-gold', borderColor: 'border-relic-gold' }
      case 'short-break':
        return { label: 'Short Break', color: 'text-green-400', bgColor: 'bg-green-400', borderColor: 'border-green-400' }
      case 'long-break':
        return { label: 'Long Break', color: 'text-cyan-400', bgColor: 'bg-cyan-400', borderColor: 'border-cyan-400' }
    }
  }

  const modeConfig = getModeConfig(mode)

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="card relative">
      {/* Glass Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-screen bg-repeat" style={{ backgroundImage: 'url(/glass_tiled.webp)' }} />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-sand">Focus Timer</h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-relic-gold/10 transition-colors"
          aria-label="Timer settings"
        >
          <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        {(['focus', 'short-break', 'long-break'] as TimerMode[]).map((m) => {
          const cfg = getModeConfig(m)
          return (
            <button
              key={m}
              onClick={() => selectMode(m)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition-all ${
                mode === m 
                  ? `${cfg.bgColor}/20 ${cfg.color} border ${cfg.borderColor}` 
                  : 'bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-relic-gold/30'
              }`}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Timer Display */}
      <div className="relative mb-6">
        {/* Progress Ring */}
        <div className="relative w-40 h-40 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-obsidian"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={439.8}
              strokeDashoffset={439.8 - (439.8 * getProgressPercentage()) / 100}
              strokeLinecap="round"
              className={modeConfig.color}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-3xl font-bold ${modeConfig.color}`}>
              {formatTime(timeRemaining)}
            </span>
            <span className="text-text-slate text-xs font-mono mt-1">{modeConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Focus Duration Presets (when in focus mode and not running) */}
      {mode === 'focus' && !isRunning && (
        <div className="flex justify-center gap-2 mb-4">
          {PRESET_DURATIONS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setFocusDuration(preset.value)}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                customFocusTime === preset.value
                  ? 'bg-relic-gold/30 text-relic-gold border border-relic-gold'
                  : 'bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-relic-gold/30'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-obsidian/50 border border-baked-clay/30 hover:border-relic-gold/50 transition-colors"
          aria-label="Reset timer"
        >
          <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={toggleTimer}
          className={`p-4 rounded-full transition-all ${
            isRunning 
              ? 'bg-status-break/20 border border-status-break hover:bg-status-break/30' 
              : 'bg-relic-gold/20 border border-relic-gold hover:bg-relic-gold/30'
          }`}
          aria-label={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? (
            <svg className="w-6 h-6 text-status-break" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-relic-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => {
            if (mode === 'focus') selectMode('short-break')
            else selectMode('focus')
          }}
          className="p-3 rounded-full bg-obsidian/50 border border-baked-clay/30 hover:border-relic-gold/50 transition-colors"
          aria-label="Skip to next"
        >
          <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Session Counter */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <span className="text-text-slate text-xs font-mono">Sessions today:</span>
        <div className="flex gap-1">
          {[...Array(config.sessionsUntilLongBreak)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < (completedSessions % config.sessionsUntilLongBreak)
                  ? 'bg-relic-gold'
                  : 'bg-obsidian border border-baked-clay/30'
              }`}
            />
          ))}
        </div>
        <span className="text-relic-gold text-xs font-mono font-bold">{completedSessions}</span>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-6 p-4 rounded-lg bg-obsidian/50 border border-baked-clay/30">
          <h4 className="text-sm font-mono text-sand mb-3">Timer Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-slate text-sm">Sessions until long break</span>
              <select
                value={config.sessionsUntilLongBreak}
                onChange={(e) => setConfig({...config, sessionsUntilLongBreak: parseInt(e.target.value)})}
                className="bg-obsidian border border-baked-clay/50 rounded px-2 py-1 text-sand text-sm"
              >
                {[2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-slate text-sm">Short break (min)</span>
              <select
                value={config.shortBreak / 60}
                onChange={(e) => setConfig({...config, shortBreak: parseInt(e.target.value) * 60})}
                className="bg-obsidian border border-baked-clay/50 rounded px-2 py-1 text-sand text-sm"
              >
                {[3, 5, 7, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-slate text-sm">Long break (min)</span>
              <select
                value={config.longBreak / 60}
                onChange={(e) => setConfig({...config, longBreak: parseInt(e.target.value) * 60})}
                className="bg-obsidian border border-baked-clay/50 rounded px-2 py-1 text-sand text-sm"
              >
                {[10, 15, 20, 30].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
