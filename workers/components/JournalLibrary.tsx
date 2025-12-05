'use client'

import { useState, useMemo } from 'react'
import { JournalEntry, JournalEntrySource, getSourceLabel, getSourceIcon } from '@/contexts/JournalContext'

interface JournalLibraryProps {
  entries: JournalEntry[]
  onEdit: (entry: JournalEntry) => void
  onDelete: (id: string) => void
  onExport: (entry: JournalEntry) => void
}

const sourceColors: Record<JournalEntrySource, string> = {
  quick_note: 'bg-amber-500/20 text-amber-400',
  journal_editor: 'bg-purple-500/20 text-purple-400',
  clock_note: 'bg-green-500/20 text-green-400',
  block_note: 'bg-blue-500/20 text-blue-400',
  goal_note: 'bg-pink-500/20 text-pink-400',
  project_note: 'bg-cyan-500/20 text-cyan-400',
}

export default function JournalLibrary({ entries, onEdit, onDelete, onExport }: JournalLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSource, setFilterSource] = useState<JournalEntrySource | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  const filteredEntries = useMemo(() => {
    let result = [...entries]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(entry => 
        entry.content.toLowerCase().includes(query) ||
        entry.title?.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by source
    if (filterSource !== 'all') {
      result = result.filter(entry => entry.source === filterSource)
    }

    // Sort
    result.sort((a, b) => {
      const dateA = a.createdAt
      const dateB = b.createdAt
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [entries, searchQuery, filterSource, sortOrder])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getPreview = (entry: JournalEntry) => {
    // Strip HTML tags and get first 150 characters
    const text = entry.richContent 
      ? entry.richContent.replace(/<[^>]*>/g, '') 
      : entry.content
    return text.length > 150 ? text.substring(0, 150) + '...' : text
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">Your Journal is Empty</h3>
        <p className="text-slate-500 max-w-md">
          Start writing entries using the Editor tab, or your Quick Notes will automatically be archived here.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
        </div>

        {/* Source Filter */}
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as JournalEntrySource | 'all')}
          className="px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        >
          <option value="all">All Sources</option>
          <option value="quick_note">Quick Notes</option>
          <option value="journal_editor">Journal Entries</option>
          <option value="clock_note">Clock Notes</option>
          <option value="block_note">Block Notes</option>
          <option value="goal_note">Goal Notes</option>
          <option value="project_note">Project Notes</option>
        </select>

        {/* Sort Order */}
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600/50 transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform ${sortOrder === 'oldest' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {/* Results Count */}
      <div className="text-slate-500 text-sm mb-4">
        Showing {filteredEntries.length} of {entries.length} entries
      </div>

      {/* Entries Grid */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No entries match your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => {
            const sourceColor = sourceColors[entry.source] || 'bg-slate-500/20 text-slate-400'
            const sourceLabel = getSourceLabel(entry.source)
            const sourceIcon = getSourceIcon(entry.source)
            return (
              <div
                key={entry.id}
                className="group bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-600/50 rounded-xl p-5 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sourceColor}`}>
                    <span>{sourceIcon}</span>
                    {sourceLabel}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-1.5 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onExport(entry)}
                      className="p-1.5 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                      title="Export PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="p-1.5 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Title */}
                {entry.title && (
                  <h3 className="text-white font-semibold mb-2 line-clamp-1">{entry.title}</h3>
                )}

                {/* Preview */}
                <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                  {getPreview(entry)}
                </p>

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {entry.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-600/50 text-slate-400 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-slate-500 text-xs">
                        +{entry.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-600/30">
                  <span>{formatDate(entry.createdAt)}</span>
                  <span>{formatTime(entry.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
