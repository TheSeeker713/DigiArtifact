'use client'

import { useState, useEffect } from 'react'
import { useGamification } from '@/contexts/GamificationContext'
import { useSettings } from '@/contexts/SettingsContext'

export default function StickyHeader() {
  const { data: gamificationData } = useGamification()
  const { formatTime, formatDate, timezone, timeFormat } = useSettings()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('workers_theme')
    if (savedTheme === 'light') {
      setIsDarkMode(false)
      document.documentElement.classList.add('light-mode')
    }
  }, [])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    
    if (newMode) {
      document.documentElement.classList.remove('light-mode')
      localStorage.setItem('workers_theme', 'dark')
    } else {
      document.documentElement.classList.add('light-mode')
      localStorage.setItem('workers_theme', 'light')
    }
  }

  // Calculate XP progress percentage
  const xpProgress = gamificationData.nextLevelXP > 0 
    ? Math.min((gamificationData.currentLevelXP / gamificationData.nextLevelXP) * 100, 100)
    : 100
  
  // Ensure progress is at least 0 and safe for display
  const safeProgress = Math.max(0, Math.min(100, xpProgress))

  // Format date for display
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12',
  })

  return (
    <header className="sticky-header">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Level & XP Bar */}
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <div 
            className="level-badge"
            style={{ 
              borderColor: gamificationData.levelColor,
              backgroundColor: `${gamificationData.levelColor}20`,
              color: gamificationData.levelColor,
            }}
          >
            <span className="text-xs font-bold">LV</span>
            <span className="text-lg font-bold leading-none">{gamificationData.level}</span>
          </div>
          
          {/* XP Progress */}
          <div className="hidden sm:block min-w-[120px] md:min-w-[180px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-sand/60 font-mono">{gamificationData.levelTitle}</span>
              <span className="text-sand/40 font-mono hidden md:inline">
                {gamificationData.currentLevelXP}/{gamificationData.nextLevelXP} XP
              </span>
            </div>
            <div className="h-2 bg-slate/50 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 relative"
                style={{ 
                  width: `${safeProgress}%`,
                  background: `linear-gradient(90deg, ${gamificationData.levelColor}, ${gamificationData.levelColor}dd)`,
                  minWidth: safeProgress > 0 ? '2px' : '0px',
                }}
              >
                {safeProgress > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
              </div>
            </div>
          </div>
          
          {/* Total XP Badge (Mobile) */}
          <div className="sm:hidden px-2 py-1 bg-relic-gold/20 rounded text-xs font-mono text-relic-gold">
            {gamificationData.totalXP} XP
          </div>
        </div>

        {/* Right: DateTime & Theme Toggle */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Date & Time Display */}
          <div className="text-right">
            <div className="text-sand/60 text-xs font-mono hidden sm:block">
              {formattedDate}
            </div>
            <div className="text-sand font-mono text-sm md:text-base font-semibold">
              {formattedTime}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              // Sun icon for switching to light mode
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                />
              </svg>
            ) : (
              // Moon icon for switching to dark mode
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
