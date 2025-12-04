'use client'

import { useState, useEffect } from 'react'
import { useDebug, LogLevel, LogEntry } from '@/contexts/DebugContext'
import { useAuth } from '@/contexts/AuthContext'

const LEVEL_STYLES: Record<LogLevel, { bg: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: 'i' },
  warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '!' },
  error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'x' },
  debug: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: '#' },
}

export default function DebugPanel() {
  const { user } = useAuth()
  const {
    isDebugPanelOpen,
    setDebugPanelOpen,
    toggleDebugPanel,
    logs,
    clearLogs,
    hasUnreadWarnings,
    hasUnreadErrors,
    markAlertsAsRead,
    copyLogsToClipboard,
    exportLogs,
    isDebugEnabled,
    setDebugEnabled,
    maxLogEntries,
    setMaxLogEntries,
  } = useDebug()
  
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [copySuccess, setCopySuccess] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Only show for admins
  const isAdmin = user?.role === 'admin'
  
  // Mark alerts as read when panel opens
  useEffect(() => {
    if (isDebugPanelOpen) {
      markAlertsAsRead()
    }
  }, [isDebugPanelOpen, markAlertsAsRead])
  
  // Listen for custom event to open debug panel
  useEffect(() => {
    const handleOpenDebugPanel = () => {
      setDebugPanelOpen(true)
    }
    
    window.addEventListener('open-debug-panel', handleOpenDebugPanel)
    return () => window.removeEventListener('open-debug-panel', handleOpenDebugPanel)
  }, [setDebugPanelOpen])
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    const success = await copyLogsToClipboard()
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }
  
  // Handle export
  const handleExport = () => {
    const data = exportLogs()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Filter logs
  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter)
  
  // Count by level
  const counts = {
    all: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
    debug: logs.filter(l => l.level === 'debug').length,
  }
  
  if (!isAdmin) return null
  
  return (
    <>
      {/* Floating Alert Button - shows when there are unread warnings/errors */}
      {!isDebugPanelOpen && (hasUnreadWarnings || hasUnreadErrors) && (
        <button
          onClick={toggleDebugPanel}
          className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg animate-pulse ${
            hasUnreadErrors 
              ? 'bg-red-500/90 hover:bg-red-500' 
              : 'bg-amber-500/90 hover:bg-amber-500'
          }`}
          title={hasUnreadErrors ? 'Errors detected' : 'Warnings detected'}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {counts.error > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-red-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {counts.error}
            </span>
          )}
        </button>
      )}
      
      {/* Mini Toggle Button (always visible for admins) */}
      {!isDebugPanelOpen && !hasUnreadWarnings && !hasUnreadErrors && (
        <button
          onClick={toggleDebugPanel}
          className="fixed bottom-4 right-4 z-50 p-2 rounded-lg bg-obsidian/80 border border-slate-700 hover:border-relic-gold/50 transition-colors opacity-50 hover:opacity-100"
          title="Open Debug Panel"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
      )}
      
      {/* Debug Panel */}
      {isDebugPanelOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[500px] max-w-[90vw] h-[400px] max-h-[60vh] bg-obsidian/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-relic-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="font-mono text-sm text-sand">Debug Console</span>
              <span className="text-xs text-slate-500">({logs.length} entries)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${showSettings ? 'bg-slate-700' : ''}`}
                title="Settings"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setDebugPanelOpen(false)}
                className="p-1.5 rounded hover:bg-slate-700 transition-colors"
                title="Close"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Enable Debug Logging</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isDebugEnabled}
                    onChange={(e) => setDebugEnabled(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-relic-gold/70 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Max Log Entries</span>
                <select 
                  value={maxLogEntries}
                  onChange={(e) => setMaxLogEntries(parseInt(e.target.value, 10))}
                  className="bg-slate-700 text-sand text-sm rounded px-2 py-1 border border-slate-600"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-700 bg-slate-800/30 overflow-x-auto">
            {(['all', 'error', 'warning', 'info', 'debug'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1 ${
                  filter === level 
                    ? level === 'all' 
                      ? 'bg-slate-600 text-white' 
                      : `${LEVEL_STYLES[level as LogLevel].bg} ${LEVEL_STYLES[level as LogLevel].text}` 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                <span className="opacity-75">({counts[level]})</span>
              </button>
            ))}
          </div>
          
          {/* Log Entries */}
          <div className="flex-1 overflow-y-auto font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                No log entries{filter !== 'all' ? ` for ${filter}` : ''}
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredLogs.map(log => (
                  <LogEntryRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700 bg-slate-800/50">
            <button
              onClick={clearLogs}
              className="px-2 py-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  copySuccess 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'text-slate-400 hover:text-relic-gold hover:bg-slate-700'
                }`}
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleExport}
                className="px-2 py-1 text-xs text-slate-400 hover:text-relic-gold hover:bg-slate-700 rounded transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function LogEntryRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const style = LEVEL_STYLES[log.level]
  
  return (
    <div 
      className={`p-2 hover:bg-slate-800/50 cursor-pointer ${style.bg}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        {/* Level indicator */}
        <span className={`w-4 h-4 flex items-center justify-center rounded text-xs font-bold ${style.text}`}>
          {style.icon}
        </span>
        
        {/* Timestamp */}
        <span className="text-slate-500 shrink-0">
          {log.timestamp.toLocaleTimeString()}
        </span>
        
        {/* Source */}
        {log.source && (
          <span className="text-slate-600 shrink-0">[{log.source}]</span>
        )}
        
        {/* Message */}
        <span className={`${style.text} break-all`}>{log.message}</span>
      </div>
      
      {/* Expanded details */}
      {expanded && (log.details || log.stack) && (
        <div className="mt-2 pl-6 space-y-1">
          {log.details && (
            <p className="text-slate-400 break-all">
              <span className="text-slate-600">Details: </span>
              {log.details}
            </p>
          )}
          {log.stack && (
            <pre className="text-slate-500 text-[10px] overflow-x-auto whitespace-pre-wrap">
              {log.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
