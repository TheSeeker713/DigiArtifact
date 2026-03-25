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
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from cookie on mount
  useEffect(() => {
    const userCookie = Cookies.get('workers_user')
    const token = Cookies.get('workers_token')
    
    if (userCookie && token) {
      try {
        const parsedUser = JSON.parse(userCookie)
        setUser(parsedUser)
      } catch {
        // Invalid cookie, clear it
        Cookies.remove('workers_user')
        Cookies.remove('workers_token')
      }
    }
    setIsLoading(false)
  }, [])

  const logout = () => {
    Cookies.remove('workers_token')
    Cookies.remove('workers_user')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        logout,
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
