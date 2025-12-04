'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface DemoEntry {
  id: string
  user_id: string
  project_id: string
  start_time: string
  end_time: string | null
  duration_minutes: number
  notes: string
}

interface DemoData {
  user: {
    id: string
    name: string
    email: string
    role: 'worker' | 'admin'
    pin: string
    hourly_rate: number
    created_at: string
  }
  projects: Array<{
    id: string
    name: string
    color: string
    user_id: string
  }>
  todayEntries: DemoEntry[]
  weeklyHours: number
  xp: number
  level: number
  streak: number
}

// Demo data for tutorial mode - no actual DB writes happen
export const TUTORIAL_DEMO_DATA: DemoData = {
  user: {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'worker' as const,
    pin: '0000',
    hourly_rate: 15.00,
    created_at: new Date().toISOString(),
  },
  projects: [
    { id: 'demo-proj-1', name: 'Web Development', color: '#F59E0B', user_id: 'demo-user' },
    { id: 'demo-proj-2', name: 'Design Work', color: '#10B981', user_id: 'demo-user' },
    { id: 'demo-proj-3', name: 'Client Meetings', color: '#3B82F6', user_id: 'demo-user' },
  ],
  todayEntries: [
    {
      id: 'demo-entry-1',
      user_id: 'demo-user',
      project_id: 'demo-proj-1',
      start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 120,
      notes: 'Worked on frontend features',
    },
  ],
  weeklyHours: 12.5,
  xp: 450,
  level: 3,
  streak: 5,
}

interface TutorialContextType {
  // Tutorial mode state
  isTutorialMode: boolean
  currentTutorialStep: number
  tutorialAction: string | null
  
  // Demo mode state (sandbox without DB writes)
  isDemoMode: boolean
  demoData: DemoData
  
  // Tutorial controls
  startTutorial: () => void
  endTutorial: () => void
  setTutorialStep: (step: number) => void
  
  // Demo mode controls
  enableDemoMode: () => void
  disableDemoMode: () => void
  
  // Interactive action tracking
  registerTutorialAction: (action: string) => void
  clearTutorialAction: () => void
  
  // Element highlighting
  highlightedElement: string | null
  setHighlightedElement: (selector: string | null) => void
  
  // Completion tracking for interactive steps
  completedInteractiveSteps: Set<string>
  markStepCompleted: (stepId: string) => void
  resetCompletedSteps: () => void
  
