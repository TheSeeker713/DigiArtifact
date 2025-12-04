'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, differenceInMinutes, isAfter, isBefore, addMinutes } from 'date-fns'
import { useDynamicSchedule, formatBlockTime, ScheduleBlock, BlockType } from '@/hooks/useDynamicSchedule'
import { useGamification } from '@/contexts/GamificationContext'

interface BlockTimelineProps {
  startTime?: string
  carriedMinutes?: number
  onBlockComplete?: (block: ScheduleBlock, xp: number, milestone?: string) => void
}

// Confetti particle component
function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([])
  
  useEffect(() => {
    if (active) {
      const colors = ['#cca43b', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444']
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
      }))
      setParticles(newParticles)
      
      // Clear after animation
      const timer = setTimeout(() => setParticles([]), 3000)
      return () => clearTimeout(timer)
    }
  }, [active])
  
  if (!active || particles.length === 0) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// Weekly milestone modal
function WeeklyMilestoneModal({ 
  isOpen, 
  onClose, 
  milestoneName 
}: { 
  isOpen: boolean
  onClose: () => void
  milestoneName: string 
}) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-obsidian/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate to-obsidian border-2 border-relic-gold rounded-2xl max-w-md w-full p-8 animate-scale-up text-center">
        {/* Trophy animation */}
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-relic-gold/20 rounded-full animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl animate-bounce">🏆</span>
          </div>
        </div>
        
        <h2 className="font-display text-3xl font-bold text-relic-gold mb-2">
          Milestone Unlocked!
        </h2>
        
        <p className="text-xl text-sand mb-4">{milestoneName}</p>
        
        <div className="bg-relic-gold/10 border border-relic-gold/30 rounded-lg p-4 mb-6">
          <p className="text-relic-gold font-mono text-lg">+1000 XP</p>
          <p className="text-sand/60 text-sm mt-1">
            You've achieved 6 full days of completion!
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-relic-gold text-obsidian font-bold rounded-lg hover:bg-relic-gold/90 transition-colors"
          >
            Claim Reward
          </button>
        </div>
      </div>
    </div>
  )
}

