'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { getApiUrl } from '@/utils/config'

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'worker'
}

export interface TimeEntry {
  id: number
  user_id: number
  project_id: number | null
  clock_in: string
  clock_out: string | null
  break_minutes: number
  notes: string | null
  project_name?: string
  project_color?: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  color: string
  active: boolean
}

export type ClockStatus = 'clocked-out' | 'clocked-in' | 'on-break'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  clockStatus: ClockStatus
  currentEntry: TimeEntry | null
  projects: Project[]
  todayEntries: TimeEntry[]
  weeklyHours: number[]
  logout: () => void
  clockIn: (projectId?: number) => Promise<void>
  clockOut: (notes?: string) => Promise<void>
  startBreak: () => Promise<void>
  endBreak: () => Promise<void>
  refreshData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API base URL - Cloudflare Worker
const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [clockStatus, setClockStatus] = useState<ClockStatus>('clocked-out')
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([])
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])

  // Load user from cookie on mount
  useEffect(() => {
    const userCookie = Cookies.get('workers_user')
    const token = Cookies.get('workers_token')
    
    if (userCookie && token) {
      try {
        const parsedUser = JSON.parse(userCookie)
        setUser(parsedUser)
        // Fetch current status
        refreshData()
      } catch {
        // Invalid cookie, clear it
        Cookies.remove('workers_user')
        Cookies.remove('workers_token')
      }
    }
    setIsLoading(false)
  }, [])

  // Handle OAuth callback token handoff from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      try {
        // Decode the JWT to extract user info (without verification, since we trust our server)
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          const user: User = {
            id: payload.userId,
            email: payload.email,
            name: payload.email.split('@')[0], // Extract name from email if not available
            role: payload.role,
          }

          // Save token and user to cookies
          Cookies.set('workers_token', token, { expires: 7 })
          Cookies.set('workers_user', JSON.stringify(user), { expires: 7 })

          // Update state
          setUser(user)

          // Clean up URL - remove the token parameter
          window.history.replaceState({}, document.title, window.location.pathname)

          // Fetch current status
          refreshData()
        }
      } catch (error) {
        console.error('Failed to process OAuth token:', error)
      }
    }
  }, [])

  const getAuthHeaders = () => {
    const token = Cookies.get('workers_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  const refreshData = async () => {
    try {
      // Fetch clock status
      const statusRes = await fetch(getApiUrl('/clock/status'), {
        headers: getAuthHeaders(),
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setClockStatus(statusData.status)
        setCurrentEntry(statusData.currentEntry)
      }

      // Fetch projects
      const projectsRes = await fetch(getApiUrl('/projects'), {
        headers: getAuthHeaders(),
      })
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      // Fetch today's entries
      const today = new Date().toISOString().split('T')[0]
      const entriesRes = await fetch(getApiUrl(`/entries?date=${today}`), {
        headers: getAuthHeaders(),
      })
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json()
        setTodayEntries(entriesData.entries || [])
      }

      // Fetch weekly stats
      const weeklyRes = await fetch(getApiUrl('/stats/weekly'), {
        headers: getAuthHeaders(),
      })
      if (weeklyRes.ok) {
        const weeklyData = await weeklyRes.json()
        setWeeklyHours(weeklyData.hours || [0, 0, 0, 0, 0, 0, 0])
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }



  const logout = () => {
    Cookies.remove('workers_token')
    Cookies.remove('workers_user')
    setUser(null)
    setClockStatus('clocked-out')
    setCurrentEntry(null)
    window.location.href = '/'
  }

  const clockIn = async (projectId?: number) => {
    const response = await fetch(getApiUrl('/clock/in'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to clock in')
    }

    await refreshData()
  }

  const clockOut = async (notes?: string) => {
    const response = await fetch(getApiUrl('/clock/out'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to clock out')
    }

    await refreshData()
  }

  const startBreak = async () => {
    const response = await fetch(getApiUrl('/break/start'), {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to start break')
    }

    await refreshData()
  }

  const endBreak = async () => {
    const response = await fetch(getApiUrl('/break/end'), {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to end break')
    }

    await refreshData()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        clockStatus,
        currentEntry,
        projects,
        todayEntries,
        weeklyHours,
        logout,
        clockIn,
        clockOut,
        startBreak,
        endBreak,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
