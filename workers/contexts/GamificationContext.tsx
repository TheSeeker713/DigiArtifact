'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

// XP Configuration
const XP_CONFIG = {
  clockIn: 10,
  clockOut: 20,
  hourWorked: 50,
  streakDay: 25,
  streak3Days: 100,
  streak7Days: 250,
  streak30Days: 1000,
  focusSessionComplete: 30,
  taskComplete: 15,
  noteCreated: 5,
  earlyArrival: 50,
  fullWeek: 500,
}

// Level thresholds (cumulative XP needed)
const LEVELS = [
  { level: 1, xp: 0, title: 'Apprentice', color: '#a0a0a0' },
  { level: 2, xp: 100, title: 'Worker', color: '#4ade80' },
  { level: 3, xp: 300, title: 'Craftsman', color: '#22c55e' },
  { level: 4, xp: 600, title: 'Journeyman', color: '#3b82f6' },
  { level: 5, xp: 1000, title: 'Artisan', color: '#6366f1' },
  { level: 6, xp: 1500, title: 'Expert', color: '#8b5cf6' },
  { level: 7, xp: 2500, title: 'Master', color: '#a855f7' },
  { level: 8, xp: 4000, title: 'Grandmaster', color: '#cca43b' },
  { level: 9, xp: 6000, title: 'Legend', color: '#f59e0b' },
  { level: 10, xp: 10000, title: 'Mythic', color: '#ef4444' },
]

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
  getLevel: (xp: number) => typeof LEVELS[0]
  xpConfig: typeof XP_CONFIG
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

const DEFAULT_DATA: GamificationData = {
  totalXP: 0,
  level: 1,
  levelTitle: 'Apprentice',
  levelColor: '#a0a0a0',
  currentLevelXP: 0,
  nextLevelXP: 100,
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

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('workers_gamification')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData({ ...DEFAULT_DATA, ...parsed })
      } catch {
        setData(DEFAULT_DATA)
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('workers_gamification', JSON.stringify(data))
  }, [data])

  const getLevel = useCallback((xp: number) => {
    let currentLevel = LEVELS[0]
    for (const level of LEVELS) {
      if (xp >= level.xp) {
        currentLevel = level
      } else {
        break
      }
    }
    return currentLevel
  }, [])

  const addXP = useCallback((amount: number, reason: string) => {
    setData(prev => {
      const newTotalXP = prev.totalXP + amount
      const newLevel = getLevel(newTotalXP)
      const nextLevelData = LEVELS.find(l => l.xp > newTotalXP) || LEVELS[LEVELS.length - 1]
      
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
        const nextLevelData = LEVELS.find(l => l.xp > newTotalXP) || LEVELS[LEVELS.length - 1]
        
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
        xpConfig: XP_CONFIG,
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
