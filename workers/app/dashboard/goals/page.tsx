'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/contexts/GamificationContext'
import { useTodayEntries, useWeeklyStats } from '@/hooks/useTimeEntries'
import { useProjects } from '@/hooks/useProjects'

type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'custom'
type GoalType = 'total' | 'project'

interface Goal {
  id: string
  type: GoalType
  period: GoalPeriod
  targetHours: number
  projectId?: string
  projectName?: string
  currentHours: number
  startDate: string
  endDate?: string
  streak: number
  isActive: boolean
}

interface GoalTemplate {
  id: string
  name: string
  period: GoalPeriod
  targetHours: number
  icon: string
  description: string
}

const goalTemplates: GoalTemplate[] = [
  { id: 'full-time', name: 'Full-Time Week', period: 'weekly', targetHours: 40, icon: '💼', description: 'Standard 40-hour work week' },
  { id: 'part-time', name: 'Part-Time Week', period: 'weekly', targetHours: 20, icon: '⏰', description: '20 hours per week' },
  { id: 'overtime', name: 'Overtime Push', period: 'weekly', targetHours: 50, icon: '🔥', description: 'Push for 50 hours this week' },
  { id: 'daily-focus', name: 'Daily Focus', period: 'daily', targetHours: 8, icon: '🎯', description: '8 productive hours daily' },
  { id: 'balanced', name: 'Work-Life Balance', period: 'weekly', targetHours: 35, icon: '⚖️', description: 'Balanced 35-hour week' },
]

