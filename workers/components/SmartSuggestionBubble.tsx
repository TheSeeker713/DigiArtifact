'use client'

import { useEffect, useRef } from 'react'
import { Lightbulb, X, Check, Sparkles } from 'lucide-react'
import { Suggestion } from '@/hooks/useSmartSuggestions'
import suggestionsData from '@/data/smart-suggestions.json'

interface SmartSuggestionBubbleProps {
  suggestion: Suggestion | null
  show: boolean
  onDismiss: () => void
  onAccept: () => void
  position?: 'top' | 'bottom'
}

const categoryIcons: Record<string, string> = suggestionsData.categories as unknown as Record<string, string>

export default function SmartSuggestionBubble({
  suggestion,
  show,
  onDismiss,
  onAccept,
  position = 'bottom'
}: SmartSuggestionBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (!show) return

    const timer = setTimeout(() => {
      onDismiss()
    }, 15000)

    return () => clearTimeout(timer)
  }, [show, onDismiss])

  // Handle escape key
  useEffect(() => {
    if (!show) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss()
      } else if (e.key === 'Enter' && e.ctrlKey) {
        onAccept()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show, onDismiss, onAccept])

  if (!show || !suggestion) return null

  const categoryData = suggestionsData.categories[suggestion.category as keyof typeof suggestionsData.categories]
  const categoryIcon = categoryData?.icon || '💡'
  const categoryName = categoryData?.name || 'Suggestion'

  const priorityColors = {
    low: 'border-slate-600/50 bg-slate-800/90',
    medium: 'border-amber-600/50 bg-amber-900/20',
    high: 'border-emerald-600/50 bg-emerald-900/20'
  }

  return (
    <div
      ref={bubbleRef}
      className={`
        absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
        left-0 right-0 z-50
        animate-in fade-in slide-in-from-bottom-2 duration-300
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`
        rounded-lg border ${priorityColors[suggestion.priority]}
        backdrop-blur-sm shadow-xl
        p-3
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-slate-400">
              {categoryIcon} {categoryName}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded"
            aria-label="Dismiss suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestion Text */}
        <p className="text-slate-200 text-sm leading-relaxed mb-3">
          {suggestion.text}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400">Esc</kbd> to dismiss
          </span>
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Ignore
            </button>
            <button
              onClick={onAccept}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 
                bg-amber-600/20 hover:bg-amber-600/30
                border border-amber-600/50
                rounded text-xs text-amber-300
                transition-colors
              "
            >
              <Check className="w-3 h-3" />
              Use This
            </button>
          </div>
        </div>
      </div>

      {/* Decorative arrow */}
      <div className={`
        absolute ${position === 'top' ? 'bottom-0 translate-y-full' : 'top-0 -translate-y-full'}
        left-8
        w-0 h-0
        border-l-8 border-r-8 border-transparent
        ${position === 'top' 
          ? 'border-t-8 border-t-slate-800/90' 
          : 'border-b-8 border-b-slate-800/90'
        }
      `} />
    </div>
  )
}

// Inline version for compact spaces
export function SmartSuggestionInline({
  suggestion,
  show,
  onDismiss,
  onAccept
}: Omit<SmartSuggestionBubbleProps, 'position'>) {
  if (!show || !suggestion) return null

  const categoryData = suggestionsData.categories[suggestion.category as keyof typeof suggestionsData.categories]
  const categoryIcon = categoryData?.icon || '💡'

  return (
    <div 
      className="
        flex items-center gap-3 
        px-3 py-2 
        bg-slate-800/50 border border-slate-700/50 
        rounded-lg
        animate-in fade-in duration-200
      "
      role="alert"
    >
      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <p className="text-sm text-slate-300 flex-grow">
        <span className="mr-1">{categoryIcon}</span>
        {suggestion.text}
      </p>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onDismiss}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={onAccept}
          className="p-1 text-amber-400 hover:text-amber-300 transition-colors"
          aria-label="Accept suggestion"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
