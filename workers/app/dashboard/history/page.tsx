'use client'

import { useState, useEffect } from 'react'
import { useAuth, TimeEntry } from '@/contexts/AuthContext'
import { format, parseISO, differenceInMinutes, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns'
import Cookies from 'js-cookie'

export default function HistoryPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [editNotes, setEditNotes] = useState('')

  const currentWeekStart = startOfWeek(subWeeks(new Date(), -weekOffset))
  const currentWeekEnd = endOfWeek(subWeeks(new Date(), -weekOffset))

  useEffect(() => {
    fetchEntries()
  }, [weekOffset])

  const fetchEntries = async () => {
    setIsLoading(true)
    try {
      const token = Cookies.get('workers_token')
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(currentWeekEnd, 'yyyy-MM-dd')
      
      const response = await fetch(`https://digiartifact-workers-api.digitalartifact11.workers.dev/api/entries?start=${startDate}&end=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (clockIn: string, clockOut: string | null, breakMinutes: number) => {
    if (!clockOut) return 'In Progress'
    
    const minutes = differenceInMinutes(parseISO(clockOut), parseISO(clockIn)) - breakMinutes
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    return `${hours}h ${mins}m`
  }

  const totalWeeklyMinutes = entries.reduce((total, entry) => {
    if (!entry.clock_out) return total
    const minutes = differenceInMinutes(parseISO(entry.clock_out), parseISO(entry.clock_in)) - entry.break_minutes
    return total + minutes
  }, 0)

  const totalWeeklyHours = Math.floor(totalWeeklyMinutes / 60)
  const totalWeeklyMins = totalWeeklyMinutes % 60

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = format(parseISO(entry.clock_in), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-sand mb-2">Time History</h1>
          <p className="text-text-slate font-mono text-sm">
            View and manage your past time entries
          </p>
        </div>
        <div className="text-right">
          <p className="text-relic-gold font-mono text-2xl">
            {totalWeeklyHours}h {totalWeeklyMins}m
          </p>
          <p className="text-text-slate text-xs font-mono">Week Total</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="btn-hologram px-4 py-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <p className="font-heading text-lg text-sand">
              {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
            </p>
            {weekOffset === 0 && (
              <p className="text-hologram-cyan text-xs font-mono">Current Week</p>
            )}
          </div>
          
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="btn-hologram px-4 py-2 disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-relic-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(entriesByDate).length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-text-slate/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-text-slate font-mono">No entries for this week</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(entriesByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayEntries]) => (
              <div key={date} className="card">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-baked-clay/30">
                  <h3 className="font-heading text-lg text-sand">
                    {format(parseISO(date), 'EEEE, MMMM d')}
                  </h3>
                  <p className="text-relic-gold font-mono">
                    {(() => {
                      const dayMinutes = dayEntries.reduce((total, entry) => {
                        if (!entry.clock_out) return total
                        return total + differenceInMinutes(parseISO(entry.clock_out), parseISO(entry.clock_in)) - entry.break_minutes
                      }, 0)
                      return `${Math.floor(dayMinutes / 60)}h ${dayMinutes % 60}m`
                    })()}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg border border-baked-clay/20 hover:border-relic-gold/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {entry.project_color && (
                          <div
                            className="w-1 h-12 rounded-full"
                            style={{ backgroundColor: entry.project_color }}
                          />
                        )}
                        <div>
                          <p className="text-sand font-medium">
                            {entry.project_name || 'No Project'}
                          </p>
                          <p className="text-text-slate text-sm font-mono">
                            {format(parseISO(entry.clock_in), 'h:mm a')}
                            {entry.clock_out && ` → ${format(parseISO(entry.clock_out), 'h:mm a')}`}
                          </p>
                          {entry.notes && (
                            <p className="text-text-slate/70 text-xs mt-1 italic">
                              "{entry.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-mono text-lg ${entry.clock_out ? 'text-relic-gold' : 'text-status-active'}`}>
                          {formatDuration(entry.clock_in, entry.clock_out, entry.break_minutes)}
                        </p>
                        {entry.break_minutes > 0 && (
                          <p className="text-status-break text-xs font-mono">
                            {entry.break_minutes}m break
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
