'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import Cookies from 'js-cookie'
import { LevelDefinition, LEVEL_DEFINITIONS, XP_CONFIG as SHARED_XP_CONFIG } from '@shared/constants'

// API base URL
const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

// Use shared LEVEL_DEFINITIONS from `@shared/constants` (LEVEL_DEFINITIONS)


// Achievement definitions
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'productivity' | 'consistency' | 'special'
  requirement: number
  xpReward: number
  unlocked: boolean
  unlockedAt?: number
  progress: number
}

const ACHIEVEMENT_TEMPLATES: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Streak achievements
  { id: 'streak_3', name: 'Getting Started', description: 'Work 3 days in a row', icon: '🌱', category: 'streak', requirement: 3, xpReward: 100 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Work 7 days in a row', icon: '⚔️', category: 'streak', requirement: 7, xpReward: 250 },
  { id: 'streak_14', name: 'Fortnight Fighter', description: 'Work 14 days in a row', icon: '🛡️', category: 'streak', requirement: 14, xpReward: 500 },
  { id: 'streak_30', name: 'Monthly Master', description: 'Work 30 days in a row', icon: '👑', category: 'streak', requirement: 30, xpReward: 1000 },
  
  // Productivity achievements
  { id: 'hours_10', name: 'First Steps', description: 'Log 10 hours of work', icon: '👣', category: 'productivity', requirement: 10, xpReward: 50 },
  { id: 'hours_50', name: 'Dedicated', description: 'Log 50 hours of work', icon: '💪', category: 'productivity', requirement: 50, xpReward: 200 },
  { id: 'hours_100', name: 'Century Club', description: 'Log 100 hours of work', icon: '🎯', category: 'productivity', requirement: 100, xpReward: 500 },
  { id: 'hours_500', name: 'Half Millennium', description: 'Log 500 hours of work', icon: '🏆', category: 'productivity', requirement: 500, xpReward: 1500 },
  
  // Consistency achievements
  { id: 'sessions_10', name: 'Regular', description: 'Complete 10 work sessions', icon: '📊', category: 'consistency', requirement: 10, xpReward: 75 },
  { id: 'sessions_50', name: 'Reliable', description: 'Complete 50 work sessions', icon: '📈', category: 'consistency', requirement: 50, xpReward: 300 },
  { id: 'sessions_100', name: 'Dependable', description: 'Complete 100 work sessions', icon: '⭐', category: 'consistency', requirement: 100, xpReward: 750 },
  
  // Focus achievements
  { id: 'focus_10', name: 'Focus Finder', description: 'Complete 10 focus sessions', icon: '🧘', category: 'special', requirement: 10, xpReward: 100 },
  { id: 'focus_50', name: 'Deep Thinker', description: 'Complete 50 focus sessions', icon: '🧠', category: 'special', requirement: 50, xpReward: 400 },
  
  // Special achievements
  { id: 'early_bird', name: 'Early Bird', description: 'Clock in before 7 AM', icon: '🌅', category: 'special', requirement: 1, xpReward: 100 },
  { id: 'night_owl', name: 'Night Owl', description: 'Work past 10 PM', icon: '🦉', category: 'special', requirement: 1, xpReward: 100 },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Work 5 days in one week', icon: '✨', category: 'special', requirement: 5, xpReward: 300 },
]

// Weekly challenges
export interface WeeklyChallenge {
  id: string
  name: string
  description: string
  icon: string
  target: number
  progress: number
  xpReward: number
  completed: boolean
  expiresAt: number
}

interface GamificationData {
  totalXP: number
  level: number
  levelTitle: string
  levelColor: string
  currentLevelXP: number
  nextLevelXP: number
  achievements: Achievement[]
  weeklyChallenge: WeeklyChallenge | null
  totalHoursWorked: number
  totalSessions: number
  currentStreak: number
  focusSessions: number
  lastUpdated: number
}

