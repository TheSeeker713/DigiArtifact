'use client'

import { useState, useRef, useCallback, TouchEvent as ReactTouchEvent } from 'react'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

interface SwipeConfig {
  threshold?: number
  preventScrollOnHorizontal?: boolean
}

interface SwipeState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isSwiping: boolean
}

interface SwipeHandlers {
  onTouchStart: (e: ReactTouchEvent) => void
  onTouchMove: (e: ReactTouchEvent) => void
  onTouchEnd: (e: ReactTouchEvent) => void
}

interface UseSwipeResult {
  handlers: SwipeHandlers
  swipeDirection: SwipeDirection | null
  swipeDistance: { x: number; y: number }
  isSwiping: boolean
}

export function useSwipe(
  onSwipe?: (direction: SwipeDirection, distance: number) => void,
  config: SwipeConfig = {}
): UseSwipeResult {
  const { threshold = 50, preventScrollOnHorizontal = true } = config
  
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)
  const [swipeDistance, setSwipeDistance] = useState({ x: 0, y: 0 })
  const [isSwiping, setIsSwiping] = useState(false)
  
  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false
  })

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0]
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true
    }
    setIsSwiping(true)
  }, [])

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!swipeState.current.isSwiping) return
    
    const touch = e.touches[0]
    swipeState.current.currentX = touch.clientX
    swipeState.current.currentY = touch.clientY
    
    const deltaX = swipeState.current.currentX - swipeState.current.startX
    const deltaY = swipeState.current.currentY - swipeState.current.startY
    
    setSwipeDistance({ x: deltaX, y: deltaY })
    
    // Determine direction
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    if (absX > absY && absX > 10) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left')
      if (preventScrollOnHorizontal) {
        e.preventDefault()
      }
    } else if (absY > absX && absY > 10) {
      setSwipeDirection(deltaY > 0 ? 'down' : 'up')
    }
  }, [preventScrollOnHorizontal])

  const onTouchEnd = useCallback(() => {
    const deltaX = swipeState.current.currentX - swipeState.current.startX
    const deltaY = swipeState.current.currentY - swipeState.current.startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    if (onSwipe) {
      if (absX > absY && absX > threshold) {
        onSwipe(deltaX > 0 ? 'right' : 'left', absX)
      } else if (absY > absX && absY > threshold) {
        onSwipe(deltaY > 0 ? 'down' : 'up', absY)
      }
    }
    
    swipeState.current.isSwiping = false
    setIsSwiping(false)
    setSwipeDirection(null)
    setSwipeDistance({ x: 0, y: 0 })
  }, [onSwipe, threshold])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    swipeDirection,
    swipeDistance,
    isSwiping
  }
}

// Hook for swipe-to-action patterns
interface SwipeAction {
  direction: 'left' | 'right'
  threshold: number
  onAction: () => void
  color?: string
  icon?: React.ReactNode
  label?: string
}

interface UseSwipeActionsResult {
  handlers: SwipeHandlers
  style: React.CSSProperties
  leftRevealed: boolean
  rightRevealed: boolean
  reset: () => void
}

export function useSwipeActions(
  leftAction?: SwipeAction,
  rightAction?: SwipeAction
): UseSwipeActionsResult {
  const [translateX, setTranslateX] = useState(0)
  const [leftRevealed, setLeftRevealed] = useState(false)
  const [rightRevealed, setRightRevealed] = useState(false)
  
  const startX = useRef(0)
  const isSwiping = useRef(false)

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    startX.current = e.touches[0].clientX
    isSwiping.current = true
  }, [])

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!isSwiping.current) return
    
    const currentX = e.touches[0].clientX
    let deltaX = currentX - startX.current
    
    // Limit swipe distance
    const maxSwipe = 100
    deltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX))
    
    // Add resistance at edges
    if ((deltaX > 0 && !rightAction) || (deltaX < 0 && !leftAction)) {
      deltaX *= 0.3
    }
    
    setTranslateX(deltaX)
    
    // Check if action should be revealed
    if (leftAction && deltaX < -leftAction.threshold) {
      setLeftRevealed(true)
    } else {
      setLeftRevealed(false)
    }
    
    if (rightAction && deltaX > rightAction.threshold) {
      setRightRevealed(true)
    } else {
      setRightRevealed(false)
    }
  }, [leftAction, rightAction])

  const onTouchEnd = useCallback(() => {
    isSwiping.current = false
    
    // Trigger actions
    if (leftRevealed && leftAction) {
      leftAction.onAction()
    }
    if (rightRevealed && rightAction) {
      rightAction.onAction()
    }
    
    // Reset
    setTranslateX(0)
    setLeftRevealed(false)
    setRightRevealed(false)
  }, [leftRevealed, rightRevealed, leftAction, rightAction])

  const reset = useCallback(() => {
    setTranslateX(0)
    setLeftRevealed(false)
    setRightRevealed(false)
  }, [])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    style: {
      transform: `translateX(${translateX}px)`,
      transition: translateX === 0 ? 'transform 0.3s ease-out' : 'none'
    },
    leftRevealed,
    rightRevealed,
    reset
  }
}

// Pull to refresh hook
interface UsePullToRefreshResult {
  handlers: SwipeHandlers
  isPulling: boolean
  pullDistance: number
  isRefreshing: boolean
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold = 80
): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const startY = useRef(0)
  const canPull = useRef(false)

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    // Only allow pull if at top of scroll
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    canPull.current = scrollTop === 0
    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }, [])

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!canPull.current || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY.current
    
    if (deltaY > 0) {
      // Add resistance
      const resistance = Math.min(1, deltaY / 200)
      const resistedDelta = deltaY * (1 - resistance * 0.5)
      setPullDistance(Math.min(120, resistedDelta))
      e.preventDefault()
    }
  }, [isRefreshing])

  const onTouchEnd = useCallback(async () => {
    setIsPulling(false)
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    isPulling,
    pullDistance,
    isRefreshing
  }
}
