'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: string // Optional action hint
  icon?: string
  interactive?: boolean // If true, user can click the highlighted element
}

// Simplified steps that only target elements that actually exist on the dashboard
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Workers Portal! 👋',
    description: 'This interactive tour shows you around. You can click highlighted elements to try them - nothing saves during the tutorial!',
    position: 'center',
    icon: '🏛️',
  },
  {
    id: 'clock-widget',
    title: 'Clock In/Out',
    description: 'Track your work time here. The Clock In button starts your shift, and you can take breaks or clock out when done.',
    target: '[data-tutorial="clock-widget"]',
    position: 'bottom',
    action: 'Try clicking Clock In!',
    icon: '⏱️',
    interactive: true,
  },
  {
    id: 'quick-stats',
    title: 'Your Stats',
    description: 'See today\'s hours, weekly totals, and daily average at a glance. Updates in real-time.',
    target: '[data-tutorial="quick-stats"]',
    position: 'top',
    icon: '📊',
  },
  {
    id: 'gamification',
    title: 'Level Up & Earn XP',
    description: 'Every action earns XP! Complete sessions, maintain streaks, and unlock achievements.',
    target: '[data-tutorial="gamification-widget"]',
    position: 'top',
    icon: '⭐',
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🎉',
    description: 'Explore the sidebar menu to find Block Scheduling, Reports, and Settings. Restart this tutorial anytime from Settings.',
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
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
  const observerRef = useRef<ResizeObserver | null>(null)
  const targetElementRef = useRef<Element | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Update highlight position when step changes or window resizes
  const updateHighlightPosition = useCallback(() => {
    if (!isOpen) return

    const step = TUTORIAL_STEPS[currentStep]
    if (step.target) {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setHighlightRect(rect)
        targetElementRef.current = element
        
        // Scroll element into view if needed
        const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight
        if (!isInView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        
        // Calculate best tooltip position
        const spaceAbove = rect.top
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceLeft = rect.left
        const spaceRight = window.innerWidth - rect.right
        
        if (step.position && step.position !== 'center') {
          setTooltipPosition(step.position)
        } else {
          // Auto-position based on available space
          if (spaceBelow >= 280) {
            setTooltipPosition('bottom')
          } else if (spaceAbove >= 280) {
            setTooltipPosition('top')
          } else if (spaceRight >= 420) {
            setTooltipPosition('right')
          } else {
            setTooltipPosition('left')
          }
        }
      } else {
        setHighlightRect(null)
        targetElementRef.current = null
      }
    } else {
      setHighlightRect(null)
      targetElementRef.current = null
    }
  }, [currentStep, isOpen])

  useEffect(() => {
    updateHighlightPosition()
    
    // Update on resize
    window.addEventListener('resize', updateHighlightPosition)
    window.addEventListener('scroll', updateHighlightPosition)
    
    // Use ResizeObserver for dynamic content
    if (targetElementRef.current) {
      observerRef.current = new ResizeObserver(updateHighlightPosition)
      observerRef.current.observe(targetElementRef.current)
    }
    
    return () => {
      window.removeEventListener('resize', updateHighlightPosition)
      window.removeEventListener('scroll', updateHighlightPosition)
      observerRef.current?.disconnect()
    }
  }, [updateHighlightPosition])

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
  }, [isOpen, currentStep, onClose])

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

  // Padding around highlighted element
  const PAD = 12

  // Calculate overlay rectangles (4 pieces around the cutout)
  const getOverlayPieces = () => {
    if (!highlightRect) return null

    const left = Math.max(0, highlightRect.left - PAD)
    const top = Math.max(0, highlightRect.top - PAD)
    const right = Math.min(window.innerWidth, highlightRect.right + PAD)
    const bottom = Math.min(window.innerHeight, highlightRect.bottom + PAD)

    return {
      // Top strip (full width, from top to cutout top)
      top: { x: 0, y: 0, w: window.innerWidth, h: top },
      // Bottom strip (full width, from cutout bottom to screen bottom)
      bottom: { x: 0, y: bottom, w: window.innerWidth, h: window.innerHeight - bottom },
      // Left strip (between top and bottom strips)
      left: { x: 0, y: top, w: left, h: bottom - top },
      // Right strip (between top and bottom strips)
      right: { x: right, y: top, w: window.innerWidth - right, h: bottom - top },
    }
  }

  const overlayPieces = getOverlayPieces()

  // Calculate tooltip style based on position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect || step.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10002,
      }
    }

    const padding = 16
    const tooltipWidth = 360

    // Determine best position based on step preference or available space
    const pos = step.position || tooltipPosition

    switch (pos) {
      case 'top':
        return {
          position: 'fixed',
          bottom: `${window.innerHeight - highlightRect.top + padding + PAD}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
          zIndex: 10002,
        }
      case 'bottom':
        return {
          position: 'fixed',
          top: `${highlightRect.bottom + padding + PAD}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
          zIndex: 10002,
        }
      case 'left':
        return {
          position: 'fixed',
          top: `${Math.max(padding, highlightRect.top)}px`,
          right: `${window.innerWidth - highlightRect.left + padding + PAD}px`,
          zIndex: 10002,
        }
      case 'right':
        return {
          position: 'fixed',
          top: `${Math.max(padding, highlightRect.top)}px`,
          left: `${highlightRect.right + padding + PAD}px`,
          zIndex: 10002,
        }
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10002,
        }
    }
  }

  // Render overlay piece
  const OverlayPiece = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
    if (w <= 0 || h <= 0) return null
    return (
      <div
        className="fixed bg-obsidian/90"
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          zIndex: 10000,
        }}
      />
    )
  }

  const tutorialContent = (
    <>
      {/* Overlay - 4 pieces around the cutout, or full screen if no target */}
      {overlayPieces ? (
        <>
          <OverlayPiece {...overlayPieces.top} />
          <OverlayPiece {...overlayPieces.bottom} />
          <OverlayPiece {...overlayPieces.left} />
          <OverlayPiece {...overlayPieces.right} />
        </>
      ) : (
        <div
          className="fixed inset-0 bg-obsidian/90 z-[10000]"
          onClick={handleNext}
        />
      )}

      {/* Highlight border around target element */}
      {highlightRect && (
        <div
          className="fixed border-2 border-relic-gold rounded-lg animate-pulse pointer-events-none"
          style={{
            top: highlightRect.top - PAD,
            left: highlightRect.left - PAD,
            width: highlightRect.width + PAD * 2,
            height: highlightRect.height + PAD * 2,
            boxShadow: '0 0 30px rgba(204, 164, 59, 0.6), inset 0 0 20px rgba(204, 164, 59, 0.1)',
            zIndex: 10001,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="w-[360px] max-w-[90vw] bg-gradient-to-br from-slate-800 to-obsidian border-2 border-relic-gold rounded-xl shadow-2xl overflow-hidden"
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-relic-gold to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Header with icon */}
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">{step.icon}</span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-relic-gold leading-tight">
                {step.title}
              </h2>
              <p className="text-sand/60 text-xs font-mono mt-1">
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sand/90 text-sm leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Interactive action hint */}
          {step.action && step.interactive && (
            <div className="p-3 bg-relic-gold/15 border border-relic-gold/40 rounded-lg mb-4 flex items-center gap-2">
              <span className="text-relic-gold animate-bounce">👆</span>
              <p className="text-relic-gold text-sm font-medium">
                {step.action}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <button
              onClick={handleSkip}
              className="text-sand/40 hover:text-sand text-xs transition-colors"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-sand/70 hover:text-sand text-sm transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-1.5 bg-gradient-to-r from-relic-gold to-amber-500 text-obsidian text-sm font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(tutorialContent, document.body)
}

interface TutorialOptions {
  clockStatus?: 'clocked-in' | 'clocked-out' | 'on-break'
  weeklyHours?: number[]
  todayEntries?: unknown[]
}

// Hook to manage tutorial state
export function useTutorial(options: TutorialOptions = {}) {
  const { clockStatus, weeklyHours = [], todayEntries = [] } = options
  const [showTutorial, setShowTutorial] = useState(false)
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true)

  useEffect(() => {
    // Never auto-show tutorial if user is clocked in or on break
    if (clockStatus === 'clocked-in' || clockStatus === 'on-break') {
      return
    }

    // Check if user has any work history (not a new user)
    const hasWorkHistory = weeklyHours.some(h => h > 0) || todayEntries.length > 0
    if (hasWorkHistory) {
      // User has records - they've used the app before, mark as completed
      localStorage.setItem('workers_tutorial_completed', 'true')
      return
    }

    // Check if tutorial was completed on this device
    const completed = localStorage.getItem('workers_tutorial_completed')
    if (completed) {
      return
    }

    // New user with no history - show tutorial after delay
    const timer = setTimeout(() => {
      setShowTutorial(true)
      setHasCompletedTutorial(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [clockStatus, weeklyHours, todayEntries])

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
