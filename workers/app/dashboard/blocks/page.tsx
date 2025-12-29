'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/contexts/GamificationContext'
import BlockTimeline from '@/components/BlockTimeline'

// Block template definitions
const BLOCK_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Workday',
    description: '4 focus blocks with short breaks - classic 8-hour structure',
    icon: '💼',
    totalWork: 480,
    totalBreak: 60,
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Extended',
    description: '8 pomodoro sessions (25min work, 5min break)',
    icon: '🍅',
    totalWork: 200,
    totalBreak: 65,
  },
  {
    id: 'deep-work',
    name: 'Deep Work Day',
    description: '3 long focus sessions for complex work',
    icon: '🧠',
    totalWork: 480,
    totalBreak: 90,
  },
  {
    id: 'half-day',
    name: 'Flexible Half-Day',
    description: '4-hour flexible schedule',
    icon: '⏰',
    totalWork: 240,
    totalBreak: 30,
  },
]

interface CarryOverInfo {
  minutes: number
  reason: string
  fromDate: string
}

export default function BlockSchedulePage() {
  const { user } = useAuth()
  const { data: gamificationData, recordAction } = useGamification()
  
  // Schedule settings
  const [startTime, setStartTime] = useState('08:00')
  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Carry-over from previous day (would come from API/localStorage)
  const [carryOver, setCarryOver] = useState<CarryOverInfo | null>(null)
  
  // Daily stats - streakDays comes from gamification context
  const [dailyStats, setDailyStats] = useState({
    targetMinutes: 480,
    completedMinutes: 0,
    blocksCompleted: 0,
    blocksTotal: 4,
    xpEarnedToday: 0,
  })
  
  // Load carry-over from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('workers_schedule_carryover')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Only apply if from yesterday
        const carryDate = new Date(parsed.fromDate)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (carryDate.toDateString() === yesterday.toDateString()) {
          setCarryOver(parsed)
        } else {
          localStorage.removeItem('workers_schedule_carryover')
        }
      } catch {
        localStorage.removeItem('workers_schedule_carryover')
      }
    }
  }, [])
  
  // Handle block completion callback
  const handleBlockComplete = (block: any, xp: number, milestone?: string) => {
    setDailyStats(prev => ({
      ...prev,
      blocksCompleted: prev.blocksCompleted + 1,
      xpEarnedToday: prev.xpEarnedToday + xp,
    }))
    
    // Check if day is complete
    if (dailyStats.blocksCompleted + 1 >= dailyStats.blocksTotal) {
      // Full day completed! Clear any carry-over
      setCarryOver(null)
      localStorage.removeItem('workers_schedule_carryover')
    }
  }
  
  // Handle incomplete day (carry-over to next day)
  const handleDayIncomplete = (deficitMinutes: number) => {
    const carryInfo: CarryOverInfo = {
      minutes: deficitMinutes,
      reason: `Incomplete blocks from ${new Date().toLocaleDateString()}`,
      fromDate: new Date().toISOString(),
    }
    localStorage.setItem('workers_schedule_carryover', JSON.stringify(carryInfo))
  }
  
  // Clear carry-over manually
  const clearCarryOver = () => {
    setCarryOver(null)
    localStorage.removeItem('workers_schedule_carryover')
  }
  
  // Template display
  const currentTemplate = BLOCK_TEMPLATES.find(t => t.id === selectedTemplate)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-relic-gold">
            Block Schedule
          </h1>
          <p className="text-sand/60 mt-1">
            Structure your day with focused work blocks
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg border border-baked-clay/30 text-sand/60 hover:text-relic-gold hover:border-relic-gold/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className="btn-rune flex items-center gap-2"
          >
            <span>{currentTemplate?.icon}</span>
            <span className="hidden md:inline">{currentTemplate?.name}</span>
            <span className="md:hidden">Template</span>
          </button>
        </div>
      </div>
      
      {/* Carry-over warning */}
      {carryOver && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="font-semibold text-amber-400">
                Carry-over: +{carryOver.minutes} minutes
              </p>
              <p className="text-sm text-sand/60">{carryOver.reason}</p>
            </div>
          </div>
          <button
            onClick={clearCarryOver}
            className="px-3 py-1 text-sm text-sand/50 hover:text-red-400 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Settings panel */}
      {showSettings && (
        <div className="card animate-slide-up">
          <h3 className="font-display text-lg text-relic-gold mb-4">Schedule Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-sand/60 mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-sand/60 mb-2">Target Work Hours</label>
              <select
                value={dailyStats.targetMinutes}
                onChange={(e) => setDailyStats(prev => ({ ...prev, targetMinutes: parseInt(e.target.value) }))}
                className="input-field"
              >
                <option value="240">4 hours</option>
                <option value="360">6 hours</option>
                <option value="480">8 hours (Standard)</option>
                <option value="600">10 hours</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Template selector */}
      {showTemplateSelector && (
        <div className="card animate-slide-up">
          <h3 className="font-display text-lg text-relic-gold mb-4">Choose a Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BLOCK_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id)
                  setShowTemplateSelector(false)
                }}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedTemplate === template.id
                    ? 'border-relic-gold bg-relic-gold/10'
                    : 'border-baked-clay/30 hover:border-relic-gold/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sand">{template.name}</h4>
                    <p className="text-sm text-sand/50 mt-1">{template.description}</p>
                    <div className="flex gap-4 mt-2 text-xs font-mono">
                      <span className="text-relic-gold">{Math.floor(template.totalWork / 60)}h work</span>
                      <span className="text-emerald-400">{template.totalBreak}m breaks</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Main timeline */}
      <BlockTimeline
        startTime={startTime}
        carriedMinutes={carryOver?.minutes || 0}
        onBlockComplete={handleBlockComplete}
      />
      
      {/* Gamification summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-relic-gold">Today's Progress</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-sand/60">Level {gamificationData.level}</span>
            <span className="px-2 py-1 bg-relic-gold/20 rounded text-relic-gold text-sm font-mono">
              {gamificationData.levelTitle}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate/30 rounded-lg">
            <p className="text-2xl font-bold text-relic-gold">{dailyStats.xpEarnedToday}</p>
            <p className="text-xs text-sand/60">XP Today</p>
          </div>
          <div className="text-center p-3 bg-slate/30 rounded-lg">
            <p className="text-2xl font-bold text-emerald-400">{dailyStats.blocksCompleted}/{dailyStats.blocksTotal}</p>
            <p className="text-xs text-sand/60">Blocks</p>
          </div>
          <div className="text-center p-3 bg-slate/30 rounded-lg">
            <p className="text-2xl font-bold text-amber-400">{gamificationData.currentStreak}</p>
            <p className="text-xs text-sand/60">Day Streak</p>
          </div>
          <div className="text-center p-3 bg-slate/30 rounded-lg">
            <p className="text-2xl font-bold text-cyan-400">{gamificationData.totalXP}</p>
            <p className="text-xs text-sand/60">Total XP</p>
          </div>
        </div>
        
        {/* XP Progress to next level */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-sand/60 mb-1">
            <span>Level {gamificationData.level}</span>
            <span>{gamificationData.currentLevelXP} / {gamificationData.nextLevelXP} XP</span>
          </div>
          <div className="h-2 bg-slate rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-relic-gold to-amber-500 transition-all duration-500"
              style={{ width: `${(gamificationData.currentLevelXP / gamificationData.nextLevelXP) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Milestone hints */}
      <div className="card">
        <h3 className="font-display text-lg text-relic-gold mb-4">Upcoming Milestones</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className="font-semibold text-sand">Complete All Blocks</p>
                <p className="text-xs text-sand/50">Finish all 4 work blocks today</p>
              </div>
            </div>
            <span className="text-relic-gold font-mono">+300 XP</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <p className="font-semibold text-sand">7-Day Champion</p>
                <p className="text-xs text-sand/50">{Math.max(0, 7 - gamificationData.currentStreak)} more days of full completion</p>
              </div>
            </div>
            <span className="text-relic-gold font-mono">+1000 XP</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <div>
                <p className="font-semibold text-sand">Weekly 40h Goal</p>
                <p className="text-xs text-sand/50">Complete 40 hours this week</p>
              </div>
            </div>
            <span className="text-relic-gold font-mono">+500 XP</span>
          </div>
        </div>
      </div>
    </div>
  )
}