interface GamificationContextType {
  data: GamificationData
  addXP: (amount: number, reason: string) => void
  checkAchievements: () => void
  refreshChallenges: () => void
  getLevel: (xp: number) => LevelDefinition
  xpConfig: typeof SHARED_XP_CONFIG
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

// Helper function to calculate level from XP using shared LEVEL_DEFINITIONS
function getLevelFromXP(xp: number): LevelDefinition {
  let currentLevel = LEVEL_DEFINITIONS[0]
  for (const level of LEVEL_DEFINITIONS) {
    if (xp >= level.xp) {
      currentLevel = level
    } else {
      break
    }
  }
  return currentLevel
}

const DEFAULT_DATA: GamificationData = {
  totalXP: 0,
  level: LEVEL_DEFINITIONS[0].level,
  levelTitle: LEVEL_DEFINITIONS[0].title,
  levelColor: LEVEL_DEFINITIONS[0].color,
  currentLevelXP: 0,
  nextLevelXP: LEVEL_DEFINITIONS[1].xp - LEVEL_DEFINITIONS[0].xp,
  achievements: ACHIEVEMENT_TEMPLATES.map(a => ({ ...a, unlocked: false, progress: 0 })),
  weeklyChallenge: null,
  totalHoursWorked: 0,
  totalSessions: 0,
  currentStreak: 0,
  focusSessions: 0,
  lastUpdated: Date.now(),
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GamificationData>(DEFAULT_DATA)
  const [xpNotification, setXpNotification] = useState<{ amount: number; reason: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch gamification data from API
  useEffect(() => {
    const fetchGamificationData = async () => {
      const token = Cookies.get('workers_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/gamification`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.ok) {
          const apiData = await res.json()
          // Map API data to our format
          const level = getLevelFromXP(apiData.total_xp || 0)
          const nextLevelData = LEVEL_DEFINITIONS.find(l => l.xp > (apiData.total_xp || 0)) || LEVEL_DEFINITIONS[LEVEL_DEFINITIONS.length - 1]
          
          setData(prev => ({
            ...prev,
            totalXP: apiData.total_xp || 0,
            level: level.level,
            levelTitle: level.title,
            levelColor: level.color,
            currentLevelXP: (apiData.total_xp || 0) - level.xp,
            nextLevelXP: nextLevelData.xp - level.xp,
            currentStreak: apiData.current_streak || 0,
            totalHoursWorked: apiData.total_hours_worked || 0,
            totalSessions: apiData.total_sessions || 0,
            lastUpdated: Date.now(),
          }))
        }
      } catch (err) {
        console.error('Failed to fetch gamification data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGamificationData()
  }, [])

  // Also keep localStorage as a cache
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('workers_gamification', JSON.stringify(data))
    }
  }, [data, isLoading])

  const getLevel = useCallback((xp: number) => {
    return getLevelFromXP(xp)
  }, [])

  const addXP = useCallback((amount: number, reason: string) => {
    // Optimistic UI update - immediate feedback
    setData(prev => {
      const newTotalXP = prev.totalXP + amount
      const newLevel = getLevel(newTotalXP)
      const nextLevelData = LEVEL_DEFINITIONS.find(l => l.xp > newTotalXP) || LEVEL_DEFINITIONS[LEVEL_DEFINITIONS.length - 1]
      
      return {
        ...prev,
        totalXP: newTotalXP,
        level: newLevel.level,
        levelTitle: newLevel.title,
        levelColor: newLevel.color,
        currentLevelXP: newTotalXP - newLevel.xp,
        nextLevelXP: nextLevelData.xp - newLevel.xp,
        lastUpdated: Date.now(),
      }
    })
    
    // Show notification
    setXpNotification({ amount, reason })
    setTimeout(() => setXpNotification(null), 3000)

    // Persist to server (async, non-blocking)
    const persistXP = async () => {
      try {
        const token = Cookies.get('workers_token')
        if (!token) return

        const response = await fetch(`${API_BASE}/gamification/xp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, reason }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Failed to persist XP to server:', errorData)
        }
      } catch (error) {
        console.error('Error persisting XP to server:', error)
      }
    }

    persistXP()
  }, [getLevel])

  const checkAchievements = useCallback(() => {
    setData(prev => {
      const updatedAchievements = prev.achievements.map(achievement => {
        if (achievement.unlocked) return achievement
        
        let progress = 0
        let shouldUnlock = false
        
        // Calculate progress based on achievement type
        switch (achievement.category) {
          case 'streak':
            progress = prev.currentStreak
            shouldUnlock = progress >= achievement.requirement
            break
          case 'productivity':
            progress = prev.totalHoursWorked
            shouldUnlock = progress >= achievement.requirement
            break
          case 'consistency':
            progress = prev.totalSessions
            shouldUnlock = progress >= achievement.requirement
            break
          case 'special':
            if (achievement.id.startsWith('focus_')) {
              progress = prev.focusSessions
              shouldUnlock = progress >= achievement.requirement
            }
            break
        }
        
        if (shouldUnlock) {
          // Persist unlock to server
          const persistUnlock = async () => {
            try {
              const token = Cookies.get('workers_token')
              if (!token) return

              const response = await fetch(`${API_BASE}/gamification/achievement/unlock`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ achievementId: achievement.id }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                console.error('Failed to persist achievement unlock:', errorData)
              }
            } catch (error) {
              console.error('Error persisting achievement unlock:', error)
            }
          }

          persistUnlock()

          return {
            ...achievement,
            unlocked: true,
            unlockedAt: Date.now(),
            progress: achievement.requirement,
          }
        }
        
        return { ...achievement, progress }
      })
      
      // Add XP for newly unlocked achievements
      const newlyUnlocked = updatedAchievements.filter(
        (a, i) => a.unlocked && !prev.achievements[i].unlocked
      )
      
      let bonusXP = 0
      newlyUnlocked.forEach(a => {
        bonusXP += a.xpReward
      })
      
      if (bonusXP > 0) {
        const newTotalXP = prev.totalXP + bonusXP
        const newLevel = getLevel(newTotalXP)
        const nextLevelData = LEVEL_DEFINITIONS.find(l => l.xp > newTotalXP) || LEVEL_DEFINITIONS[LEVEL_DEFINITIONS.length - 1]
        
        return {
          ...prev,
          achievements: updatedAchievements,
          totalXP: newTotalXP,
          level: newLevel.level,
          levelTitle: newLevel.title,
          levelColor: newLevel.color,
          currentLevelXP: newTotalXP - newLevel.xp,
          nextLevelXP: nextLevelData.xp - newLevel.xp,
        }
      }
      
      return { ...prev, achievements: updatedAchievements }
    })
  }, [getLevel])

  const refreshChallenges = useCallback(() => {
    const now = Date.now()
    const weekStart = getWeekStart()
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000
    
    // Generate a new weekly challenge if needed
    if (!data.weeklyChallenge || data.weeklyChallenge.expiresAt < now) {
      const challenges = [
        { name: 'Focus Champion', description: 'Complete 20 focus sessions', target: 20, icon: '🧘' },
        { name: 'Consistency King', description: 'Work at least 5 days this week', target: 5, icon: '👑' },
        { name: 'Hour Hunter', description: 'Log 30 hours of work', target: 30, icon: '⏱️' },
        { name: 'Task Master', description: 'Complete 25 tasks', target: 25, icon: '✅' },
        { name: 'Early Bird Week', description: 'Clock in before 8 AM 3 times', target: 3, icon: '🌅' },
      ]
      
      const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]
      
      setData(prev => ({
        ...prev,
        weeklyChallenge: {
          id: `weekly_${weekStart}`,
          ...randomChallenge,
          progress: 0,
          xpReward: 500,
          completed: false,
          expiresAt: weekEnd,
        },
      }))
    }
  }, [data.weeklyChallenge])

  // Refresh challenges on mount
  useEffect(() => {
    refreshChallenges()
  }, [])

  return (
    <GamificationContext.Provider
      value={{
        data,
        addXP,
        checkAchievements,
        refreshChallenges,
        getLevel,
        xpConfig: SHARED_XP_CONFIG,
      }}
    >
      {children}
      {/* XP Notification Toast */}
      {xpNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="bg-obsidian/95 border border-relic-gold rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-relic-gold font-bold">+{xpNotification.amount} XP</p>
                <p className="text-text-slate text-xs">{xpNotification.reason}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  const context = useContext(GamificationContext)
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider')
  }
  return context
}

function getWeekStart(): number {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}
