'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

// Log entry types
export type LogLevel = 'info' | 'warning' | 'error' | 'debug'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  details?: string
  source?: string
  stack?: string
}

interface DebugContextType {
  // Debug panel visibility
  isDebugPanelOpen: boolean
  setDebugPanelOpen: (open: boolean) => void
  toggleDebugPanel: () => void
  
  // Log entries
  logs: LogEntry[]
  clearLogs: () => void
  
  // Logging functions
  logInfo: (message: string, details?: string, source?: string) => void
  logWarning: (message: string, details?: string, source?: string) => void
  logError: (message: string, details?: string, source?: string, stack?: string) => void
  logDebug: (message: string, details?: string, source?: string) => void
  
  // Alerts
  hasUnreadWarnings: boolean
  hasUnreadErrors: boolean
  markAlertsAsRead: () => void
  
  // Export
  exportLogs: () => string
  copyLogsToClipboard: () => Promise<boolean>
  
  // Settings
  maxLogEntries: number
  setMaxLogEntries: (max: number) => void
  isDebugEnabled: boolean
  setDebugEnabled: (enabled: boolean) => void
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

interface DebugProviderProps {
  children: ReactNode
}

const DEFAULT_MAX_LOGS = 100

export function DebugProvider({ children }: DebugProviderProps) {
  const [isDebugPanelOpen, setDebugPanelOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [hasUnreadWarnings, setHasUnreadWarnings] = useState(false)
  const [hasUnreadErrors, setHasUnreadErrors] = useState(false)
  const [maxLogEntries, setMaxLogEntries] = useState(DEFAULT_MAX_LOGS)
  const [isDebugEnabled, setDebugEnabled] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem('debug_enabled')
    if (savedEnabled !== null) {
      setDebugEnabled(savedEnabled === 'true')
    }
    
    const savedMax = localStorage.getItem('debug_max_logs')
    if (savedMax) {
      setMaxLogEntries(parseInt(savedMax, 10))
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('debug_enabled', isDebugEnabled.toString())
  }, [isDebugEnabled])

  useEffect(() => {
    localStorage.setItem('debug_max_logs', maxLogEntries.toString())
  }, [maxLogEntries])

  // Add log entry
  const addLog = useCallback((level: LogLevel, message: string, details?: string, source?: string, stack?: string) => {
    if (!isDebugEnabled && level === 'debug') return
    
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      details,
      source,
      stack,
    }
    
    setLogs(prev => {
      const newLogs = [entry, ...prev]
      // Keep only the last maxLogEntries
      return newLogs.slice(0, maxLogEntries)
    })
    
    // Set unread alerts
    if (level === 'warning') {
      setHasUnreadWarnings(true)
    } else if (level === 'error') {
      setHasUnreadErrors(true)
    }
  }, [isDebugEnabled, maxLogEntries])

  // Logging functions
  const logInfo = useCallback((message: string, details?: string, source?: string) => {
    addLog('info', message, details, source)
  }, [addLog])

  const logWarning = useCallback((message: string, details?: string, source?: string) => {
    addLog('warning', message, details, source)
  }, [addLog])

  const logError = useCallback((message: string, details?: string, source?: string, stack?: string) => {
    addLog('error', message, details, source, stack)
  }, [addLog])

  const logDebug = useCallback((message: string, details?: string, source?: string) => {
    addLog('debug', message, details, source)
  }, [addLog])

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([])
    setHasUnreadWarnings(false)
    setHasUnreadErrors(false)
  }, [])

  // Toggle debug panel
  const toggleDebugPanel = useCallback(() => {
    setDebugPanelOpen(prev => !prev)
  }, [])

  // Mark alerts as read
  const markAlertsAsRead = useCallback(() => {
    setHasUnreadWarnings(false)
    setHasUnreadErrors(false)
  }, [])

  // Export logs as JSON string
  const exportLogs = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    }
    return JSON.stringify(exportData, null, 2)
  }, [logs])

  // Copy logs to clipboard
  const copyLogsToClipboard = useCallback(async () => {
    try {
      const logsText = logs.map(log => {
        const time = log.timestamp.toLocaleTimeString()
        const level = log.level.toUpperCase().padEnd(7)
        const source = log.source ? `[${log.source}] ` : ''
        let text = `${time} ${level} ${source}${log.message}`
        if (log.details) {
          text += `\n         Details: ${log.details}`
        }
        if (log.stack) {
          text += `\n         Stack: ${log.stack}`
        }
        return text
      }).join('\n')
      
      await navigator.clipboard.writeText(logsText)
      return true
    } catch (error) {
      console.error('Failed to copy logs to clipboard:', error)
      return false
    }
  }, [logs])

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(
        event.message,
        `File: ${event.filename}, Line: ${event.lineno}, Col: ${event.colno}`,
        'window.onerror',
        event.error?.stack
      )
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason instanceof Error ? reason.message : String(reason)
      const stack = reason instanceof Error ? reason.stack : undefined
      
      logError(
        `Unhandled Promise Rejection: ${message}`,
        undefined,
        'unhandledrejection',
        stack
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [logError])

  // Log app initialization
  useEffect(() => {
    logInfo('DigiArtifact Workers Portal initialized', `Debug enabled: ${isDebugEnabled}`, 'DebugContext')
  }, []) // Only run once on mount

  const value: DebugContextType = {
    isDebugPanelOpen,
    setDebugPanelOpen,
    toggleDebugPanel,
    logs,
    clearLogs,
    logInfo,
    logWarning,
    logError,
    logDebug,
    hasUnreadWarnings,
    hasUnreadErrors,
    markAlertsAsRead,
    exportLogs,
    copyLogsToClipboard,
    maxLogEntries,
    setMaxLogEntries,
    isDebugEnabled,
    setDebugEnabled,
  }

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const context = useContext(DebugContext)
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider')
  }
  return context
}

// Convenience hook for logging
export function useLogger(source?: string) {
  const { logInfo, logWarning, logError, logDebug } = useDebug()
  
  return {
    info: (message: string, details?: string) => logInfo(message, details, source),
    warn: (message: string, details?: string) => logWarning(message, details, source),
    error: (message: string, details?: string, stack?: string) => logError(message, details, source, stack),
    debug: (message: string, details?: string) => logDebug(message, details, source),
  }
}
