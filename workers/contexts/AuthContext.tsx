'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'

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
  login: (email: string, pin: string) => Promise<void>
  logout: () => void
  clockIn: (projectId?: number) => Promise<void>
  clockOut: (notes?: string) => Promise<void>
  startBreak: () => Promise<void>
  endBreak: () => Promise<void>
  refreshData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API base URL - in production this would be your Worker URL
const API_BASE = '/api'

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
      const statusRes = await fetch(`${API_BASE}/clock/status`, {
        headers: getAuthHeaders(),
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setClockStatus(statusData.status)
        setCurrentEntry(statusData.currentEntry)
      }

      // Fetch projects
      const projectsRes = await fetch(`${API_BASE}/projects`, {
        headers: getAuthHeaders(),
      })
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      // Fetch today's entries
      const today = new Date().toISOString().split('T')[0]
      const entriesRes = await fetch(`${API_BASE}/entries?date=${today}`, {
        headers: getAuthHeaders(),
      })
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json()
        setTodayEntries(entriesData.entries || [])
      }

      // Fetch weekly stats
      const weeklyRes = await fetch(`${API_BASE}/stats/weekly`, {
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

  const login = async (email: string, pin: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    Cookies.set('workers_token', data.token, { expires: 7 })
    Cookies.set('workers_user', JSON.stringify(data.user), { expires: 7 })
    setUser(data.user)
    await refreshData()
  }

  const logout = () => {
    Cookies.remove('workers_token')
    Cookies.remove('workers_user')
    setUser(null)
    setClockStatus('clocked-out')
    setCurrentEntry(null)
  }

  const clockIn = async (projectId?: number) => {
    const response = await fetch(`${API_BASE}/clock/in`, {
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
    const response = await fetch(`${API_BASE}/clock/out`, {
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
    const response = await fetch(`${API_BASE}/break/start`, {
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
    const response = await fetch(`${API_BASE}/break/end`, {
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
        login,
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
