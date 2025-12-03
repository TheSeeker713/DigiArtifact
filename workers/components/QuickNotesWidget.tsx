'use client'

import { useState, useEffect } from 'react'

interface QuickNote {
  id: string
  text: string
  timestamp: number
  pinned: boolean
}

export default function QuickNotesWidget() {
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('workers_quick_notes')
    if (saved) {
      try {
        setNotes(JSON.parse(saved))
      } catch {
        // Invalid data, reset
        setNotes([])
      }
    }
  }, [])

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('workers_quick_notes', JSON.stringify(notes))
  }, [notes])

  const addNote = () => {
    if (!newNote.trim()) return
    
    const note: QuickNote = {
      id: Date.now().toString(),
      text: newNote.trim(),
      timestamp: Date.now(),
      pinned: false,
    }
    
    setNotes(prev => [note, ...prev])
    setNewNote('')
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, pinned: !n.pinned } : n
    ))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addNote()
    }
  }

  // Sort notes: pinned first, then by timestamp
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.timestamp - a.timestamp
  })

  const displayedNotes = isExpanded ? sortedNotes : sortedNotes.slice(0, 3)
  const hasMore = sortedNotes.length > 3

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - timestamp
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-sand">Quick Notes</h3>
        <span className="text-text-slate text-xs font-mono">{notes.length} notes</span>
      </div>

      {/* Add Note Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Jot down a thought..."
          className="input-field flex-1 text-sm"
        />
        <button
          onClick={addNote}
          disabled={!newNote.trim()}
          className="px-3 py-2 rounded-lg bg-relic-gold/20 border border-relic-gold/50 text-relic-gold hover:bg-relic-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add note"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-4xl">📝</span>
          <p className="text-text-slate text-sm mt-2">No notes yet</p>
          <p className="text-text-slate/60 text-xs">Capture ideas as they come!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedNotes.map((note) => (
            <div
              key={note.id}
              className={`group flex items-start gap-2 p-3 rounded-lg transition-colors ${
                note.pinned 
                  ? 'bg-relic-gold/10 border border-relic-gold/30' 
                  : 'bg-obsidian/30 border border-baked-clay/20 hover:border-baked-clay/40'
              }`}
            >
              {/* Pin indicator */}
              {note.pinned && (
                <span className="text-relic-gold text-xs mt-0.5">📌</span>
              )}
              
              {/* Note content */}
              <div className="flex-1 min-w-0">
                <p className="text-sand text-sm break-words">{note.text}</p>
                <p className="text-text-slate/60 text-xs mt-1 font-mono">
                  {formatTime(note.timestamp)}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => togglePin(note.id)}
                  className={`p-1 rounded hover:bg-relic-gold/20 ${note.pinned ? 'text-relic-gold' : 'text-text-slate'}`}
                  aria-label={note.pinned ? 'Unpin' : 'Pin'}
                  title={note.pinned ? 'Unpin' : 'Pin'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-1 rounded hover:bg-red-500/20 text-text-slate hover:text-red-400"
                  aria-label="Delete"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {/* Show More / Less */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 text-center text-sm text-text-slate hover:text-relic-gold font-mono transition-colors"
            >
              {isExpanded ? '↑ Show less' : `↓ Show ${sortedNotes.length - 3} more`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
