'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { getApiUrl } from '@/utils/config'
import { TimeEntry } from '@/contexts/AuthContext'

export type ClockStatus = 'clocked-out' | 'clocked-in' | 'on-break'

export interface ClockStatusData {
  status: ClockStatus
  currentEntry: TimeEntry | null
}

// Fetch clock status
export function useClockStatus() {
  return useQuery<ClockStatusData>({
    queryKey: ['clock', 'status'],
    queryFn: async () => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/clock/status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch clock status')
      return res.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Fetch time entries
export function useTimeEntries(date?: string, start?: string, end?: string) {
  return useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', date, start, end],
    queryFn: async () => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      let url = getApiUrl('/entries')
      const params = new URLSearchParams()
      if (date) params.append('date', date)
      if (start) params.append('start', start)
      if (end) params.append('end', end)
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch entries')
      const data = await res.json()
      return data.entries || []
    },
  })
}

// Fetch today's entries (convenience hook)
export function useTodayEntries() {
  const today = new Date().toISOString().split('T')[0]
  return useTimeEntries(today)
}

// Fetch weekly stats
export function useWeeklyStats() {
  return useQuery<{ hours: number[] }>({
    queryKey: ['stats', 'weekly'],
    queryFn: async () => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/stats/weekly'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch weekly stats')
      return res.json()
    },
  })
}

// Clock in mutation
export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId?: number) => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/clock/in'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to clock in')
      }

      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch clock status and entries
      queryClient.invalidateQueries({ queryKey: ['clock'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    },
  })
}

// Clock out mutation
export function useClockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notes?: string) => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/clock/out'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to clock out')
      }

      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch clock status and entries
      queryClient.invalidateQueries({ queryKey: ['clock'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    },
  })
}

// Break mutations
export function useBreakStart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/break/start'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start break')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clock'] })
    },
  })
}

export function useBreakEnd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = Cookies.get('workers_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(getApiUrl('/break/end'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to end break')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clock'] })
    },
  })
}

