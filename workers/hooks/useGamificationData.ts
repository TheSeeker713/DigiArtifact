'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { getApiUrl } from '@/utils/config'
import { LevelDefinition, LEVEL_DEFINITIONS, MAX_LEVEL, MAX_LEVEL_XP } from '@shared/constants'

export interface GamificationData {
  totalXP: number
  level: number
  levelTitle: string
  levelColor: string
  currentLevelXP: number
  nextLevelXP: number
  currentStreak: number
  totalHoursWorked: number
  totalSessions: number
  focusSessions: number
  lastUpdated: number
}

interface ApiGamificationData {
  total_xp: number
  current_streak: number
  total_hours_worked: number
  total_sessions: number
  focus_sessions: number
}

// Helper function to calculate level from XP
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

// Fetch gamification data
export function useGamificationData() {
  return useQuery<GamificationData>({
    queryKey: ['gamification'],
    queryFn: async () => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/gamification'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch gamification data')
      const apiData: ApiGamificationData = await res.json()

      // Map API data to our format
      const totalXP = Math.min(apiData.total_xp || 0, MAX_LEVEL_XP);
      const level = getLevelFromXP(totalXP);
      const nextLevelData = getNextLevelData(totalXP);
      const isMaxLevel = level.level >= MAX_LEVEL;

      return {
        totalXP,
        level: level.level,
        levelTitle: level.title,
        levelColor: level.color,
        currentLevelXP: isMaxLevel ? MAX_LEVEL_XP - level.xp : totalXP - level.xp,
        nextLevelXP: nextLevelData ? nextLevelData.xp - level.xp : 0,
        currentStreak: apiData.current_streak || 0,
        totalHoursWorked: apiData.total_hours_worked || 0,
        totalSessions: apiData.total_sessions || 0,
        focusSessions: apiData.focus_sessions || 0,
        lastUpdated: Date.now(),
      }
    },
  })
}

// Record action mutation (server-authoritative XP)
// DEPRECATED: Use recordAction from GamificationContext instead
export function useAwardXP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ actionType, metadata }: { actionType: string; metadata?: Record<string, unknown> }) => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/gamification/xp'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actionType, metadata: metadata || {} }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to record action')
      }

      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch gamification data
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
    },
  })
}

