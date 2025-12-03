'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Timezone options with common US and international zones
export const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/UTC-7' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/UTC-6' },
  { value: 'America/Phoenix', label: 'Arizona (No DST)', offset: 'UTC-7' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/UTC-5' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/UTC-4' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9/UTC-8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/UTC+1' },
  { value: 'Europe/Paris', label: 'Central European Time', offset: 'UTC+1/UTC+2' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time', offset: 'UTC+10/UTC+11' },
]

export type TimeFormat = '12' | '24'

interface SettingsContextType {
  timezone: string
  timeFormat: TimeFormat
  setTimezone: (tz: string) => void
  setTimeFormat: (format: TimeFormat) => void
  formatTime: (date: Date | string, options?: { includeSeconds?: boolean }) => string
  formatDate: (date: Date | string, options?: { weekday?: boolean; year?: boolean }) => string
  formatDateTime: (date: Date | string) => string
  getCurrentTime: () => Date
  parseUTCTimestamp: (timestamp: string) => Date
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'workers_settings'

interface StoredSettings {
  timezone: string
  timeFormat: TimeFormat
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Default to Mountain Time and 12-hour format
  const [timezone, setTimezoneState] = useState<string>('America/Denver')
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('12')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: StoredSettings = JSON.parse(stored)
        if (settings.timezone) setTimezoneState(settings.timezone)
        if (settings.timeFormat) setTimeFormatState(settings.timeFormat)
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!isLoaded) return
    try {
      const settings: StoredSettings = { timezone, timeFormat }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }, [timezone, timeFormat, isLoaded])

  const setTimezone = (tz: string) => {
    setTimezoneState(tz)
  }

  const setTimeFormat = (format: TimeFormat) => {
    setTimeFormatState(format)
  }

  // Parse a UTC timestamp (from the API) into a Date object
  const parseUTCTimestamp = (timestamp: string): Date => {
    // If the timestamp doesn't have a timezone indicator, treat it as UTC
    let ts = timestamp
    if (!ts.endsWith('Z') && !ts.includes('+') && !ts.includes('-', 10)) {
      ts = ts.replace(' ', 'T') + 'Z'
    }
    return new Date(ts)
  }

  // Get current time in the user's timezone
  const getCurrentTime = (): Date => {
    return new Date()
  }

  // Format a time according to user preferences
  const formatTime = (date: Date | string, options?: { includeSeconds?: boolean }): string => {
    const d = typeof date === 'string' ? parseUTCTimestamp(date) : date
    const includeSeconds = options?.includeSeconds ?? false

    try {
      return d.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        hour12: timeFormat === '12',
      })
    } catch (e) {
      // Fallback if timezone is invalid
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        hour12: timeFormat === '12',
      })
    }
  }

  // Format a date according to user preferences
  const formatDate = (date: Date | string, options?: { weekday?: boolean; year?: boolean }): string => {
    const d = typeof date === 'string' ? parseUTCTimestamp(date) : date
    const showWeekday = options?.weekday ?? true
    const showYear = options?.year ?? true

    try {
      return d.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: showWeekday ? 'long' : undefined,
        year: showYear ? 'numeric' : undefined,
        month: 'long',
        day: 'numeric',
      })
    } catch (e) {
      // Fallback if timezone is invalid
      return d.toLocaleDateString('en-US', {
        weekday: showWeekday ? 'long' : undefined,
        year: showYear ? 'numeric' : undefined,
        month: 'long',
        day: 'numeric',
      })
    }
  }

  // Format both date and time
  const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseUTCTimestamp(date) : date
    
    try {
      return d.toLocaleString('en-US', {
        timeZone: timezone,
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: timeFormat === '12',
      })
    } catch (e) {
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: timeFormat === '12',
      })
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        timezone,
        timeFormat,
        setTimezone,
        setTimeFormat,
        formatTime,
        formatDate,
        formatDateTime,
        getCurrentTime,
        parseUTCTimestamp,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
