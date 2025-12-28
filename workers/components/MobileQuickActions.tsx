'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useClockStatus, useClockIn, useClockOut, useBreakStart, useBreakEnd } from '../hooks/useTimeEntries'
import { useSwipe, SwipeDirection } from '../hooks/useSwipe'

export default function MobileQuickActions() {
  const { } = useAuth()
  const { data: clockData } = useClockStatus()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()
  const breakStartMutation = useBreakStart()
  const breakEndMutation = useBreakEnd()
  const clockStatus = clockData?.status || 'clocked-out'
  
  const clockIn = () => clockInMutation.mutate(undefined)
  const clockOut = () => clockOutMutation.mutate(undefined)
  const startBreak = () => breakStartMutation.mutate()
  const endBreak = () => breakEndMutation.mutate()
  const [showActions, setShowActions] = useState(false)
  const [swipeHint, setSwipeHint] = useState<string | null>(null)
  const [actionConfirm, setActionConfirm] = useState<string | null>(null)

  const handleSwipe = useCallback((direction: SwipeDirection, distance: number) => {
    if (distance < 80) return

    setSwipeHint(null)

    switch (direction) {
      case 'right':
        if (clockStatus === 'clocked-out') {
          clockIn()
          setActionConfirm('Clocked In!')
        } else if (clockStatus === 'on-break') {
          endBreak()
          setActionConfirm('Break Ended!')
        }
        break
      case 'left':
        if (clockStatus === 'clocked-in') {
          clockOut()
          setActionConfirm('Clocked Out!')
        }
        break
      case 'up':
        if (clockStatus === 'clocked-in') {
          startBreak()
          setActionConfirm('Break Started!')
        }
        break
      case 'down':
        setShowActions(!showActions)
        break
    }

    if (actionConfirm !== null) {
      setTimeout(() => setActionConfirm(null), 2000)
    }
  }, [clockStatus, clockIn, clockOut, startBreak, endBreak, showActions, actionConfirm])

  const { handlers, swipeDirection, swipeDistance, isSwiping } = useSwipe(handleSwipe, {
    threshold: 80,
    preventScrollOnHorizontal: true
  })

  // Update swipe hints
  const getSwipeHint = () => {
    if (!isSwiping) return null
    const absX = Math.abs(swipeDistance.x)
    const absY = Math.abs(swipeDistance.y)
    
    if (absX > 40 || absY > 40) {
      if (swipeDirection === 'right' && clockStatus === 'clocked-out') {
        return '→ Swipe to Clock In'
      }
      if (swipeDirection === 'right' && clockStatus === 'on-break') {
        return '→ Swipe to End Break'
      }
      if (swipeDirection === 'left' && clockStatus === 'clocked-in') {
        return '← Swipe to Clock Out'
      }
      if (swipeDirection === 'up' && clockStatus === 'clocked-in') {
        return '↑ Swipe to Start Break'
      }
    }
    return null
  }

  const currentHint = getSwipeHint()

  // Get status-specific colors
  const getStatusColor = () => {
    switch (clockStatus) {
      case 'clocked-in':
        return 'from-emerald-500 to-green-600'
      case 'on-break':
        return 'from-amber-500 to-orange-600'
      case 'clocked-out':
        return 'from-slate-500 to-slate-600'
      default:
        return 'from-relic-gold to-amber-600'
    }
  }

  const getStatusIcon = () => {
    switch (clockStatus) {
      case 'clocked-in':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'on-break':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'clocked-out':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe">
      {/* Action confirmation toast */}
      {actionConfirm && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg animate-bounce-in">
          {actionConfirm}
        </div>
      )}

      {/* Swipe hint */}
      {currentHint && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-obsidian/95 backdrop-blur-sm border border-relic-gold/30 text-relic-gold px-4 py-2 rounded-lg font-mono text-sm shadow-lg">
          {currentHint}
        </div>
      )}

      {/* Main swipe area */}
      <div
        {...handlers}
        className="bg-gradient-to-t from-obsidian via-obsidian/95 to-transparent pt-8 pb-4 px-4 touch-pan-y"
      >
        {/* Expanded quick actions */}
        {showActions && (
          <div className="grid grid-cols-3 gap-3 mb-4 animate-slide-up">
            <button
              onClick={() => clockStatus === 'clocked-out' && clockIn()}
              disabled={clockStatus !== 'clocked-out'}
              className={`p-4 rounded-xl ${clockStatus === 'clocked-out' ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'} border flex flex-col items-center gap-2 transition-all active:scale-95`}
            >
              <svg className={`w-6 h-6 ${clockStatus === 'clocked-out' ? 'text-emerald-400' : 'text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className={`text-xs font-semibold ${clockStatus === 'clocked-out' ? 'text-emerald-300' : 'text-white/30'}`}>Clock In</span>
            </button>

            <button
              onClick={() => clockStatus === 'clocked-in' && startBreak()}
              disabled={clockStatus !== 'clocked-in'}
              className={`p-4 rounded-xl ${clockStatus === 'clocked-in' ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/5 border-white/10'} border flex flex-col items-center gap-2 transition-all active:scale-95`}
            >
              <svg className={`w-6 h-6 ${clockStatus === 'clocked-in' ? 'text-amber-400' : 'text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-xs font-semibold ${clockStatus === 'clocked-in' ? 'text-amber-300' : 'text-white/30'}`}>Break</span>
            </button>

            <button
              onClick={() => clockStatus === 'clocked-in' && clockOut()}
              disabled={clockStatus !== 'clocked-in'}
              className={`p-4 rounded-xl ${clockStatus === 'clocked-in' ? 'bg-red-500/20 border-red-500/40' : 'bg-white/5 border-white/10'} border flex flex-col items-center gap-2 transition-all active:scale-95`}
            >
              <svg className={`w-6 h-6 ${clockStatus === 'clocked-in' ? 'text-red-400' : 'text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className={`text-xs font-semibold ${clockStatus === 'clocked-in' ? 'text-red-300' : 'text-white/30'}`}>Clock Out</span>
            </button>
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-4">
          {/* Left swipe indicator */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSwiping && swipeDirection === 'left' ? 'bg-red-500/30 scale-110' : 'bg-white/5'}`}>
            <svg className={`w-4 h-4 ${isSwiping && swipeDirection === 'left' ? 'text-red-400' : 'text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>

          {/* Main status button */}
          <button
            onClick={() => setShowActions(!showActions)}
            className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${getStatusColor()} flex items-center justify-center shadow-lg transition-all active:scale-95`}
            style={{
              transform: isSwiping ? `translate(${swipeDistance.x * 0.3}px, ${swipeDistance.y * 0.3}px)` : undefined
            }}
          >
            <div className="text-white">
              {getStatusIcon()}
            </div>
            
            {/* Pulse animation when clocked in */}
            {clockStatus === 'clocked-in' && (
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
            )}
          </button>

          {/* Right swipe indicator */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSwiping && swipeDirection === 'right' ? 'bg-emerald-500/30 scale-110' : 'bg-white/5'}`}>
            <svg className={`w-4 h-4 ${isSwiping && swipeDirection === 'right' ? 'text-emerald-400' : 'text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Swipe instruction */}
        <p className="text-center text-xs text-white/40 mt-3 font-mono">
          Swipe for quick actions • Tap to expand
        </p>
      </div>
    </div>
  )
}