// Individual block component
function TimelineBlock({
  block,
  isActive,
  onStart,
  onComplete,
  onSkip,
  onUpdateTime,
  isEditing,
  setIsEditing,
}: {
  block: ScheduleBlock
  isActive: boolean
  onStart: () => void
  onComplete: () => void
  onSkip: () => void
  onUpdateTime: (startTime: string, endTime: string) => void
  isEditing: string | null
  setIsEditing: (id: string | null) => void
}) {
  const [startTimeInput, setStartTimeInput] = useState(format(block.startTime, 'HH:mm'))
  const [endTimeInput, setEndTimeInput] = useState(format(block.endTime, 'HH:mm'))
  
  const isEditingThis = isEditing === block.id
  
  const getBlockStyles = () => {
    const baseStyles = "relative border-l-4 pl-6 pb-8 transition-all duration-300"
    
    switch (block.status) {
      case 'completed':
        return `${baseStyles} border-emerald-500`
      case 'in_progress':
        return `${baseStyles} border-relic-gold animate-pulse-subtle`
      case 'skipped':
        return `${baseStyles} border-slate/30 opacity-50`
      case 'partial':
        return `${baseStyles} border-amber-500`
      default:
        return `${baseStyles} border-slate/50`
    }
  }
  
  const getBlockTypeColor = (type: BlockType) => {
    switch (type) {
      case 'WORK': return 'bg-relic-gold/20 border-relic-gold text-relic-gold'
      case 'BREAK': return 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
      case 'LUNCH': return 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
      case 'FLEX': return 'bg-purple-500/20 border-purple-500 text-purple-400'
    }
  }
  
  const handleSaveTime = () => {
    onUpdateTime(startTimeInput, endTimeInput)
    setIsEditing(null)
  }
  
  return (
    <div className={getBlockStyles()}>
      {/* Timeline dot */}
      <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-2 ${
        block.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
        block.status === 'in_progress' ? 'bg-relic-gold border-relic-gold animate-pulse' :
        block.status === 'skipped' ? 'bg-slate/50 border-slate/50' :
        'bg-obsidian border-slate/50'
      }`}>
        {block.status === 'completed' && (
          <svg className="w-full h-full text-obsidian p-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        )}
      </div>
      
      {/* Block card */}
      <div className={`rounded-xl border p-4 ${
        block.status === 'in_progress' 
          ? 'bg-relic-gold/10 border-relic-gold shadow-lg shadow-relic-gold/20' 
          : block.status === 'completed'
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-slate/30 border-slate/20'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${getBlockTypeColor(block.type)}`}>
                {block.type}
              </span>
              {block.status === 'completed' && (
                <span className="text-emerald-400 text-sm">✓ Complete</span>
              )}
              {block.status === 'in_progress' && (
                <span className="text-relic-gold text-sm animate-pulse">● In Progress</span>
              )}
            </div>
            <h4 className="font-semibold text-sand">{block.label}</h4>
          </div>
          
          {/* XP badge if completed */}
          {block.xpEarned > 0 && (
            <div className="px-2 py-1 bg-relic-gold/20 rounded-lg">
              <span className="text-relic-gold font-mono text-sm">+{block.xpEarned} XP</span>
            </div>
          )}
        </div>
        
        {/* Time display / edit */}
        <div className="flex items-center gap-3 mb-3">
          {isEditingThis ? (
            <>
              <input
                type="time"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="px-2 py-1 bg-obsidian border border-relic-gold/50 rounded text-sand font-mono text-sm"
              />
              <span className="text-sand/50">→</span>
              <input
                type="time"
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
                className="px-2 py-1 bg-obsidian border border-relic-gold/50 rounded text-sand font-mono text-sm"
              />
              <button
                onClick={handleSaveTime}
                className="px-3 py-1 bg-relic-gold text-obsidian rounded text-sm font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(null)}
                className="px-3 py-1 bg-slate/50 text-sand rounded text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="text-sand/70 font-mono text-sm">
                {formatBlockTime(block.startTime)} - {formatBlockTime(block.endTime)}
              </span>
              <span className="text-sand/50 text-xs">
                ({block.durationMinutes}m)
              </span>
              {block.status === 'pending' && (
                <button
                  onClick={() => setIsEditing(block.id)}
                  className="text-sand/40 hover:text-relic-gold transition-colors"
                  title="Edit times"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Project (if assigned) */}
        {block.projectName && (
          <div className="flex items-center gap-2 mb-3 text-sm text-sand/60">
            <span className="w-2 h-2 rounded-full bg-relic-gold" />
            {block.projectName}
          </div>
        )}
        
        {/* Actions */}
        {block.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onStart}
              className="flex-1 py-2 bg-relic-gold/20 border border-relic-gold text-relic-gold rounded-lg hover:bg-relic-gold/30 transition-colors font-semibold text-sm"
            >
              Start Block
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sand/50 hover:text-red-400 transition-colors text-sm"
            >
              Skip
            </button>
          </div>
        )}
        
        {block.status === 'in_progress' && (
          <button
            onClick={onComplete}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity font-bold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Complete Block
          </button>
        )}
      </div>
    </div>
  )
}

export default function BlockTimeline({ 
  startTime = '08:00',
  carriedMinutes = 0,
  onBlockComplete,
}: BlockTimelineProps) {
  const { addXP } = useGamification()
  const {
    blocks,
    stats,
    schedule,
    updateBlock,
    completeBlock,
    skipBlock,
    startBlock,
    resetSchedule,
  } = useDynamicSchedule({ startTime, carriedMinutes })
  
  const [showConfetti, setShowConfetti] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [currentMilestone, setCurrentMilestone] = useState('')
  const [xpGained, setXpGained] = useState(0)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  
  // Day streak tracking (simulated - would come from API)
  const [streakDays, setStreakDays] = useState(5)
  const STREAK_TARGET = 6
  
  // Handle block completion with XP and confetti
  const handleCompleteBlock = useCallback((blockId: string) => {
    const result = completeBlock(blockId)
    
    // Award XP through gamification system
    addXP(result.xpEarned, result.milestone || 'Block completed')
    setXpGained(prev => prev + result.xpEarned)
    
    // Trigger confetti
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 100)
    
    // Check for weekly milestone
    const workBlocks = blocks.filter(b => b.type === 'WORK' || b.type === 'FLEX')
    const completedCount = workBlocks.filter(b => b.status === 'completed').length + 1
    
    if (completedCount === workBlocks.length) {
      // Full day completed - check streak
      const newStreak = streakDays + 1
      setStreakDays(newStreak)
      
      if (newStreak === STREAK_TARGET) {
        setCurrentMilestone('6-Day Champion')
        setShowMilestoneModal(true)
        addXP(1000, 'Weekly Milestone: 6-Day Champion')
      }
    }
    
    // Callback
    const block = blocks.find(b => b.id === blockId)
    if (block) {
      onBlockComplete?.(block, result.xpEarned, result.milestone)
    }
  }, [completeBlock, addXP, blocks, streakDays, onBlockComplete])
  
  // Handle time update
  const handleUpdateTime = useCallback((blockId: string, startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const today = new Date()
    today.setHours(startHour, startMin, 0, 0)
    const newStartTime = new Date(today)
    
    today.setHours(endHour, endMin, 0, 0)
    const newEndTime = new Date(today)
    
    updateBlock(blockId, { startTime: newStartTime, endTime: newEndTime })
  }, [updateBlock])
  
  // Calculate streak progress
  const streakProgress = (streakDays / STREAK_TARGET) * 100
  
  return (
    <div className="space-y-6">
      <Confetti active={showConfetti} />
      
      <WeeklyMilestoneModal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        milestoneName={currentMilestone}
      />
      
      {/* Day Streak Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-semibold text-sand">Day Streak Progress</h3>
              <p className="text-sm text-sand/60">{streakDays} / {STREAK_TARGET} days to milestone</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-relic-gold">{streakDays}</span>
            <span className="text-sand/50 text-sm ml-1">days</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-4 bg-slate rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-relic-gold to-amber-400 transition-all duration-500 relative"
            style={{ width: `${Math.min(streakProgress, 100)}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        
        {/* Milestone markers */}
        <div className="flex justify-between mt-2 text-xs text-sand/40">
          {[1, 2, 3, 4, 5, 6].map(day => (
            <div key={day} className={`flex flex-col items-center ${day <= streakDays ? 'text-relic-gold' : ''}`}>
              <span>{day === 6 ? '🏆' : day <= streakDays ? '✓' : '○'}</span>
              <span>{day}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-relic-gold">{stats.completedBlocks}</p>
          <p className="text-xs text-sand/60">of {stats.totalBlocks} Blocks</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-emerald-400">{Math.round(stats.progressPercent)}%</p>
          <p className="text-xs text-sand/60">Progress</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-cyan-400">{Math.floor(stats.completedWorkMinutes / 60)}h {stats.completedWorkMinutes % 60}m</p>
          <p className="text-xs text-sand/60">Completed</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-amber-400">+{xpGained}</p>
          <p className="text-xs text-sand/60">XP Earned</p>
        </div>
      </div>
      
      {/* On-track indicator */}
      <div className={`p-3 rounded-lg border ${
        stats.isOnTrack 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        <div className="flex items-center gap-2">
          {stats.isOnTrack ? (
            <>
              <span>✓</span>
              <span className="font-semibold">On Track!</span>
              <span className="text-sm opacity-70">Estimated completion: {formatBlockTime(stats.estimatedEndTime)}</span>
            </>
          ) : (
            <>
              <span>⚠️</span>
              <span className="font-semibold">Catching Up</span>
              <span className="text-sm opacity-70">{stats.remainingWorkMinutes}m remaining</span>
            </>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-relic-gold">Today's Schedule</h2>
          <button
            onClick={resetSchedule}
            className="text-sm text-sand/50 hover:text-relic-gold transition-colors"
          >
            Reset Schedule
          </button>
        </div>
        
        <div className="relative pl-4">
          {blocks.map((block, index) => (
            <TimelineBlock
              key={block.id}
              block={block}
              isActive={block.status === 'in_progress'}
              onStart={() => startBlock(block.id)}
              onComplete={() => handleCompleteBlock(block.id)}
              onSkip={() => skipBlock(block.id)}
              onUpdateTime={(start, end) => handleUpdateTime(block.id, start, end)}
              isEditing={editingBlock}
              setIsEditing={setEditingBlock}
            />
          ))}
        </div>
      </div>
      
      {/* Carry-over info if applicable */}
      {carriedMinutes > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-amber-400">
            <span>⏰</span>
            <span className="font-semibold">Carry-over from yesterday:</span>
            <span>{carriedMinutes} minutes added to today's schedule</span>
          </div>
        </div>
      )}
    </div>
  )
}
