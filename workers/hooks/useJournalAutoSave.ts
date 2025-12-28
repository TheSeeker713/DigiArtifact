'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { JournalEntry, useJournal } from '@/contexts/JournalContext'
import { useGamification } from '@/contexts/GamificationContext'

interface UseJournalAutoSaveOptions {
  entry: JournalEntry | null
  title: string
  richContent: string
  tags: string[]
  autoSaveDelay?: number // milliseconds (default: 3000)
}

interface UseJournalAutoSaveReturn {
  isSaving: boolean
  hasChanges: boolean
  lastSaved: Date | null
  save: () => Promise<void>
  activeEntry: JournalEntry | null
  setActiveEntry: (entry: JournalEntry | null) => void
}

/**
 * Hook for managing journal entry auto-save functionality
 * Handles debounced auto-save, change tracking, and cleanup on unmount
 */
export function useJournalAutoSave({
  entry,
  title,
  richContent,
  tags,
  autoSaveDelay = 3000,
}: UseJournalAutoSaveOptions): UseJournalAutoSaveReturn {
  const { archiveNote, updateEntry } = useJournal()
  const { addXP } = useGamification()
  
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(entry)
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Refs for cleanup save on unmount
  const titleRef = useRef(title)
  const tagsRef = useRef(tags)
  const richContentRef = useRef(richContent)
  const hasChangesRef = useRef(hasChanges)
  const activeEntryRef = useRef(activeEntry)

  // Update refs
  useEffect(() => {
    titleRef.current = title
    tagsRef.current = tags
    richContentRef.current = richContent
    hasChangesRef.current = hasChanges
    activeEntryRef.current = activeEntry
  }, [title, tags, richContent, hasChanges, activeEntry])

  // Track changes
  useEffect(() => {
    const originalContent = activeEntry?.richContent || activeEntry?.content || ''
    const originalTitle = activeEntry?.title || ''
    const originalTags = activeEntry?.tags || []
    
    const contentChanged = richContent !== originalContent
    const titleChanged = title !== originalTitle
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(originalTags)
    
    setHasChanges(contentChanged || titleChanged || tagsChanged)
  }, [richContent, title, tags, activeEntry])

  // Save function
  const save = useCallback(async () => {
    if (!richContentRef.current && !titleRef.current.trim()) {
      return // Don't save empty entries
    }

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = richContentRef.current
    const plainText = tempDiv.textContent || ''

    if (!plainText.trim() && !titleRef.current.trim()) {
      return // Don't save empty entries
    }

    setIsSaving(true)
    
    try {
      const payload = {
        title: titleRef.current.trim() || undefined,
        content: plainText,
        richContent: richContentRef.current,
        tags: tagsRef.current,
      }

      if (activeEntryRef.current) {
        // Update existing entry
        await updateEntry(activeEntryRef.current.id, payload)
      } else {
        // Create new entry
        const newEntry = await archiveNote(
          payload.content,
          'journal_editor',
          undefined,
          payload.title,
          payload.tags,
          payload.richContent
        )
        setActiveEntry(newEntry)
      }
      
      setLastSaved(new Date())
      setHasChanges(false)
      
      // Award XP for saving journal entry
      addXP(20, 'Journal Entry Saved')
    } catch (error) {
      console.error('Failed to save journal entry:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [archiveNote, updateEntry, addXP])

  // Auto-save logic with debounce
  useEffect(() => {
    if (!hasChanges || isSaving) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      save().catch(console.error)
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [title, tags, richContent, hasChanges, isSaving, autoSaveDelay, save])

  // Auto-save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault()
        e.returnValue = ''
        // Save synchronously if possible
        save().catch(console.error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [save])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (hasChangesRef.current) {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = richContentRef.current
        const plainText = tempDiv.textContent || ''
        
        if (!plainText.trim() && !titleRef.current.trim()) return

        const payload = {
          title: titleRef.current.trim() || undefined,
          content: plainText,
          richContent: richContentRef.current,
          tags: tagsRef.current,
        }

        if (activeEntryRef.current) {
          updateEntry(activeEntryRef.current.id, payload).catch(console.error)
        } else {
          archiveNote(
            payload.content,
            'journal_editor',
            undefined,
            payload.title,
            payload.tags,
            payload.richContent
          ).catch(console.error)
        }
      }
    }
  }, [archiveNote, updateEntry])

  return {
    isSaving,
    hasChanges,
    lastSaved,
    save,
    activeEntry,
    setActiveEntry,
  }
}

