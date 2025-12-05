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
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => JournalEntry
  archiveNote: (content: string, source: JournalEntrySource, sourceId?: string, title?: string, tags?: string[], richContent?: string) => JournalEntry
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => void
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

  // Load entries from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setEntries(parsed)
      }
    } catch (err) {
      console.error('Failed to load journal entries:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save entries to localStorage when they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    }
  }, [entries, isLoading])

  // Add a new entry
  const addEntry = useCallback((entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): JournalEntry => {
    const now = Date.now()
    const newEntry: JournalEntry = {
      ...entryData,
      id: `journal_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      tags: entryData.tags || [],
    }
    
    setEntries(prev => [newEntry, ...prev])
    return newEntry
  }, [])

  // Archive a note from another source (convenience method)
  const archiveNote = useCallback((
    content: string, 
    source: JournalEntrySource, 
    sourceId?: string, 
    title?: string, 
    tags?: string[], 
    richContent?: string
  ): JournalEntry => {
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
  const updateEntry = useCallback((id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, ...updates, updatedAt: Date.now() }
        : entry
    ))
  }, [])

  // Delete an entry
  const deleteEntry = useCallback(async (id: string) => {
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
