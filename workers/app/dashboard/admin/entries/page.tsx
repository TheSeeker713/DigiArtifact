'use client'

import { useState, useEffect } from 'react'
import { useAuth, TimeEntry } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import Cookies from 'js-cookie'

interface AdminTimeEntry extends TimeEntry {
  user_name: string
  user_email: string
}

export default function AdminEntriesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<AdminTimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState({ user: '', project: '', date: '' })
  const [editingEntry, setEditingEntry] = useState<AdminTimeEntry | null>(null)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    } else {
      fetchEntries()
    }
  }, [user, router])

  const fetchEntries = async () => {
    setIsLoading(true)
    try {
      const token = Cookies.get('workers_token')
      const params = new URLSearchParams()
      if (filter.user) params.append('user', filter.user)
      if (filter.project) params.append('project', filter.project)
      if (filter.date) params.append('date', filter.date)
      
      const response = await fetch(`/api/admin/entries?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
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

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    
    try {
      const token = Cookies.get('workers_token')
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (response.ok) {
        await fetchEntries()
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-sand mb-2">All Time Entries</h1>
        <p className="text-text-slate font-mono text-sm">
          View and manage all team member time entries
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-text-slate mb-1">Filter by User</label>
            <input
              type="text"
              value={filter.user}
              onChange={(e) => setFilter({ ...filter, user: e.target.value })}
              className="input-field text-sm"
              placeholder="Search user..."
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-slate mb-1">Filter by Project</label>
            <input
              type="text"
              value={filter.project}
              onChange={(e) => setFilter({ ...filter, project: e.target.value })}
              className="input-field text-sm"
              placeholder="Search project..."
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-slate mb-1">Filter by Date</label>
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchEntries}
              className="btn-rune w-full"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-relic-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-text-slate/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-text-slate font-mono">No entries found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-baked-clay/30">
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">User</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Project</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Date</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Time</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Duration</th>
                <th className="text-left py-4 px-4 font-mono text-sm text-text-slate">Notes</th>
                <th className="text-right py-4 px-4 font-mono text-sm text-text-slate">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-baked-clay/20 hover:bg-obsidian/50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sand text-sm">{entry.user_name}</p>
                      <p className="text-text-slate text-xs font-mono">{entry.user_email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {entry.project_color && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: entry.project_color }}
                        />
                      )}
                      <span className="text-sand text-sm">{entry.project_name || 'No Project'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-text-slate text-sm font-mono">
                      {format(parseISO(entry.clock_in), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-text-slate text-sm font-mono">
                      {format(parseISO(entry.clock_in), 'h:mm a')}
                      {entry.clock_out && ` - ${format(parseISO(entry.clock_out), 'h:mm a')}`}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-mono text-sm ${entry.clock_out ? 'text-relic-gold' : 'text-status-active'}`}>
                      {formatDuration(entry.clock_in, entry.clock_out, entry.break_minutes)}
                    </span>
                    {entry.break_minutes > 0 && (
                      <span className="text-status-break text-xs ml-2">
                        ({entry.break_minutes}m break)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 max-w-[200px]">
                    <span className="text-text-slate text-xs truncate block">
                      {entry.notes || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-relic-gold hover:text-hologram-cyan transition-colors text-sm font-mono"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-status-offline hover:text-status-offline/70 transition-colors text-sm font-mono"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Entry Modal (placeholder) */}
      {editingEntry && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-heading text-xl text-relic-gold mb-6">Edit Time Entry</h3>
            <p className="text-text-slate text-sm mb-4">
              Entry #{editingEntry.id} by {editingEntry.user_name}
            </p>
            {/* Add edit form fields here */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditingEntry(null)}
                className="btn-hologram flex-1"
              >
                Cancel
              </button>
              <button className="btn-rune flex-1">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
