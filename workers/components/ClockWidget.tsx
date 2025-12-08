'use client'

import { useState, useEffect } from 'react'
import { useAuth, ClockStatus } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useGamification } from '@/contexts/GamificationContext'

// Mood/Energy options
const MOOD_OPTIONS = [
  { emoji: '😴', label: 'Tired', value: 1 },
  { emoji: '😐', label: 'Neutral', value: 2 },
  { emoji: '😊', label: 'Good', value: 3 },
  { emoji: '🔥', label: 'Energized', value: 4 },
  { emoji: '⚡', label: 'Hyper-focused', value: 5 },
]

const ENERGY_OPTIONS = [
  { emoji: '🔋', label: 'Low', value: 1, color: 'text-red-400' },
  { emoji: '🔋', label: 'Medium', value: 2, color: 'text-yellow-400' },
  { emoji: '🔋', label: 'Good', value: 3, color: 'text-green-400' },
  { emoji: '🔋', label: 'High', value: 4, color: 'text-emerald-400' },
  { emoji: '⚡', label: 'Peak', value: 5, color: 'text-cyan-400' },
]

// Common work tags
const PRESET_TAGS = [
  { tag: 'deepwork', icon: '🎯', label: 'Deep Work' },
  { tag: 'meeting', icon: '👥', label: 'Meeting' },
  { tag: 'admin', icon: '📋', label: 'Admin' },
  { tag: 'creative', icon: '🎨', label: 'Creative' },
  { tag: 'learning', icon: '📚', label: 'Learning' },
  { tag: 'collab', icon: '🤝', label: 'Collaboration' },
]

