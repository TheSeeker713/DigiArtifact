'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTodayEntries, useClockStatus } from '@/hooks/useTimeEntries'
import { useProjects } from '@/hooks/useProjects'
import { useSettings } from '@/contexts/SettingsContext'
import { useGamification } from '@/contexts/GamificationContext'

interface AgendaItem {
  id: string
  type: 'shift' | 'task' | 'reminder'
  title: string
  time?: string
  duration?: number // minutes
  completed: boolean
  color?: string
}

export default function TodaysAgenda() {
  const { } = useAuth()
  const { data: clockData } = useClockStatus()
  const { data: todayEntries = [] } = useTodayEntries()
  const { data: projects = [] } = useProjects()
  const clockStatus = clockData?.status || 'clocked-out'
  const { formatTime, formatDate } = useSettings()
  const { addXP } = useGamification()
  const [tasks, setTasks] = useState<AgendaItem[]>([])
  const [newTask, setNewTask] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)

  // Load tasks from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const saved = localStorage.getItem(`workers_agenda_${today}`)
    if (saved) {
      try {
        setTasks(JSON.parse(saved))
      } catch {
        setTasks([])
      }
    }
  }, [])

  // Save tasks to localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`workers_agenda_${today}`, JSON.stringify(tasks))
  }, [tasks])

  // Create agenda items from entries and tasks
  const agendaItems: AgendaItem[] = [
    // Work entries from today
    ...todayEntries.map((entry) => ({
      id: `entry-${entry.id}`,
      type: 'shift' as const,
      title: entry.project_name || 'Work Session',
      time: formatTime(entry.clock_in),
      duration: entry.clock_out 
        ? Math.round((new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 60000 - (entry.break_minutes || 0))
        : undefined,
      completed: !!entry.clock_out,
      color: entry.project_color,
    })),
    // User tasks
    ...tasks,
  ]

  const addTask = () => {
    if (!newTask.trim()) return
    
    const task: AgendaItem = {
      id: `task-${Date.now()}`,
      type: 'task',
      title: newTask.trim(),
      completed: false,
    }
    
    setTasks(prev => [...prev, task])
    setNewTask('')
    setShowAddTask(false)
  }

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed
        // Award XP only when completing (not unchecking)
        if (newCompleted && !t.completed) {
          addXP(15, 'Task Completed')
        }
        return { ...t, completed: newCompleted }
      }
      return t
    }))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask()
    } else if (e.key === 'Escape') {
      setShowAddTask(false)
      setNewTask('')
    }
  }

  const completedCount = agendaItems.filter(item => item.completed).length
  const totalCount = agendaItems.length

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getTypeIcon = (type: AgendaItem['type']) => {
    switch (type) {
      case 'shift': return '⏰'
      case 'task': return '✓'
      case 'reminder': return '🔔'
    }
  }

  return (
    <div className="card relative">
      {/* Glass Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-screen bg-repeat" style={{ backgroundImage: 'url(/glass_tiled.webp)' }} />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-lg text-sand">Today&apos;s Agenda</h3>
          <p className="text-text-slate text-xs font-mono">{formatDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-slate">
            {completedCount}/{totalCount}
          </span>
          <div className="w-12 h-2 bg-obsidian/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-relic-gold transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Current Status */}
      {clockStatus !== 'clocked-out' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-status-active/10 border border-status-active/30 mb-4">
          <div className="w-3 h-3 rounded-full bg-status-active animate-pulse" />
          <span className="text-status-active text-sm font-mono">
            {clockStatus === 'on-break' ? 'Currently on break' : 'Currently working'}
          </span>
        </div>
      )}

      {/* Agenda Items */}
      {agendaItems.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl">📋</span>
          <p className="text-text-slate text-sm mt-2">Nothing scheduled yet</p>
          <p className="text-text-slate/60 text-xs">Add tasks or clock in to start your day!</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {agendaItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                item.completed 
                  ? 'bg-obsidian/20 border border-baked-clay/10' 
                  : 'bg-obsidian/40 border border-baked-clay/30'
              }`}
            >
              {/* Checkbox for tasks */}
              {item.type === 'task' ? (
                <button
                  onClick={() => toggleTask(item.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.completed 
                      ? 'bg-relic-gold border-relic-gold' 
                      : 'border-baked-clay/50 hover:border-relic-gold'
                  }`}
                >
                  {item.completed && (
                    <svg className="w-3 h-3 text-obsidian" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ) : (
                <span className="text-lg w-5 text-center">{getTypeIcon(item.type)}</span>
              )}
              
              {/* Color indicator for shifts */}
              {item.color && (
                <div 
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.completed ? 'text-text-slate/50 line-through' : 'text-sand'}`}>
                  {item.title}
                </p>
                {(item.time || item.duration) && (
                  <p className="text-xs text-text-slate/60 font-mono">
                    {item.time && <span>{item.time}</span>}
                    {item.time && item.duration && <span> · </span>}
                    {item.duration && <span>{formatDuration(item.duration)}</span>}
                  </p>
                )}
              </div>

              {/* Delete for tasks only */}
              {item.type === 'task' && (
                <button
                  onClick={() => deleteTask(item.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-text-slate/50 hover:text-red-400 transition-all"
                  aria-label="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Task */}
      {showAddTask ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Add a task..."
            className="input-field flex-1 text-sm"
            autoFocus
          />
          <button
            onClick={addTask}
            disabled={!newTask.trim()}
            className="px-3 py-2 rounded-lg bg-relic-gold/20 text-relic-gold border border-relic-gold/50 hover:bg-relic-gold/30 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAddTask(false); setNewTask('') }}
            className="px-3 py-2 rounded-lg bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-baked-clay/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddTask(true)}
          className="w-full py-2 text-sm text-text-slate hover:text-relic-gold font-mono flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      )}
    </div>
  )
}