  // Simulated actions for tutorial (don't hit real API)
  simulateClockIn: () => void
  simulateClockOut: () => void
  simulateBreakStart: () => void
  simulateBreakEnd: () => void
  simulatedClockStatus: 'idle' | 'clocked-in' | 'on-break'
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

interface TutorialProviderProps {
  children: ReactNode
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [isTutorialMode, setIsTutorialMode] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0)
  const [tutorialAction, setTutorialAction] = useState<string | null>(null)
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null)
  const [completedInteractiveSteps, setCompletedInteractiveSteps] = useState<Set<string>>(new Set())
  const [simulatedClockStatus, setSimulatedClockStatus] = useState<'idle' | 'clocked-in' | 'on-break'>('idle')
  
  // Demo data is mutable in tutorial mode
  const [demoData, setDemoData] = useState(TUTORIAL_DEMO_DATA)

  // Start tutorial - activates tutorial mode
  const startTutorial = useCallback(() => {
    setIsTutorialMode(true)
    setIsDemoMode(true) // Demo mode is always active during tutorial
    setCurrentTutorialStep(0)
    setCompletedInteractiveSteps(new Set())
    setSimulatedClockStatus('idle')
    setDemoData(TUTORIAL_DEMO_DATA) // Reset demo data
  }, [])

  // End tutorial - returns to normal mode
  const endTutorial = useCallback(() => {
    setIsTutorialMode(false)
    setIsDemoMode(false)
    setCurrentTutorialStep(0)
    setHighlightedElement(null)
    setTutorialAction(null)
    setSimulatedClockStatus('idle')
  }, [])

  // Enable demo mode without full tutorial
  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true)
    setDemoData(TUTORIAL_DEMO_DATA)
  }, [])

  // Disable demo mode
  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false)
  }, [])

  // Set current tutorial step
  const setTutorialStep = useCallback((step: number) => {
    setCurrentTutorialStep(step)
  }, [])

  // Register an action that was performed during tutorial
  const registerTutorialAction = useCallback((action: string) => {
    setTutorialAction(action)
    
    // Auto-clear after a short delay
    setTimeout(() => {
      setTutorialAction(null)
    }, 2000)
  }, [])

  // Clear tutorial action
  const clearTutorialAction = useCallback(() => {
    setTutorialAction(null)
  }, [])

  // Mark a step as completed
  const markStepCompleted = useCallback((stepId: string) => {
    setCompletedInteractiveSteps(prev => {
      const newSet = new Set(prev)
      newSet.add(stepId)
      return newSet
    })
  }, [])

  // Reset completed steps
  const resetCompletedSteps = useCallback(() => {
    setCompletedInteractiveSteps(new Set())
  }, [])

  // Simulated clock actions for tutorial mode
  const simulateClockIn = useCallback(() => {
    if (isDemoMode) {
      setSimulatedClockStatus('clocked-in')
      registerTutorialAction('clock-in')
      
      // Add a simulated entry to demo data
      const newEntry: DemoEntry = {
        id: `demo-entry-${Date.now()}`,
        user_id: 'demo-user',
        project_id: 'demo-proj-1',
        start_time: new Date().toISOString(),
        end_time: null,
        duration_minutes: 0,
        notes: '',
      }
      
      setDemoData(prev => ({
        ...prev,
        todayEntries: [...prev.todayEntries, newEntry],
      }))
    }
  }, [isDemoMode, registerTutorialAction])

  const simulateClockOut = useCallback(() => {
    if (isDemoMode) {
      setSimulatedClockStatus('idle')
      registerTutorialAction('clock-out')
    }
  }, [isDemoMode, registerTutorialAction])

  const simulateBreakStart = useCallback(() => {
    if (isDemoMode) {
      setSimulatedClockStatus('on-break')
      registerTutorialAction('break-start')
    }
  }, [isDemoMode, registerTutorialAction])

  const simulateBreakEnd = useCallback(() => {
    if (isDemoMode) {
      setSimulatedClockStatus('clocked-in')
      registerTutorialAction('break-end')
    }
  }, [isDemoMode, registerTutorialAction])

  const value: TutorialContextType = {
    isTutorialMode,
    currentTutorialStep,
    tutorialAction,
    isDemoMode,
    demoData,
    startTutorial,
    endTutorial,
    setTutorialStep,
    enableDemoMode,
    disableDemoMode,
    registerTutorialAction,
    clearTutorialAction,
    highlightedElement,
    setHighlightedElement,
    completedInteractiveSteps,
    markStepCompleted,
    resetCompletedSteps,
    simulateClockIn,
    simulateClockOut,
    simulateBreakStart,
    simulateBreakEnd,
    simulatedClockStatus,
  }

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorialContext() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorialContext must be used within a TutorialProvider')
  }
  return context
}

// Hook to check if we should use demo data
export function useDemoDataIfActive<T>(realData: T, demoData: T): T {
  const { isDemoMode } = useTutorialContext()
  return isDemoMode ? demoData : realData
}

// Hook to wrap API calls - returns simulated success in demo mode
export function useTutorialSafeAction() {
  const { isDemoMode, registerTutorialAction } = useTutorialContext()
  
  const safeAction = useCallback(<T,>(
    action: () => Promise<T>,
    actionName: string,
    simulatedResult: T
  ): Promise<T> => {
    if (isDemoMode) {
      registerTutorialAction(actionName)
      // Return simulated result without hitting the API
      return Promise.resolve(simulatedResult)
    }
    
    // In normal mode, execute the real action
    return action()
  }, [isDemoMode, registerTutorialAction])
  
  return safeAction
}
