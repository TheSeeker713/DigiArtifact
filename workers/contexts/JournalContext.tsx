'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import Cookies from 'js-cookie'

const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

export type JournalEntrySource = 'quick_note' | 'journal_editor' | 'clock_note' | 'block_note' | 'goal_note' | 'project_note'

export interface JournalEntry {
  id: string
  title?: string
  content: string // Plain text content
  richContent?: string // HTML rich text content
  source: JournalEntrySource
  sourceId?: string // Reference to original source if applicable
  createdAt: number
  updatedAt: number
  tags: string[]
}

interface JournalContextType {
  entries: JournalEntry[]
  isLoading: boolean
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry>
  archiveNote: (content: string, source: JournalEntrySource, sourceId?: string, title?: string, tags?: string[], richContent?: string) => Promise<JournalEntry>
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  getEntriesBySource: (source: JournalEntrySource) => JournalEntry[]
  getEntriesByDateRange: (start: Date, end: Date) => JournalEntry[]
  searchEntries: (query: string) => JournalEntry[]
  exportToPDF: (entry: JournalEntry) => Promise<void>
}

const JournalContext = createContext<JournalContextType | undefined>(undefined)

const STORAGE_KEY = 'workers_journal_entries'

export function JournalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getToken = () => Cookies.get('workers_token')

  const fetchEntries = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/journal`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch entries')
      const data = await res.json()
      setEntries(data.entries)
    } catch (err) {
      console.error('Failed to load journal entries:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load entries on mount
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Add a new entry
  const addEntry = useCallback(async (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(entryData)
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to save entry')
    }

    const data = await res.json()
    setEntries(prev => [data.entry, ...prev])
    return data.entry
  }, [])

  // Archive a note from another source (convenience method)
  const archiveNote = useCallback(async (
    content: string, 
    source: JournalEntrySource, 
    sourceId?: string, 
    title?: string, 
    tags?: string[], 
    richContent?: string
  ): Promise<JournalEntry> => {
    return addEntry({
      content,
      source,
      sourceId,
      title,
      tags: tags || [],
      richContent,
    })
  }, [addEntry])

  // Update an existing entry
  const updateEntry = useCallback(async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(`${API_BASE}/journal/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to update entry')
    }

    const data = await res.json()
    setEntries(prev => prev.map(entry => 
      entry.id === id ? data.entry : entry
    ))
  }, [])

  // Delete an entry
  const deleteEntry = useCallback(async (id: string) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(`${API_BASE}/journal/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!res.ok) throw new Error('Failed to delete entry')

    setEntries(prev => prev.filter(entry => entry.id !== id))
  }, [])

  // Get entries by source
  const getEntriesBySource = useCallback((source: JournalEntrySource): JournalEntry[] => {
    return entries.filter(entry => entry.source === source)
  }, [entries])

  // Get entries by date range
  const getEntriesByDateRange = useCallback((start: Date, end: Date): JournalEntry[] => {
    const startTime = start.getTime()
    const endTime = end.getTime()
    return entries.filter(entry => 
      entry.createdAt >= startTime && entry.createdAt <= endTime
    )
  }, [entries])

  // Search entries
  const searchEntries = useCallback((query: string): JournalEntry[] => {
    const lowerQuery = query.toLowerCase()
    return entries.filter(entry => 
      entry.title?.toLowerCase().includes(lowerQuery) ||
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }, [entries])

  // Export a single entry to PDF
  const exportToPDF = useCallback(async (entry: JournalEntry) => {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import('jspdf')
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = margin

    // Title
    doc.setFontSize(20)
    doc.setTextColor(204, 164, 59) // Relic gold
    const title = entry.title || 'Untitled Entry'
    doc.text(title, margin, y)
    y += 10

    // Metadata
    doc.setFontSize(10)
    doc.setTextColor(128)
    const dateStr = new Date(entry.createdAt).toLocaleString()
    const sourceLabel = getSourceLabel(entry.source)
    doc.text(`${dateStr} • ${sourceLabel}`, margin, y)
    y += 6

    // Tags
    if (entry.tags && entry.tags.length > 0) {
      doc.text(`Tags: ${entry.tags.map(t => '#' + t).join(', ')}`, margin, y)
      y += 10
    } else {
      y += 4
    }

    // Separator
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Content (plain text)
    doc.setFontSize(11)
    doc.setTextColor(60)
    const lines = doc.splitTextToSize(entry.content, contentWidth)
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 5
    })

    // Save the PDF
    const fileName = `journal_${entry.title?.replace(/\s+/g, '_') || 'entry'}_${new Date(entry.createdAt).toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }, [])

  return (
    <JournalContext.Provider
      value={{
        entries,
        isLoading,
        addEntry,
        archiveNote,
        updateEntry,
        deleteEntry,
        getEntriesBySource,
        getEntriesByDateRange,
        searchEntries,
        exportToPDF,
      }}
    >
      {children}
    </JournalContext.Provider>
  )
}

export function useJournal() {
  const context = useContext(JournalContext)
  if (context === undefined) {
    throw new Error('useJournal must be used within a JournalProvider')
  }
  return context
}

// Helper function to get readable source labels
export function getSourceLabel(source: JournalEntrySource): string {
  switch (source) {
    case 'quick_note': return 'Quick Note'
    case 'journal_editor': return 'Journal Entry'
    case 'clock_note': return 'Clock Out Note'
    case 'block_note': return 'Block Schedule'
    case 'goal_note': return 'Goal Note'
    case 'project_note': return 'Project Note'
    default: return 'Note'
  }
}

// Helper to get source icon
export function getSourceIcon(source: JournalEntrySource): string {
  switch (source) {
    case 'quick_note': return '⚡'
    case 'journal_editor': return '📔'
    case 'clock_note': return '⏱️'
    case 'block_note': return '🧱'
    case 'goal_note': return '🎯'
    case 'project_note': return '📁'
    default: return '📝'
  }
}
