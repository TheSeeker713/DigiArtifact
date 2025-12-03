'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  StickyNote, 
  Plus, 
  Save, 
  Trash2, 
  X, 
  Edit2, 
  Clock,
  Tag,
  Search,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react'
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions'
import SmartSuggestionBubble from './SmartSuggestionBubble'
import { useSettings } from '@/contexts/SettingsContext'

interface Note {
  id: string
  content: string
  category: string
  created_at: string
  updated_at: string
  time_entry_id?: string
  is_pinned: boolean
}

interface NotesToolProps {
  timeEntryId?: string
  onNoteSaved?: (note: Note) => void
  compact?: boolean
}

const NOTE_CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-slate-500' },
  { value: 'task', label: 'Task', color: 'bg-blue-500' },
  { value: 'blocker', label: 'Blocker', color: 'bg-red-500' },
  { value: 'idea', label: 'Idea', color: 'bg-purple-500' },
  { value: 'reminder', label: 'Reminder', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500' }
]

export default function NotesTool({ 
  timeEntryId, 
  onNoteSaved,
  compact = false 
}: NotesToolProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { formatDateTime } = useSettings()

  // Smart suggestions integration
  const {
    currentSuggestion,
    showSuggestion,
    dismissSuggestion,
    acceptSuggestion,
    checkForKeywords,
    resetIdleTimer,
    suggestionsEnabled,
    toggleSuggestions
  } = useSmartSuggestions({
    context: 'notes',
    enabled: true
  })

  // Handle text changes with smart suggestions
  const handleTextChange = useCallback((text: string) => {
    setNewNote(text)
    checkForKeywords(text)
  }, [checkForKeywords])

  // Handle accepting a suggestion
  const handleAcceptSuggestion = useCallback(() => {
    const suggestionText = acceptSuggestion()
    if (suggestionText) {
      // Append suggestion as a prompt/reminder
      setNewNote(prev => {
        if (prev.trim()) {
          return `${prev}\n\n💡 ${suggestionText}`
        }
        return `💡 ${suggestionText}`
      })
    }
  }, [acceptSuggestion])

  // Focus textarea when adding
  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isAdding])

  // Load notes (mock for now - would connect to API)
  useEffect(() => {
    // In real implementation, fetch from API
    const savedNotes = localStorage.getItem('worker_notes')
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }, [])

  // Save notes to localStorage (mock storage)
  const saveNotesToStorage = (updatedNotes: Note[]) => {
    localStorage.setItem('worker_notes', JSON.stringify(updatedNotes))
    setNotes(updatedNotes)
  }

  // Add new note
  const handleAddNote = () => {
    if (!newNote.trim()) return

    const note: Note = {
      id: crypto.randomUUID(),
      content: newNote.trim(),
      category: selectedCategory,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      time_entry_id: timeEntryId,
      is_pinned: false
    }

    const updatedNotes = [note, ...notes]
    saveNotesToStorage(updatedNotes)
    
    setNewNote('')
    setSelectedCategory('general')
    setIsAdding(false)
    onNoteSaved?.(note)
  }

  // Delete note
  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id)
    saveNotesToStorage(updatedNotes)
  }

  // Toggle pin
  const handleTogglePin = (id: string) => {
    const updatedNotes = notes.map(n => 
      n.id === id ? { ...n, is_pinned: !n.is_pinned } : n
    )
    // Sort pinned to top
    updatedNotes.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    saveNotesToStorage(updatedNotes)
  }

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (searchQuery) {
      return note.content.toLowerCase().includes(searchQuery.toLowerCase())
    }
    if (timeEntryId) {
      return note.time_entry_id === timeEntryId
    }
    return true
  })

  // Sort notes (pinned first, then by date)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const getCategoryColor = (category: string) => {
    return NOTE_CATEGORIES.find(c => c.value === category)?.color || 'bg-slate-500'
  }

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="
          flex items-center gap-2 
          px-3 py-2 
          bg-slate-800/50 hover:bg-slate-800
          border border-slate-700/50 hover:border-slate-600
          rounded-lg transition-colors
          text-sm text-slate-300
        "
      >
        <StickyNote className="w-4 h-4 text-amber-400" />
        <span>Notes</span>
        {notes.length > 0 && (
          <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded">
            {notes.length}
          </span>
        )}
        <ChevronDown className="w-4 h-4 ml-auto" />
      </button>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-400" />
          <h3 className="font-medium text-slate-200">Notes</h3>
          {notes.length > 0 && (
            <span className="text-xs text-slate-500">({notes.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Smart Suggestions Toggle */}
          <button
            onClick={() => toggleSuggestions(!suggestionsEnabled)}
            className={`
              p-1.5 rounded transition-colors
              ${suggestionsEnabled 
                ? 'text-amber-400 bg-amber-400/10' 
                : 'text-slate-500 hover:text-slate-400'
              }
            `}
            title={suggestionsEnabled ? 'Disable suggestions' : 'Enable suggestions'}
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="
                flex items-center gap-1
                px-2 py-1
                bg-amber-600/20 hover:bg-amber-600/30
                border border-amber-600/50
                rounded text-xs text-amber-300
                transition-colors
              "
            >
              <Plus className="w-3 h-3" />
              Add Note
            </button>
          )}
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {notes.length > 3 && (
        <div className="px-4 py-2 border-b border-slate-700/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="
                w-full pl-9 pr-3 py-1.5
                bg-slate-800/50 border border-slate-700/50
                rounded text-sm text-slate-300
                placeholder:text-slate-500
                focus:outline-none focus:border-amber-600/50
              "
            />
          </div>
        </div>
      )}

      {/* Add Note Form */}
      {isAdding && (
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 relative">
          <div className="space-y-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newNote}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => {
                  resetIdleTimer()
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddNote()
                  }
                }}
                placeholder="Write your note..."
                rows={3}
                className="
                  w-full px-3 py-2
                  bg-slate-900/50 border border-slate-700/50
                  rounded-lg text-sm text-slate-200
                  placeholder:text-slate-500
                  focus:outline-none focus:border-amber-600/50
                  resize-none
                "
              />
              
              {/* Smart Suggestion Bubble */}
              <SmartSuggestionBubble
                suggestion={currentSuggestion}
                show={showSuggestion}
                onDismiss={dismissSuggestion}
                onAccept={handleAcceptSuggestion}
                position="bottom"
              />
            </div>

            {/* Category Selection */}
            <div className="flex flex-wrap gap-2">
              {NOTE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`
                    flex items-center gap-1.5 px-2 py-1
                    rounded text-xs transition-colors
                    ${selectedCategory === cat.value
                      ? 'bg-slate-700 text-slate-200 border border-slate-600'
                      : 'bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-700'
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Press <kbd className="px-1 py-0.5 bg-slate-700 rounded">Ctrl+Enter</kbd> to save
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setNewNote('')
                    dismissSuggestion()
                  }}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="
                    flex items-center gap-1.5
                    px-3 py-1.5
                    bg-amber-600 hover:bg-amber-500
                    disabled:bg-slate-700 disabled:text-slate-500
                    rounded text-sm text-white
                    transition-colors
                  "
                >
                  <Save className="w-4 h-4" />
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-80 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-2 text-amber-400 hover:text-amber-300 text-sm"
              >
                Add your first note
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {sortedNotes.map(note => (
              <div
                key={note.id}
                className={`
                  p-4 hover:bg-slate-800/30 transition-colors
                  ${note.is_pinned ? 'bg-amber-900/10' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Category indicator */}
                  <span className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${getCategoryColor(note.category)}`} />
                  
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(note.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {NOTE_CATEGORIES.find(c => c.value === note.category)?.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePin(note.id)}
                      className={`
                        p-1 rounded transition-colors
                        ${note.is_pinned 
                          ? 'text-amber-400' 
                          : 'text-slate-500 hover:text-slate-300'
                        }
                      `}
                      title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
