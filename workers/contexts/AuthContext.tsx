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

// API base URL - Cloudflare Worker
const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

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
        }
      } catch (error) {
        console.error('Failed to process OAuth token:', error)
      }
    }
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
