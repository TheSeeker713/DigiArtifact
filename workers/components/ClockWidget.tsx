'use client'

import { useState, useEffect } from 'react'
import { useAuth, ClockStatus } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'

export default function ClockWidget() {
  const { clockStatus, currentEntry, projects, clockIn, clockOut, startBreak, endBreak } = useAuth()
  const { formatTime, parseUTCTimestamp, timezone } = useSettings()
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [selectedProject, setSelectedProject] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
      await clockOut(notes)
      setNotes('')
      setShowNotesModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out')
    } finally {
      setIsLoading(false)
    }
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
      <div className={`card ${statusConfig.bgClass}`}>
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
        <div className="text-center mb-8">
          <p className="time-display">{elapsedTime}</p>
          <p className="text-text-slate text-sm font-mono mt-2">
            {clockStatus === 'clocked-in' || clockStatus === 'on-break'
              ? `Since ${formatTime(currentEntry?.clock_in || '')}`
              : 'Ready to start'}
          </p>
        </div>

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

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-4">Clock Out Notes</h3>
            <p className="text-text-slate text-sm mb-4">
              Add any notes about your work session (optional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[100px] mb-4"
              placeholder="What did you work on?"
            />
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
                {isLoading ? 'Clocking Out...' : 'Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
