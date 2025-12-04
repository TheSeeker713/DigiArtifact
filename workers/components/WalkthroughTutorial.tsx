'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: string // Optional action hint
  icon?: string
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DigiArtifact Workers Portal! 👋',
    description: 'This quick tour will help you get started with tracking your work time. Let\'s explore the key features together.',
    position: 'center',
    icon: '🏛️',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'This is your home base. Here you can see your current status, today\'s hours, and weekly progress at a glance.',
    target: '[data-tutorial="dashboard"]',
    position: 'bottom',
    icon: '📊',
  },
  {
    id: 'clock-in',
    title: 'Clock In/Out',
    description: 'Click this button to start tracking your work time. You can optionally select a project before clocking in. When you\'re done, clock out to save your session.',
    target: '[data-tutorial="clock-button"]',
    position: 'bottom',
    action: 'Try clicking to see the options!',
    icon: '⏱️',
  },
  {
    id: 'breaks',
    title: 'Taking Breaks',
    description: 'While clocked in, you can start a break anytime. Break time is tracked separately and won\'t count toward your work hours.',
    target: '[data-tutorial="break-button"]',
    position: 'bottom',
    icon: '☕',
  },
  {
    id: 'blocks',
    title: 'Block-Based Scheduling',
    description: 'Plan your day with time blocks! Set up work and break periods, and earn XP rewards when you complete them. Your schedule can shift dynamically as you progress.',
    target: '[data-tutorial="blocks-nav"]',
    position: 'right',
    icon: '🧱',
  },
  {
    id: 'gamification',
    title: 'Earn XP & Level Up',
    description: 'Every action earns you XP! Complete blocks, maintain streaks, and unlock achievements. Watch your level grow as you stay productive.',
    target: '[data-tutorial="xp-display"]',
    position: 'left',
    icon: '⭐',
  },
  {
    id: 'focus-timer',
    title: 'Focus Timer',
    description: 'Need to concentrate? Use the Focus Timer for Pomodoro-style sessions. It helps you stay focused and tracks your deep work time.',
    target: '[data-tutorial="focus-timer"]',
    position: 'bottom',
    icon: '🎯',
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'View detailed reports of your work patterns. Export to CSV or PDF with beautiful charts and graphs for record-keeping or sharing.',
    target: '[data-tutorial="reports-nav"]',
    position: 'right',
    icon: '📈',
  },
  {
    id: 'goals',
    title: 'Set Goals & Track Streaks',
    description: 'Set daily and weekly goals. The app tracks your streaks automatically and rewards consistency with bonus XP and achievements.',
    target: '[data-tutorial="goals-nav"]',
    position: 'right',
    icon: '🎯',
  },
  {
    id: 'notes',
    title: 'Quick Notes',
    description: 'Jot down thoughts, tasks, or ideas anytime. Notes are saved automatically and can be referenced later.',
    target: '[data-tutorial="notes"]',
    position: 'left',
    icon: '📝',
  },
  {
    id: 'morning-checkin',
    title: 'Morning Check-In',
    description: 'If you have incomplete tasks from yesterday, you\'ll see a morning check-in asking if you want to carry them over to today.',
    position: 'center',
    icon: '☀️',
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Visit Settings to change your PIN, adjust time zones, customize notifications, and access this tutorial anytime.',
    target: '[data-tutorial="settings-nav"]',
    position: 'right',
    icon: '⚙️',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'You\'ve completed the tour! Start by clocking in to begin tracking your first work session. Good luck and happy tracking!',
    position: 'center',
    icon: '🚀',
  },
]

interface WalkthroughTutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function WalkthroughTutorial({ isOpen, onClose, onComplete }: WalkthroughTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Update highlight position when step changes
  useEffect(() => {
    if (!isOpen) return

    const step = TUTORIAL_STEPS[currentStep]
    if (step.target) {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setHighlightRect(rect)
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setHighlightRect(null)
      }
    } else {
      setHighlightRect(null)
    }
  }, [currentStep, isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep])

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
      onClose()
    }
  }, [currentStep, onComplete, onClose])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSkip = () => {
    onClose()
  }

  if (!mounted || !isOpen) return null

  const step = TUTORIAL_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!highlightRect || step.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const padding = 20
    const tooltipWidth = 400
    const tooltipHeight = 250

    switch (step.position) {
      case 'top':
        return {
          position: 'fixed' as const,
          top: `${highlightRect.top - tooltipHeight - padding}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        }
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: `${highlightRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        }
      case 'left':
        return {
          position: 'fixed' as const,
          top: `${Math.max(padding, highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2)}px`,
          left: `${highlightRect.left - tooltipWidth - padding}px`,
        }
      case 'right':
        return {
          position: 'fixed' as const,
          top: `${Math.max(padding, highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2)}px`,
          left: `${highlightRect.right + padding}px`,
        }
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
    }
  }

  const tutorialContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop with hole for highlighted element */}
      <div className="absolute inset-0 bg-obsidian/90 backdrop-blur-sm">
        {highlightRect && (
          <div
            className="absolute bg-transparent border-2 border-relic-gold rounded-lg shadow-[0_0_0_9999px_rgba(10,10,10,0.9)] animate-pulse"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="w-[400px] max-w-[90vw] bg-gradient-to-br from-slate to-obsidian border-2 border-relic-gold rounded-2xl shadow-2xl shadow-relic-gold/20 overflow-hidden"
        style={getTooltipPosition()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate">
          <div
            className="h-full bg-gradient-to-r from-relic-gold to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="text-4xl mb-4">{step.icon}</div>

          {/* Title */}
          <h2 className="font-display text-xl font-bold text-relic-gold mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-sand/90 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Action hint */}
          {step.action && (
            <div className="p-3 bg-relic-gold/10 border border-relic-gold/30 rounded-lg mb-4">
              <p className="text-relic-gold text-sm flex items-center gap-2">
                <span>💡</span>
                {step.action}
              </p>
            </div>
          )}

          {/* Step counter */}
          <p className="text-sand/50 text-xs font-mono mb-4">
            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sand/50 hover:text-sand text-sm transition-colors"
            >
              Skip Tutorial
            </button>

            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 bg-slate/50 text-sand rounded-lg hover:bg-slate/70 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-relic-gold to-amber-500 text-obsidian font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="px-6 py-3 bg-obsidian/50 border-t border-slate/30 flex justify-center gap-6 text-xs text-sand/40">
          <span>← → Navigate</span>
          <span>Enter Next</span>
          <span>Esc Skip</span>
        </div>
      </div>
    </div>
  )

  return createPortal(tutorialContent, document.body)
}

// Hook to manage tutorial state
export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true)

  useEffect(() => {
    // Check if this is the user's first visit
    const completed = localStorage.getItem('workers_tutorial_completed')
    if (!completed) {
      // Delay showing tutorial to let the page load
      const timer = setTimeout(() => {
        setShowTutorial(true)
        setHasCompletedTutorial(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const startTutorial = useCallback(() => {
    setShowTutorial(true)
  }, [])

  const closeTutorial = useCallback(() => {
    setShowTutorial(false)
  }, [])

  const completeTutorial = useCallback(() => {
    localStorage.setItem('workers_tutorial_completed', 'true')
    localStorage.setItem('workers_tutorial_completed_at', new Date().toISOString())
    setHasCompletedTutorial(true)
  }, [])

  const resetTutorial = useCallback(() => {
    localStorage.removeItem('workers_tutorial_completed')
    localStorage.removeItem('workers_tutorial_completed_at')
    setHasCompletedTutorial(false)
  }, [])

  return {
    showTutorial,
    hasCompletedTutorial,
    startTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial,
  }
}
