'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import suggestionsData from '@/data/smart-suggestions.json'

export interface Suggestion {
  id: number | string
  text: string
  category: string
  trigger: string
  keywords?: string[]
  timeThresholdMinutes?: number
  context: string[]
  priority: 'low' | 'medium' | 'high'
}

interface UseSmartSuggestionsOptions {
  context: 'notes' | 'reports'
  enabled?: boolean
  idleTimeoutMs?: number
  onSuggestionShown?: (suggestion: Suggestion) => void
}

interface UseSmartSuggestionsReturn {
  currentSuggestion: Suggestion | null
  showSuggestion: boolean
  dismissSuggestion: () => void
  acceptSuggestion: () => string
  checkForKeywords: (text: string) => void
  resetIdleTimer: () => void
  suggestionsEnabled: boolean
  toggleSuggestions: (enabled: boolean) => void
}

export function useSmartSuggestions({
  context,
  enabled = true,
  idleTimeoutMs = suggestionsData.idleTimeoutMs,
  onSuggestionShown
}: UseSmartSuggestionsOptions): UseSmartSuggestionsReturn {
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(enabled)
  const [shownSuggestionIds, setShownSuggestionIds] = useState<Set<number | string>>(new Set())
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTextRef = useRef<string>('')
  const sessionStartTimeRef = useRef<Date>(new Date())

  // Filter suggestions by context
  const contextSuggestions = suggestionsData.suggestions.filter(
    (s) => s.context.includes(context)
  ) as Suggestion[]

  // Get a random suggestion that hasn't been shown yet
  const getRandomSuggestion = useCallback((candidates: Suggestion[]): Suggestion | null => {
    const unshown = candidates.filter(s => !shownSuggestionIds.has(s.id))
    if (unshown.length === 0) {
      // Reset shown suggestions if all have been shown
      setShownSuggestionIds(new Set())
      return candidates[Math.floor(Math.random() * candidates.length)] || null
    }
    return unshown[Math.floor(Math.random() * unshown.length)]
  }, [shownSuggestionIds])

  // Find keyword-triggered suggestions
  const findKeywordSuggestion = useCallback((text: string): Suggestion | null => {
    const lowerText = text.toLowerCase()
    
    const keywordSuggestions = contextSuggestions.filter(s => {
      if (s.trigger !== 'keywords' || !s.keywords) return false
      return s.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
    })

    if (keywordSuggestions.length === 0) return null

    // Sort by priority (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    keywordSuggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

    return getRandomSuggestion(keywordSuggestions)
  }, [contextSuggestions, getRandomSuggestion])

  // Find time-elapsed suggestions
  const findTimeElapsedSuggestion = useCallback((): Suggestion | null => {
    const minutesElapsed = (Date.now() - sessionStartTimeRef.current.getTime()) / 60000

    const timeSuggestions = contextSuggestions.filter(s => {
      if (s.trigger !== 'time_elapsed' || !s.timeThresholdMinutes) return false
      return minutesElapsed >= s.timeThresholdMinutes
    })

    return getRandomSuggestion(timeSuggestions)
  }, [contextSuggestions, getRandomSuggestion])

  // Find idle-triggered suggestions
  const findIdleSuggestion = useCallback((): Suggestion | null => {
    const idleSuggestions = contextSuggestions.filter(s => s.trigger === 'idle')
    return getRandomSuggestion(idleSuggestions)
  }, [contextSuggestions, getRandomSuggestion])

  // Get fallback suggestion
  const getFallbackSuggestion = useCallback((): Suggestion | null => {
    const fallbacks = suggestionsData.fallbackSuggestions as Suggestion[]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)] || null
  }, [])

  // Show a suggestion
  const showNewSuggestion = useCallback((suggestion: Suggestion) => {
    if (!suggestionsEnabled) return
    
    setCurrentSuggestion(suggestion)
    setShowSuggestion(true)
    setShownSuggestionIds(prev => new Set([...prev, suggestion.id]))
    onSuggestionShown?.(suggestion)
  }, [suggestionsEnabled, onSuggestionShown])

  // Check text for keyword triggers
  const checkForKeywords = useCallback((text: string) => {
    if (!suggestionsEnabled || showSuggestion) return
    
    // Only check if text has changed significantly
    if (text === lastTextRef.current) return
    lastTextRef.current = text

    // Reset idle timer on text change
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    // Check for keyword matches
    const keywordSuggestion = findKeywordSuggestion(text)
    if (keywordSuggestion) {
      showNewSuggestion(keywordSuggestion)
      return
    }

    // Check for time-elapsed suggestions
    const timeSuggestion = findTimeElapsedSuggestion()
    if (timeSuggestion && Math.random() < 0.3) { // 30% chance to show time-based
      showNewSuggestion(timeSuggestion)
      return
    }

    // Set idle timer for showing idle suggestions
    idleTimerRef.current = setTimeout(() => {
      if (showSuggestion) return
      
      const idleSuggestion = findIdleSuggestion()
      if (idleSuggestion) {
        showNewSuggestion(idleSuggestion)
      } else {
        const fallback = getFallbackSuggestion()
        if (fallback) showNewSuggestion(fallback)
      }
    }, idleTimeoutMs)
  }, [
    suggestionsEnabled,
    showSuggestion,
    idleTimeoutMs,
    findKeywordSuggestion,
    findTimeElapsedSuggestion,
    findIdleSuggestion,
    getFallbackSuggestion,
    showNewSuggestion
  ])

  // Dismiss current suggestion
  const dismissSuggestion = useCallback(() => {
    setShowSuggestion(false)
    setCurrentSuggestion(null)
  }, [])

  // Accept suggestion and return text
  const acceptSuggestion = useCallback((): string => {
    const text = currentSuggestion?.text || ''
    dismissSuggestion()
    return text
  }, [currentSuggestion, dismissSuggestion])

  // Reset idle timer (call on user activity)
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    
    idleTimerRef.current = setTimeout(() => {
      if (showSuggestion || !suggestionsEnabled) return
      
      const idleSuggestion = findIdleSuggestion()
      if (idleSuggestion) {
        showNewSuggestion(idleSuggestion)
      }
    }, idleTimeoutMs)
  }, [idleTimeoutMs, showSuggestion, suggestionsEnabled, findIdleSuggestion, showNewSuggestion])

  // Toggle suggestions on/off
  const toggleSuggestions = useCallback((enabled: boolean) => {
    setSuggestionsEnabled(enabled)
    if (!enabled) {
      dismissSuggestion()
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [dismissSuggestion])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [])

  // Reset session start time on mount
  useEffect(() => {
    sessionStartTimeRef.current = new Date()
  }, [])

  return {
    currentSuggestion,
    showSuggestion,
    dismissSuggestion,
    acceptSuggestion,
    checkForKeywords,
    resetIdleTimer,
    suggestionsEnabled,
    toggleSuggestions
  }
}
