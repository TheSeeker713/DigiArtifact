'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import Cookies from 'js-cookie'
import { LevelDefinition, LEVEL_DEFINITIONS, XP_CONFIG as SHARED_XP_CONFIG, MAX_LEVEL, MAX_LEVEL_XP } from '@shared/constants'
import { useSoundFX } from '@/hooks/useSoundFX'
import LevelUpOverlay from '@/components/LevelUpOverlay'

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
  // Ensure non-negative integer
  const validXP = Math.max(0, Math.floor(xp));
  
  let currentLevel = LEVEL_DEFINITIONS[0]
  for (const level of LEVEL_DEFINITIONS) {
    if (validXP >= level.xp) {
      currentLevel = level
    } else {
      break
    }
  }
  return currentLevel
}

// Helper to get next level data (handles max level)
function getNextLevelData(currentXP: number): LevelDefinition | null {
  const validXP = Math.max(0, Math.floor(currentXP));
  const nextLevel = LEVEL_DEFINITIONS.find(l => l.xp > validXP);
  return nextLevel || null; // null if at max level
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
  
  // Track previous state for rollback on error
  const previousStateRef = useRef<GamificationData | null>(null)
  
  // Level up overlay state
  const [levelUpData, setLevelUpData] = useState<{ level: LevelDefinition } | null>(null)
  
  // Sound effects
  const { playSound } = useSoundFX()

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
          console.log('Fetched gamification data:', apiData) // Debug log
          
          // Map API data to our format
          const totalXP = Math.min(apiData.total_xp || 0, MAX_LEVEL_XP);
          const level = getLevelFromXP(totalXP);
          const nextLevelData = getNextLevelData(totalXP);
          const isMaxLevel = level.level >= MAX_LEVEL;
          
          // Convert total_work_minutes to hours (backend returns minutes)
          const totalHoursWorked = apiData.total_work_minutes 
            ? (apiData.total_work_minutes / 60).toFixed(1) 
            : 0;
          
          setData(prev => ({
            ...prev,
            totalXP,
            level: level.level,
            levelTitle: level.title,
            levelColor: level.color,
            currentLevelXP: isMaxLevel ? MAX_LEVEL_XP - level.xp : totalXP - level.xp,
            nextLevelXP: nextLevelData ? nextLevelData.xp - level.xp : 0,
            currentStreak: apiData.current_streak || 0,
            totalHoursWorked: parseFloat(totalHoursWorked as string) || 0,
            totalSessions: apiData.total_sessions || 0,
            focusSessions: apiData.focus_sessions || 0,
            lastUpdated: Date.now(),
          }))
          
          console.log('Updated gamification state:', {
            totalXP,
            level: level.level,
            levelTitle: level.title,
            currentLevelXP: isMaxLevel ? MAX_LEVEL_XP - level.xp : totalXP - level.xp,
            nextLevelXP: nextLevelData ? nextLevelData.xp - level.xp : 0,
          }) // Debug log
        } else {
          const errorText = await res.text()
          console.error('Failed to fetch gamification data:', res.status, res.statusText, errorText)
          // Even on error, set loading to false so UI can render
        }
      } catch (err) {
        console.error('Failed to fetch gamification data:', err)
        // Even on error, set loading to false so UI can render with default data
      } finally {
        setIsLoading(false)
      }
    }

    fetchGamificationData()
  }, [])
  
  // Debug: Log when data changes
  useEffect(() => {
    if (!isLoading) {
      console.log('GamificationContext data updated:', {
        totalXP: data.totalXP,
        level: data.level,
        levelTitle: data.levelTitle,
        currentLevelXP: data.currentLevelXP,
        nextLevelXP: data.nextLevelXP,
      })
    }
  }, [data, isLoading])

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
    // STRICT VALIDATION: Must be positive integer
    const validatedAmount = Math.floor(amount);
    if (validatedAmount <= 0 || !Number.isFinite(amount)) {
      console.error('Invalid XP amount:', amount);
      return;
    }

    // Store previous state for rollback
    let previousState: GamificationData | null = null;
    
    // Optimistic UI update - immediate feedback
    setData(prev => {
      previousState = prev; // Capture for rollback
      previousStateRef.current = prev;
      
      const oldLevel = prev.level;
      const newTotalXP = Math.min(prev.totalXP + validatedAmount, MAX_LEVEL_XP); // Cap at max
      const newLevel = getLevel(newTotalXP);
      const nextLevelData = getNextLevelData(newTotalXP);
      
      // Check if leveled up
      const leveledUp = newLevel.level > oldLevel;
      
      // Calculate progress to next level (or show max level indicator)
      const isMaxLevel = newLevel.level >= MAX_LEVEL;
      const currentLevelXP = isMaxLevel ? MAX_LEVEL_XP - newLevel.xp : newTotalXP - newLevel.xp;
      const nextLevelXP = nextLevelData 
        ? nextLevelData.xp - newLevel.xp 
        : 0; // At max level, no next level
      
      // Trigger level up overlay and sound
      if (leveledUp) {
        setLevelUpData({ level: newLevel });
        playSound('level-up', { volume: 0.8 });
      } else {
        // Play XP gain sound for regular XP
        playSound('xp-gain', { volume: 0.5 });
      }
      
      return {
        ...prev,
        totalXP: newTotalXP,
        level: newLevel.level,
        levelTitle: newLevel.title,
        levelColor: newLevel.color,
        currentLevelXP,
        nextLevelXP,
        lastUpdated: Date.now(),
      }
    })
    
    // Show notification
    setXpNotification({ amount: validatedAmount, reason })
    setTimeout(() => setXpNotification(null), 3000)

    // Persist to server (async, non-blocking) with error recovery
    const persistXP = async () => {
      try {
        const token = Cookies.get('workers_token')
        if (!token) {
          // No token - rollback optimistic update
          if (previousState) {
            setData(previousState);
            console.warn('No auth token, rolled back XP update');
          }
          return;
        }

        const response = await fetch(`${API_BASE}/gamification/xp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: validatedAmount, reason }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Failed to persist XP to server:', errorData);
          
          // ROLLBACK: Restore previous state on error
          if (previousState) {
            setData(previousState);
            console.warn('XP update failed, rolled back optimistic update');
          }
        } else {
          // Success - sync with server response to ensure consistency
          try {
            const responseData = await response.json();
            if (responseData.total_xp !== undefined) {
              const serverXP = responseData.total_xp;
              const serverLevel = getLevel(serverXP);
              const nextLevelData = getNextLevelData(serverXP);
              const isMaxLevel = serverLevel.level >= MAX_LEVEL;
              
              setData(prev => ({
                ...prev,
                totalXP: Math.min(serverXP, MAX_LEVEL_XP),
                level: serverLevel.level,
                levelTitle: serverLevel.title,
                levelColor: serverLevel.color,
                currentLevelXP: isMaxLevel ? MAX_LEVEL_XP - serverLevel.xp : serverXP - serverLevel.xp,
                nextLevelXP: nextLevelData ? nextLevelData.xp - serverLevel.xp : 0,
                lastUpdated: Date.now(),
              }));
            }
          } catch (syncError) {
            console.error('Failed to sync server response:', syncError);
            // Don't rollback if sync fails - server already has the XP
          }
        }
      } catch (error) {
        console.error('Error persisting XP to server:', error);
        
        // ROLLBACK: Network error - restore previous state
        if (previousState) {
          setData(previousState);
          console.warn('Network error, rolled back XP update');
        }
      }
    }

    persistXP()
  }, [getLevel, playSound])

  const checkAchievements = useCallback(() => {
    // Note: playSound is used inside setData callback, so it's captured from closure
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
        const oldLevel = prev.level;
        const newTotalXP = Math.min(prev.totalXP + bonusXP, MAX_LEVEL_XP)
        const newLevel = getLevel(newTotalXP)
        const nextLevelData = getNextLevelData(newTotalXP)
        const isMaxLevel = newLevel.level >= MAX_LEVEL
        const leveledUp = newLevel.level > oldLevel;
        
        // Play achievement unlock sound
        playSound('achievement', { volume: 0.7 });
        
        // Check for level up from achievement XP
        if (leveledUp) {
          setLevelUpData({ level: newLevel });
          playSound('level-up', { volume: 0.8 });
        }
        
        return {
          ...prev,
          achievements: updatedAchievements,
          totalXP: newTotalXP,
          level: newLevel.level,
          levelTitle: newLevel.title,
          levelColor: newLevel.color,
          currentLevelXP: isMaxLevel ? MAX_LEVEL_XP - newLevel.xp : newTotalXP - newLevel.xp,
          nextLevelXP: nextLevelData ? nextLevelData.xp - newLevel.xp : 0,
        }
      }
      
      return { ...prev, achievements: updatedAchievements }
    })
  }, [getLevel, playSound])

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
      {/* Level Up Overlay */}
      {levelUpData && (
        <LevelUpOverlay
          isVisible={!!levelUpData}
          newLevel={levelUpData.level}
          onClose={() => setLevelUpData(null)}
        />
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