export default function ClockWidget() {
  const { clockStatus, currentEntry, projects, clockIn, clockOut, startBreak, endBreak } = useAuth()
  const { formatTime, parseUTCTimestamp, timezone } = useSettings()
  const { addXP } = useGamification()
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [selectedProject, setSelectedProject] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // New state for enhanced features
  const [mood, setMood] = useState<number>(3)
  const [energy, setEnergy] = useState<number>(3)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [inlineNotes, setInlineNotes] = useState('')

  // Update elapsed time every second when clocked in
  useEffect(() => {
    if (clockStatus === 'clocked-in' && currentEntry?.clock_in) {
      const updateTimer = () => {
        // Parse the clock_in timestamp using the settings context
        const start = parseUTCTimestamp(currentEntry.clock_in).getTime()
        const now = Date.now()
        const breakMs = (currentEntry.break_minutes || 0) * 60 * 1000
        
        // Calculate elapsed time (should always be positive when counting up)
        let diff = now - start - breakMs
        
        // Ensure diff is positive (counting up from 0)
        if (diff < 0) diff = 0

        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)

        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsedTime('00:00:00')
    }
  }, [clockStatus, currentEntry, parseUTCTimestamp])

  const handleClockIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      await clockIn(selectedProject)
      addXP(10, 'Clock In')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async () => {
    setShowNotesModal(true)
  }

  const confirmClockOut = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Combine notes with mood/energy/tags data
      const enhancedNotes = buildEnhancedNotes()
      await clockOut(enhancedNotes)
      addXP(20, 'Clock Out')
      setNotes('')
      setInlineNotes('')
      setSelectedTags([])
      setMood(3)
      setEnergy(3)
      setShowNotesModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out')
    } finally {
      setIsLoading(false)
    }
  }

  const buildEnhancedNotes = () => {
    const parts: string[] = []
    
    // Add mood/energy metadata
    const moodEmoji = MOOD_OPTIONS.find(m => m.value === mood)?.emoji || ''
    const energyLabel = ENERGY_OPTIONS.find(e => e.value === energy)?.label || ''
    parts.push(`[Mood: ${moodEmoji}] [Energy: ${energyLabel}]`)
    
    // Add tags
    if (selectedTags.length > 0) {
      parts.push(`Tags: ${selectedTags.map(t => `#${t}`).join(' ')}`)
    }
    
    // Add notes
    if (inlineNotes.trim()) {
      parts.push(`Notes: ${inlineNotes.trim()}`)
    }
    if (notes.trim()) {
      parts.push(notes.trim())
    }
    
    return parts.join('\n')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleBreak = async () => {
    setIsLoading(true)
    setError('')
    try {
      if (clockStatus === 'on-break') {
        await endBreak()
      } else {
        await startBreak()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle break')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: ClockStatus) => {
    switch (status) {
      case 'clocked-in':
        return {
          label: 'Working',
          dotClass: 'status-dot-active',
          bgClass: 'bg-status-active/10 border-status-active/30',
        }
      case 'on-break':
        return {
          label: 'On Break',
          dotClass: 'status-dot-break',
          bgClass: 'bg-status-break/10 border-status-break/30',
        }
      default:
        return {
          label: 'Clocked Out',
          dotClass: 'status-dot-offline',
          bgClass: 'bg-slate border-baked-clay/30',
        }
    }
  }

  const statusConfig = getStatusConfig(clockStatus)

  return (
    <>
      <div className={`card relative ${statusConfig.bgClass}`} data-tutorial="clock-widget">
        {/* Glass Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-screen bg-repeat" style={{ backgroundImage: 'url(/glass_tiled.webp)' }} />
        {/* Status Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`status-dot ${statusConfig.dotClass}`} />
            <span className="font-mono text-sm text-sand">{statusConfig.label}</span>
          </div>
          {currentEntry?.project_name && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentEntry.project_color || '#cca43b' }}
              />
              <span className="font-mono text-xs text-text-slate">{currentEntry.project_name}</span>
            </div>
          )}
        </div>

        {/* Time Display */}
        <div className="text-center mb-6">
          <p className="time-display">{elapsedTime}</p>
          <p className="text-text-slate text-sm font-mono mt-2">
            {clockStatus === 'clocked-in' || clockStatus === 'on-break'
              ? `Since ${formatTime(currentEntry?.clock_in || '')}`
              : 'Ready to start'}
          </p>
        </div>

        {/* Mood/Energy Display (when clocked in) */}
        {(clockStatus === 'clocked-in' || clockStatus === 'on-break') && (
          <div className="mb-6">
            {/* Mood & Energy Row */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setShowMoodPicker(!showMoodPicker)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-obsidian/50 border border-relic-gold/20 hover:border-relic-gold/50 transition-colors"
                aria-label="Set mood"
              >
                <span className="text-xl">{MOOD_OPTIONS.find(m => m.value === mood)?.emoji}</span>
                <span className="text-xs text-text-slate font-mono">Mood</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-obsidian/50 border border-relic-gold/20">
                {ENERGY_OPTIONS.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => setEnergy(e.value)}
                    className={`w-4 h-6 rounded transition-all ${
                      e.value <= energy 
                        ? e.value <= 2 ? 'bg-red-400' : e.value <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                        : 'bg-obsidian/80'
                    } ${energy === e.value ? 'ring-2 ring-relic-gold' : ''}`}
                    aria-label={`Energy level ${e.label}`}
                    title={e.label}
                  />
                ))}
                <span className="text-xs text-text-slate font-mono ml-1">Energy</span>
              </div>
            </div>
            
            {/* Mood Picker Dropdown */}
            {showMoodPicker && (
              <div className="flex justify-center gap-2 mb-4 p-2 rounded-lg bg-obsidian/70 border border-relic-gold/20">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => { setMood(m.value); setShowMoodPicker(false) }}
                    className={`text-2xl p-2 rounded-lg hover:bg-relic-gold/20 transition-colors ${
                      mood === m.value ? 'bg-relic-gold/30 ring-2 ring-relic-gold' : ''
                    }`}
                    title={m.label}
                    aria-label={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {PRESET_TAGS.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => toggleTag(t.tag)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono transition-all ${
                    selectedTags.includes(t.tag)
                      ? 'bg-relic-gold/30 text-relic-gold border border-relic-gold'
                      : 'bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-relic-gold/50'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Inline Notes */}
            <div className="relative">
              <input
                type="text"
                value={inlineNotes}
                onChange={(e) => setInlineNotes(e.target.value)}
                placeholder="Quick note... (what are you working on?)"
                className="input-field text-sm"
              />
            </div>
          </div>
        )}

        {/* Project Selection (when clocked out) */}
        {clockStatus === 'clocked-out' && projects.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-mono text-sand mb-2">Select Project</label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : undefined)}
              className="input-field"
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-status-offline/20 border border-status-offline/50 rounded-md">
            <p className="text-status-offline text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {clockStatus === 'clocked-out' ? (
            <button
              onClick={handleClockIn}
              disabled={isLoading}
              className="btn-clock-in w-full flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {isLoading ? 'Starting...' : 'Clock In'}
            </button>
          ) : (
            <>
              <button
                onClick={handleClockOut}
                disabled={isLoading}
                className="btn-clock-out w-full flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                {isLoading ? 'Stopping...' : 'Clock Out'}
              </button>
              <button
                onClick={handleBreak}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 ${
                  clockStatus === 'on-break' ? 'btn-rune' : 'btn-break'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {clockStatus === 'on-break' ? 'End Break' : 'Take Break'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl text-relic-gold mb-2">Session Complete!</h3>
            <p className="text-text-slate text-sm mb-6">
              How was your work session? (helps track productivity patterns)
            </p>
            
            {/* Session Summary */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-obsidian/50 border border-relic-gold/20 mb-6">
              <div>
                <p className="text-sand font-mono text-sm">Session Duration</p>
                <p className="text-relic-gold font-heading text-2xl">{elapsedTime}</p>
              </div>
              {currentEntry?.project_name && (
                <div className="text-right">
                  <p className="text-sand font-mono text-sm">Project</p>
                  <div className="flex items-center gap-2 justify-end">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentEntry.project_color || '#cca43b' }}
                    />
                    <span className="text-text-slate">{currentEntry.project_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mood Selection */}
            <div className="mb-6">
              <label className="block text-sm font-mono text-sand mb-3">How did you feel?</label>
              <div className="flex justify-center gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      mood === m.value 
                        ? 'bg-relic-gold/30 ring-2 ring-relic-gold' 
                        : 'bg-obsidian/50 hover:bg-relic-gold/10'
                    }`}
                  >
                    <span className="text-2xl mb-1">{m.emoji}</span>
                    <span className="text-xs text-text-slate">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div className="mb-6">
              <label className="block text-sm font-mono text-sand mb-3">Energy Level</label>
              <div className="flex items-center justify-center gap-1">
                {ENERGY_OPTIONS.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => setEnergy(e.value)}
                    className={`flex flex-col items-center p-2 rounded transition-all ${
                      energy === e.value ? 'ring-2 ring-relic-gold' : ''
                    }`}
                  >
                    <div 
                      className={`w-8 h-12 rounded ${
                        e.value <= energy 
                          ? e.value <= 2 ? 'bg-red-400' : e.value <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                          : 'bg-obsidian border border-baked-clay/30'
                      }`}
                    />
                    <span className="text-xs text-text-slate mt-1">{e.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Selection */}
            <div className="mb-6">
              <label className="block text-sm font-mono text-sand mb-3">What type of work?</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => toggleTag(t.tag)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                      selectedTags.includes(t.tag)
                        ? 'bg-relic-gold/30 text-relic-gold border border-relic-gold'
                        : 'bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-relic-gold/50'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-mono text-sand mb-2">Session Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field min-h-[80px]"
                placeholder="What did you accomplish? Any blockers or wins?"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="btn-hologram flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmClockOut}
                disabled={isLoading}
                className="btn-clock-out flex-1"
              >
                {isLoading ? 'Saving...' : 'Complete Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
