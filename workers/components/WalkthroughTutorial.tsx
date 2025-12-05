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
  waitForAction?: string // Wait for this action before auto-advancing
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DigiArtifact Workers Portal! 👋',
    description: 'This interactive tour will help you get started. You can click on highlighted elements to try them out - nothing will be saved during the tutorial!',
    position: 'center',
    icon: '🏛️',
  },
  {
    id: 'clock-widget',
    title: 'Clock In/Out Widget',
    description: 'This is where you\'ll track your work time. Try clicking the Clock In button to see how it works!',
    target: '[data-tutorial="clock-widget"]',
    position: 'right',
    action: 'Click "Clock In" to try it out!',
    icon: '⏱️',
    interactive: true,
  },
  {
    id: 'quick-stats',
    title: 'Your Stats at a Glance',
    description: 'See your today\'s hours, weekly totals, and more. These update in real-time as you work.',
    target: '[data-tutorial="quick-stats"]',
    position: 'bottom',
    icon: '📊',
    interactive: true,
  },
  {
    id: 'sidebar-blocks',
    title: 'Block Scheduling',
    description: 'Plan your day with time blocks! Click here to explore the scheduling feature.',
    target: '[data-tutorial="blocks-nav"]',
    position: 'right',
    action: 'Click to explore blocks',
    icon: '🧱',
    interactive: true,
  },
  {
    id: 'sidebar-reports',
    title: 'Reports & Analytics',
    description: 'View detailed reports and export your data. Click to check it out!',
    target: '[data-tutorial="reports-nav"]',
    position: 'right',
    action: 'Click to view reports',
    icon: '📈',
    interactive: true,
  },
  {
    id: 'sidebar-settings',
    title: 'Settings & Preferences',
    description: 'Customize your experience, set your schedule, and access this tutorial anytime from here.',
    target: '[data-tutorial="settings-nav"]',
    position: 'right',
    action: 'Click to open settings',
    icon: '⚙️',
    interactive: true,
  },
  {
    id: 'gamification',
    title: 'Level Up & Earn XP',
    description: 'Every action earns XP! Complete work sessions, maintain streaks, and unlock achievements.',
    target: '[data-tutorial="gamification-widget"]',
    position: 'left',
    icon: '⭐',
    interactive: true,
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🎉',
    description: 'That\'s the basics! Feel free to explore on your own. Remember, you can restart this tutorial anytime from Settings → Help.',
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

  // Handle clicking anywhere on the backdrop to advance (for non-interactive steps)
  const handleBackdropClick = (e: React.MouseEvent) => {
    const step = TUTORIAL_STEPS[currentStep]
    
    // If clicking on the highlighted area and it's interactive, let the click through
    if (highlightRect && step.interactive) {
      const x = e.clientX
      const y = e.clientY
      const inHighlight = 
        x >= highlightRect.left - 8 && 
        x <= highlightRect.right + 8 &&
        y >= highlightRect.top - 8 && 
        y <= highlightRect.bottom + 8
      
      if (inHighlight) {
        // Don't advance - let the user interact
        return
      }
    }
    
    // For center/non-targeted steps, clicking backdrop advances
    if (!highlightRect) {
      handleNext()
    }
  }

  if (!mounted || !isOpen) return null

  const step = TUTORIAL_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100

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

    switch (tooltipPosition) {
      case 'top':
        return {
          position: 'fixed',
          bottom: `${window.innerHeight - highlightRect.top + padding}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
          zIndex: 10002,
        }
      case 'bottom':
        return {
          position: 'fixed',
          top: `${highlightRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
          zIndex: 10002,
        }
      case 'left':
        return {
          position: 'fixed',
          top: `${Math.max(padding, highlightRect.top)}px`,
          right: `${window.innerWidth - highlightRect.left + padding}px`,
          zIndex: 10002,
        }
      case 'right':
        return {
          position: 'fixed',
          top: `${Math.max(padding, highlightRect.top)}px`,
          left: `${highlightRect.right + padding}px`,
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

  const tutorialContent = (
    <>
      {/* Backdrop - clickable but allows interaction with highlighted element */}
      <div 
        className="fixed inset-0 z-[10000]"
        onClick={handleBackdropClick}
        style={{ pointerEvents: 'auto' }}
      >
        {/* SVG mask to create the "spotlight" effect */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(10, 10, 10, 0.85)"
            mask="url(#tutorial-mask)"
          />
        </svg>

        {/* Highlight border around target element */}
        {highlightRect && (
          <div
            className="absolute border-2 border-relic-gold rounded-lg animate-pulse pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: '0 0 20px rgba(204, 164, 59, 0.5)',
              zIndex: 10001,
            }}
          />
        )}

        {/* Clickable overlay for highlighted element - allows clicks through */}
        {highlightRect && step.interactive && (
          <div
            className="absolute cursor-pointer"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              zIndex: 10001,
              pointerEvents: 'none', // Let clicks go through to actual element
            }}
          />
        )}
      </div>

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
