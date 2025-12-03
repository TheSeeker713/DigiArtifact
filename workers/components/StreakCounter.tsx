'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalDaysWorked: number
  lastWorkDate: string | null
  weekActivity: boolean[] // Sun-Sat, true if worked
}

export default function StreakCounter() {
  const { todayEntries, weeklyHours } = useAuth()
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysWorked: 0,
    lastWorkDate: null,
    weekActivity: [false, false, false, false, false, false, false],
  })
  const [showDetails, setShowDetails] = useState(false)

  // Calculate streak data from weekly hours
  useEffect(() => {
    // Convert weekly hours to activity - weeklyHours is [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const weekActivity = weeklyHours.map(hours => hours > 0)
    
    // Calculate current streak (consecutive days ending today or yesterday)
    let currentStreak = 0
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday
    
    // Map to our array index (Mon=0 in weeklyHours)
    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    
    // Check if worked today
    const workedToday = todayEntries.length > 0 || weeklyHours[todayIndex] > 0
    
    // Count streak backwards from today
    if (workedToday) {
      currentStreak = 1
      for (let i = todayIndex - 1; i >= 0; i--) {
        if (weeklyHours[i] > 0) {
          currentStreak++
        } else {
          break
        }
      }
    } else if (todayIndex > 0 && weeklyHours[todayIndex - 1] > 0) {
      // Didn't work today but worked yesterday - streak is still active
      currentStreak = 1
      for (let i = todayIndex - 2; i >= 0; i--) {
        if (weeklyHours[i] > 0) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate total days worked this week
    const totalDaysWorked = weekActivity.filter(Boolean).length

    // Simulate longest streak (would come from backend in production)
    const longestStreak = Math.max(currentStreak, 7) // Placeholder

    setStreakData({
      currentStreak,
      longestStreak,
      totalDaysWorked,
      lastWorkDate: workedToday ? today.toISOString() : null,
      weekActivity: [
        weeklyHours[6] > 0, // Sun
        weeklyHours[0] > 0, // Mon
        weeklyHours[1] > 0, // Tue
        weeklyHours[2] > 0, // Wed
        weeklyHours[3] > 0, // Thu
        weeklyHours[4] > 0, // Fri
        weeklyHours[5] > 0, // Sat
      ],
    })
  }, [weeklyHours, todayEntries])

  const getStreakMessage = () => {
    if (streakData.currentStreak === 0) {
      return "Start your streak today! 🌟"
    } else if (streakData.currentStreak === 1) {
      return "Great start! Keep going! 🔥"
    } else if (streakData.currentStreak < 5) {
      return "You're building momentum! 💪"
    } else if (streakData.currentStreak < 10) {
      return "On fire! Amazing consistency! 🔥🔥"
    } else {
      return "Legendary dedication! 👑"
    }
  }

  const getStreakColor = () => {
    if (streakData.currentStreak === 0) return 'text-text-slate'
    if (streakData.currentStreak < 3) return 'text-green-400'
    if (streakData.currentStreak < 7) return 'text-relic-gold'
    return 'text-cyan-400'
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-sand">Work Streak</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-text-slate hover:text-relic-gold transition-colors"
          aria-label="Toggle streak details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Main Streak Display */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <span className={`text-5xl font-heading font-bold ${getStreakColor()}`}>
            {streakData.currentStreak}
          </span>
          {streakData.currentStreak >= 3 && (
            <span className="absolute -top-2 -right-6 text-2xl animate-pulse">🔥</span>
          )}
        </div>
        <p className="text-text-slate text-sm font-mono mt-2">day streak</p>
        <p className="text-relic-gold text-xs mt-1">{getStreakMessage()}</p>
      </div>

      {/* Week Activity */}
      <div className="flex justify-center gap-2 mb-4">
        {dayLabels.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className="text-text-slate text-xs font-mono">{day}</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                streakData.weekActivity[index]
                  ? 'bg-relic-gold/30 border border-relic-gold'
                  : 'bg-obsidian/50 border border-baked-clay/30'
              }`}
            >
              {streakData.weekActivity[index] ? (
                <span className="text-sm">✓</span>
              ) : (
                <span className="text-text-slate/30 text-sm">·</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress to next milestone */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-mono text-text-slate mb-1">
          <span>Next milestone</span>
          <span>{getNextMilestone(streakData.currentStreak)} days</span>
        </div>
        <div className="h-2 bg-obsidian/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-relic-gold to-amber-500 transition-all duration-500"
            style={{ width: `${getMilestoneProgress(streakData.currentStreak)}%` }}
          />
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="p-4 rounded-lg bg-obsidian/50 border border-baked-clay/30 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-text-slate text-sm">Longest Streak</span>
            <span className="text-sand font-mono">{streakData.longestStreak} days</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-slate text-sm">Days This Week</span>
            <span className="text-sand font-mono">{streakData.totalDaysWorked} / 7</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-slate text-sm">Total Hours This Week</span>
            <span className="text-relic-gold font-mono">
              {weeklyHours.reduce((a, b) => a + b, 0).toFixed(1)}h
            </span>
          </div>
        </div>
      )}

      {/* Motivational Badges */}
      <div className="flex justify-center gap-3 mt-4">
        {streakData.currentStreak >= 3 && (
          <span className="text-2xl" title="3-day streak">🌱</span>
        )}
        {streakData.currentStreak >= 7 && (
          <span className="text-2xl" title="Week warrior">⚔️</span>
        )}
        {streakData.totalDaysWorked >= 5 && (
          <span className="text-2xl" title="5-day week">🏆</span>
        )}
      </div>
    </div>
  )
}

function getNextMilestone(current: number): number {
  const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365]
  return milestones.find(m => m > current) || current + 30
}

function getMilestoneProgress(current: number): number {
  const milestones = [0, 3, 7, 14, 21, 30, 60, 90, 180, 365]
  const nextIndex = milestones.findIndex(m => m > current)
  if (nextIndex === -1) return 100
  const prev = milestones[nextIndex - 1] || 0
  const next = milestones[nextIndex]
  return ((current - prev) / (next - prev)) * 100
}