export default function GoalsPage() {
  const { } = useAuth()
  const { data: weeklyStats } = useWeeklyStats()
  const { data: projects = [] } = useProjects()
  const { data: todayEntries = [] } = useTodayEntries()
  const weeklyHours = weeklyStats?.hours || [0, 0, 0, 0, 0, 0, 0]
  const { recordAction } = useGamification()
  
  // Calculate total weekly hours from array
  const totalWeeklyHours = Array.isArray(weeklyHours) 
    ? weeklyHours.reduce((sum, h) => sum + h, 0) 
    : weeklyHours
  
  // Calculate today's hours from entries
  const todayHours = todayEntries.reduce((sum, e) => {
    if (e.clock_in && e.clock_out) {
      const start = new Date(e.clock_in).getTime()
      const end = new Date(e.clock_out).getTime()
      const hours = (end - start) / (1000 * 60 * 60) - (e.break_minutes || 0) / 60
      return sum + Math.max(0, hours)
    }
    return sum
  }, 0)
  
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      type: 'total',
      period: 'weekly',
      targetHours: 40,
      currentHours: totalWeeklyHours,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      streak: 5,
      isActive: true
    },
    {
      id: '2',
      type: 'project',
      period: 'weekly',
      targetHours: 15,
      projectId: '1',
      projectName: 'Website Redesign',
      currentHours: 8.5,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      streak: 2,
      isActive: true
    },
    {
      id: '3',
      type: 'total',
      period: 'daily',
      targetHours: 8,
      currentHours: todayHours,
      startDate: new Date().toISOString(),
      streak: 12,
      isActive: true
    }
  ])
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'total',
    period: 'weekly',
    targetHours: 40,
    isActive: true
  })

  const updateGoals = useCallback(() => {
    setGoals(prev => prev.map(goal => ({
      ...goal,
      currentHours: goal.type === 'total' 
        ? (goal.period === 'daily' ? todayHours : totalWeeklyHours)
        : goal.currentHours
    })))
  }, [totalWeeklyHours, todayHours])

  // Calculate progress for each goal
  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const progress = (goal.currentHours / goal.targetHours) * 100
      const remaining = Math.max(0, goal.targetHours - goal.currentHours)
      const isAhead = goal.currentHours >= goal.targetHours * 0.8 // At least 80% complete
      const isComplete = goal.currentHours >= goal.targetHours
      const isOvertime = goal.currentHours > goal.targetHours
      
      return { ...goal, progress, remaining, isAhead, isComplete, isOvertime }
    })
  }, [goals])

  // Calculate overall stats
  const stats = useMemo(() => {
    const activeGoals = goalsWithProgress.filter(g => g.isActive)
    const completedGoals = activeGoals.filter(g => g.isComplete)
    const averageProgress = activeGoals.length > 0
      ? activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length
      : 0
    const longestStreak = Math.max(...goals.map(g => g.streak), 0)
    
    return {
      total: activeGoals.length,
      completed: completedGoals.length,
      averageProgress,
      longestStreak
    }
  }, [goalsWithProgress, goals])

  const createGoal = () => {
    const goal: Goal = {
      id: Date.now().toString(),
      type: newGoal.type || 'total',
      period: newGoal.period || 'weekly',
      targetHours: newGoal.targetHours || 40,
      projectId: newGoal.projectId,
      projectName: newGoal.projectName,
      currentHours: 0,
      startDate: new Date().toISOString(),
      streak: 0,
      isActive: true
    }
    
    setGoals(prev => [...prev, goal])
    setShowCreateModal(false)
    setNewGoal({ type: 'total', period: 'weekly', targetHours: 40, isActive: true })
    recordAction('GOAL_CREATED', { reason: 'Created new goal' })
  }

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => 
      g.id === id ? { ...g, isActive: !g.isActive } : g
    ))
  }

  const applyTemplate = (template: GoalTemplate) => {
    setNewGoal({
      type: 'total',
      period: template.period,
      targetHours: template.targetHours,
      isActive: true
    })
    setShowCreateModal(true)
  }

  const getProgressColor = (progress: number, isOvertime: boolean) => {
    if (isOvertime) return 'from-red-500 to-red-600'
    if (progress >= 100) return 'from-emerald-500 to-emerald-600'
    if (progress >= 80) return 'from-green-500 to-green-600'
    if (progress >= 50) return 'from-amber-500 to-amber-600'
    return 'from-relic-gold to-amber-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-relic-gold">
            Goals & Targets
          </h1>
          <p className="text-sand/60 mt-1">
            Set targets, track progress, and build consistency
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-rune flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Goal
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-relic-gold">{stats.total}</p>
          <p className="text-xs text-sand/60 mt-1">Active Goals</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
          <p className="text-xs text-sand/60 mt-1">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-400">{Math.round(stats.averageProgress)}%</p>
          <p className="text-xs text-sand/60 mt-1">Avg Progress</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-400">{stats.longestStreak}</p>
          <p className="text-xs text-sand/60 mt-1 flex items-center justify-center gap-1">
            <span className="text-orange-500">🔥</span> Best Streak
          </p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-relic-gold mb-4">
          Quick Templates
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {goalTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className="p-4 rounded-lg border border-baked-clay/20 bg-slate/20 hover:bg-slate/40 hover:border-relic-gold/30 transition-all text-center group"
            >
              <span className="text-2xl">{template.icon}</span>
              <p className="text-sm font-semibold text-sand mt-2">{template.name}</p>
              <p className="text-xs text-sand/50">{template.targetHours}h/{template.period}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Goals */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-relic-gold mb-4">
          Active Goals
        </h2>
        
        {goalsWithProgress.filter(g => g.isActive).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-sand/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-sand/60">No active goals yet</p>
            <p className="text-sand/40 text-sm mt-1">Create a goal to start tracking your progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goalsWithProgress.filter(g => g.isActive).map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border ${
                  goal.isComplete 
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : goal.isOvertime
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-baked-clay/20 bg-slate/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {goal.isComplete && <span className="text-emerald-400">✓</span>}
                      {goal.isOvertime && <span className="text-red-400">⚠️</span>}
                      <div>
                        <h3 className="font-semibold text-sand">
                          {goal.type === 'project' ? goal.projectName : 'Total Hours'}
                          <span className="ml-2 text-xs font-mono text-sand/50 capitalize">
                            ({goal.period})
                          </span>
                        </h3>
                        <p className="text-sm text-sand/60">
                          {goal.currentHours.toFixed(1)}h / {goal.targetHours}h
                          {goal.remaining > 0 && (
                            <span className="ml-2 text-sand/40">
                              ({goal.remaining.toFixed(1)}h remaining)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-3 bg-slate rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getProgressColor(goal.progress, goal.isOvertime)} transition-all duration-500`}
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-xs">
                        <span className={`font-mono ${goal.isComplete ? 'text-emerald-400' : 'text-sand/50'}`}>
                          {Math.round(goal.progress)}%
                        </span>
                        {goal.streak > 0 && (
                          <span className="flex items-center gap-1 text-orange-400">
                            🔥 {goal.streak} streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="p-2 text-sand/50 hover:text-sand transition-colors"
                      title="Pause goal"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 text-sand/50 hover:text-red-400 transition-colors"
                      title="Delete goal"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paused Goals */}
      {goalsWithProgress.filter(g => !g.isActive).length > 0 && (
        <div className="card opacity-75">
          <h2 className="font-display text-lg font-semibold text-sand/60 mb-4">
            Paused Goals
          </h2>
          <div className="space-y-3">
            {goalsWithProgress.filter(g => !g.isActive).map((goal) => (
              <div
                key={goal.id}
                className="p-3 rounded-lg border border-baked-clay/10 bg-slate/10 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm text-sand/60">
                    {goal.type === 'project' ? goal.projectName : 'Total Hours'}
                    <span className="ml-2 text-xs font-mono text-sand/40 capitalize">
                      ({goal.period})
                    </span>
                  </h3>
                  <p className="text-xs text-sand/40">
                    {goal.currentHours.toFixed(1)}h / {goal.targetHours}h
                  </p>
                </div>
                <button
                  onClick={() => toggleGoal(goal.id)}
                  className="px-3 py-1 text-xs bg-relic-gold/20 text-relic-gold rounded-md hover:bg-relic-gold/30 transition-colors"
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streak History Calendar */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-relic-gold mb-4">
          Weekly Goal Progress
        </h2>
        <p className="text-sm text-sand/60 mb-4">
          Track your goal completion over the past 4 weeks
        </p>
        
        {/* Weekly grid - 4 weeks x 7 days */}
        <div className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-8 gap-1">
            <div className="text-xs text-sand/40 font-mono"></div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={i} className="text-center text-xs text-sand/40 font-mono">
                {day}
              </div>
            ))}
          </div>
          
          {/* Week rows */}
          {Array.from({ length: 4 }).map((_, weekIndex) => {
            const weekLabel = weekIndex === 0 ? 'This week' : 
                             weekIndex === 1 ? 'Last week' : 
                             `${weekIndex + 1} weeks ago`
            
            return (
              <div key={weekIndex} className="grid grid-cols-8 gap-1 items-center">
                <div className="text-xs text-sand/40 font-mono truncate" title={weekLabel}>
                  {weekIndex === 0 ? 'This' : weekIndex === 1 ? 'Last' : `-${weekIndex}w`}
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  // For current week, use actual weeklyHours data
                  // weeklyHours is [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
                  const today = new Date()
                  const currentDayOfWeek = today.getDay() // 0 = Sunday
                  const adjustedDayIndex = dayIndex // Mon = 0 in our display
                  
                  let hasActivity = false
                  let metGoal = false
                  let isFuture = false
                  
                  if (weekIndex === 0) {
                    // This week - use actual data
                    const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
                    
                    if (adjustedDayIndex > todayIndex) {
                      isFuture = true
                    } else {
                      const hoursWorked = weeklyHours[adjustedDayIndex] || 0
                      hasActivity = hoursWorked > 0
                      // Goal met if worked at least 6 hours (configurable)
                      metGoal = hoursWorked >= 6
                    }
                  } else {
                    // Past weeks - show based on localStorage history if available
                    // For now, leave empty (would be populated from API)
                    hasActivity = false
                    metGoal = false
                  }
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`aspect-square rounded-md flex items-center justify-center transition-all ${
                        isFuture
                          ? 'bg-slate/10 border border-dashed border-slate/20'
                          : metGoal
                          ? 'bg-emerald-500/50 border border-emerald-500/30'
                          : hasActivity
                          ? 'bg-amber-500/30 border border-amber-500/20'
                          : 'bg-slate/20 border border-slate/10'
                      }`}
                      title={isFuture ? 'Upcoming' : metGoal ? 'Goal met!' : hasActivity ? 'Worked' : 'No activity'}
                    >
                      {metGoal && <span className="text-emerald-300 text-sm">✓</span>}
                      {hasActivity && !metGoal && <span className="text-amber-300/70 text-[10px]">●</span>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-sand/60">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate/20 border border-slate/10" />
            No activity
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/20" />
            Worked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500/30" />
            Goal met (6h+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate/10 border border-dashed border-slate/20" />
            Upcoming
          </span>
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate border border-baked-clay/30 rounded-xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-relic-gold">
                Create New Goal
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-sand/50 hover:text-sand transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Goal Type */}
              <div>
                <label className="block text-sm font-semibold text-sand mb-2">Goal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewGoal(prev => ({ ...prev, type: 'total', projectId: undefined, projectName: undefined }))}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      newGoal.type === 'total'
                        ? 'border-relic-gold bg-relic-gold/10 text-relic-gold'
                        : 'border-baked-clay/30 text-sand/60 hover:border-relic-gold/50'
                    }`}
                  >
                    Total Hours
                  </button>
                  <button
                    onClick={() => setNewGoal(prev => ({ ...prev, type: 'project' }))}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      newGoal.type === 'project'
                        ? 'border-relic-gold bg-relic-gold/10 text-relic-gold'
                        : 'border-baked-clay/30 text-sand/60 hover:border-relic-gold/50'
                    }`}
                  >
                    Per Project
                  </button>
                </div>
              </div>

              {/* Project Selection (if project type) */}
              {newGoal.type === 'project' && (
                <div>
                  <label className="block text-sm font-semibold text-sand mb-2">Project</label>
                  <select
                    value={newGoal.projectId || ''}
                    onChange={(e) => {
                      const project = projects.find(p => String(p.id) === e.target.value)
                      setNewGoal(prev => ({
                        ...prev,
                        projectId: e.target.value,
                        projectName: project?.name
                      }))
                    }}
                    className="input-field"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={String(project.id)}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Period */}
              <div>
                <label className="block text-sm font-semibold text-sand mb-2">Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as GoalPeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setNewGoal(prev => ({ ...prev, period }))}
                      className={`p-3 rounded-lg border text-center text-sm transition-all ${
                        newGoal.period === period
                          ? 'border-relic-gold bg-relic-gold/10 text-relic-gold'
                          : 'border-baked-clay/30 text-sand/60 hover:border-relic-gold/50'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Hours */}
              <div>
                <label className="block text-sm font-semibold text-sand mb-2">
                  Target Hours
                </label>
                <input
                  type="number"
                  value={newGoal.targetHours || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetHours: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="Enter target hours"
                  min="1"
                  max="168"
                />
                <p className="text-xs text-sand/40 mt-1">
                  {newGoal.period === 'daily' && 'Max 24 hours per day'}
                  {newGoal.period === 'weekly' && 'Standard full-time: 40h'}
                  {newGoal.period === 'monthly' && 'Standard full-time: ~173h'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-slate/50 text-sand rounded-lg hover:bg-slate/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createGoal}
                disabled={!newGoal.targetHours || (newGoal.type === 'project' && !newGoal.projectId)}
                className="flex-1 btn-rune disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
