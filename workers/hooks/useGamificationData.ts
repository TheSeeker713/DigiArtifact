'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { getApiUrl } from '@/utils/config'
import { LevelDefinition, LEVEL_DEFINITIONS } from '@shared/constants'

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
      const level = getLevelFromXP(apiData.total_xp || 0)
      const nextLevelData = LEVEL_DEFINITIONS.find(l => l.xp > (apiData.total_xp || 0)) || LEVEL_DEFINITIONS[LEVEL_DEFINITIONS.length - 1]

      return {
        totalXP: apiData.total_xp || 0,
        level: level.level,
        levelTitle: level.title,
        levelColor: level.color,
        currentLevelXP: (apiData.total_xp || 0) - level.xp,
        nextLevelXP: nextLevelData.xp - level.xp,
        currentStreak: apiData.current_streak || 0,
        totalHoursWorked: apiData.total_hours_worked || 0,
        totalSessions: apiData.total_sessions || 0,
        focusSessions: apiData.focus_sessions || 0,
        lastUpdated: Date.now(),
      }
    },
  })
}

// Award XP mutation
export function useAwardXP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/gamification/xp'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to award XP')
      }

      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch gamification data
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
    },
  })
}

