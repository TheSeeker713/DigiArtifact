'use client'

import { useState, useCallback, useMemo } from 'react'
import { addMinutes, parse, format, differenceInMinutes, isAfter, isBefore, startOfDay } from 'date-fns'

// Block types
export type BlockType = 'WORK' | 'BREAK' | 'LUNCH' | 'FLEX'
export type BlockStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'partial' | 'extended'

export interface ScheduleBlock {
  id: string
  type: BlockType
  orderIndex: number
  startTime: Date
  endTime: Date
  durationMinutes: number
  label: string
  status: BlockStatus
  projectId?: number
  projectName?: string
  notes?: string
  xpEarned: number
  focusScore: number
}

export interface DaySchedule {
  date: Date
  blocks: ScheduleBlock[]
  totalWorkMinutes: number
  totalBreakMinutes: number
  completedBlocks: number
  targetWorkMinutes: number
  carriedMinutes: number // From previous incomplete day
  isComplete: boolean
}

// Default block template: 2h Work -> 15m Break -> 2h Work -> 30m Lunch -> 2h Work -> 15m Break -> 2h Work
const DEFAULT_TEMPLATE: Array<{ type: BlockType; duration: number; label: string }> = [
  { type: 'WORK', duration: 120, label: 'Morning Focus Block 1' },
  { type: 'BREAK', duration: 15, label: 'Short Break' },
  { type: 'WORK', duration: 120, label: 'Morning Focus Block 2' },
  { type: 'LUNCH', duration: 30, label: 'Lunch Break' },
  { type: 'WORK', duration: 120, label: 'Afternoon Focus Block 1' },
  { type: 'BREAK', duration: 15, label: 'Short Break' },
  { type: 'WORK', duration: 120, label: 'Afternoon Focus Block 2' },
]

interface UseDynamicScheduleOptions {
  startTime?: string // Format: "HH:mm" (default: "08:00")
  targetWorkMinutes?: number // Default: 480 (8 hours)
  template?: Array<{ type: BlockType; duration: number; label: string }>
  carriedMinutes?: number // Minutes rolled over from previous day
}

interface UseDynamicScheduleReturn {
  blocks: ScheduleBlock[]
  schedule: DaySchedule
  // Actions
  updateBlock: (blockId: string, updates: Partial<Pick<ScheduleBlock, 'startTime' | 'endTime' | 'durationMinutes' | 'label' | 'status' | 'projectId' | 'projectName' | 'notes'>>) => void
  completeBlock: (blockId: string) => { xpEarned: number; milestone?: string }
  skipBlock: (blockId: string) => void
  startBlock: (blockId: string) => void
  resetSchedule: () => void
  adjustForCarryOver: (minutes: number) => void
  getNextBlock: () => ScheduleBlock | null
  getCurrentBlock: () => ScheduleBlock | null
  // Stats
  stats: {
    totalWorkMinutes: number
    completedWorkMinutes: number
    remainingWorkMinutes: number
    completedBlocks: number
    totalBlocks: number
    progressPercent: number
    isOnTrack: boolean
    estimatedEndTime: Date
  }
}

/**
 * Custom hook for managing a dynamic block-based schedule.
 * 
 * Features:
 * - Auto-generates schedule from template
 * - Time-shifting: When a block's end time changes, all subsequent blocks shift
 * - Enforces 8-hour total work time (adjustable)
 * - Carry-over from previous incomplete days
 * - XP rewards for completion
 */
export function useDynamicSchedule(options: UseDynamicScheduleOptions = {}): UseDynamicScheduleReturn {
  const {
    startTime = '08:00',
    targetWorkMinutes = 480,
    template = DEFAULT_TEMPLATE,
    carriedMinutes = 0,
  } = options

  // Generate unique ID
  const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Build initial schedule from template
  const buildSchedule = useCallback((
    baseStartTime: string,
    blockTemplate: typeof DEFAULT_TEMPLATE,
    extraWorkMinutes: number = 0
  ): ScheduleBlock[] => {
    const today = startOfDay(new Date())
    let currentTime = parse(baseStartTime, 'HH:mm', today)
    
    const blocks: ScheduleBlock[] = []
    
    blockTemplate.forEach((templateBlock, index) => {
      const duration = templateBlock.duration
      const endTime = addMinutes(currentTime, duration)
      
      blocks.push({
        id: generateId(),
        type: templateBlock.type,
        orderIndex: index,
        startTime: currentTime,
        endTime: endTime,
        durationMinutes: duration,
        label: templateBlock.label,
        status: 'pending',
        xpEarned: 0,
        focusScore: 0,
      })
      
      currentTime = endTime
    })
    
    // If there's carried time, add an extra work block
    if (extraWorkMinutes > 0) {
      const extraBlock: ScheduleBlock = {
        id: generateId(),
        type: 'WORK',
        orderIndex: blocks.length,
        startTime: currentTime,
        endTime: addMinutes(currentTime, extraWorkMinutes),
        durationMinutes: extraWorkMinutes,
        label: `Carry-over Work (+${extraWorkMinutes}m from yesterday)`,
        status: 'pending',
        xpEarned: 0,
        focusScore: 0,
      }
      blocks.push(extraBlock)
    }
    
    return blocks
  }, [])

  const [blocks, setBlocks] = useState<ScheduleBlock[]>(() => 
    buildSchedule(startTime, template, carriedMinutes)
  )

  // Calculate work/break totals
  const totals = useMemo(() => {
    const workBlocks = blocks.filter(b => b.type === 'WORK' || b.type === 'FLEX')
    const breakBlocks = blocks.filter(b => b.type === 'BREAK' || b.type === 'LUNCH')
    
    return {
      totalWorkMinutes: workBlocks.reduce((sum, b) => sum + b.durationMinutes, 0),
      totalBreakMinutes: breakBlocks.reduce((sum, b) => sum + b.durationMinutes, 0),
      completedWorkMinutes: workBlocks
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.durationMinutes, 0),
      completedBlocks: blocks.filter(b => b.status === 'completed').length,
      workBlockCount: workBlocks.length,
    }
  }, [blocks])

  // Stats calculation
  const stats = useMemo(() => {
    const workBlocks = blocks.filter(b => b.type === 'WORK' || b.type === 'FLEX')
    const completedWork = workBlocks.filter(b => b.status === 'completed')
    const remainingBlocks = workBlocks.filter(b => b.status === 'pending')
    
    const completedMinutes = completedWork.reduce((sum, b) => sum + b.durationMinutes, 0)
    const remainingMinutes = remainingBlocks.reduce((sum, b) => sum + b.durationMinutes, 0)
    
    const progressPercent = totals.totalWorkMinutes > 0 
      ? (completedMinutes / totals.totalWorkMinutes) * 100 
      : 0
    
    // Calculate expected progress based on time of day
    const now = new Date()
    const firstBlock = blocks[0]
    const lastBlock = blocks[blocks.length - 1]
    const totalDuration = differenceInMinutes(lastBlock.endTime, firstBlock.startTime)
    const elapsedTime = differenceInMinutes(now, firstBlock.startTime)
    const expectedProgress = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100))
    
    return {
      totalWorkMinutes: totals.totalWorkMinutes,
      completedWorkMinutes: completedMinutes,
      remainingWorkMinutes: remainingMinutes,
      completedBlocks: totals.completedBlocks,
      totalBlocks: workBlocks.length,
      progressPercent,
      isOnTrack: progressPercent >= expectedProgress - 10, // Within 10% is on track
      estimatedEndTime: lastBlock.endTime,
    }
  }, [blocks, totals])

  // Time-shifting logic: When a block changes, shift all subsequent blocks
  const shiftSubsequentBlocks = useCallback((
    blockId: string, 
    timeDelta: number // minutes to shift (positive = later, negative = earlier)
  ) => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(b => b.id === blockId)
      if (blockIndex === -1) return prev
      
      return prev.map((block, index) => {
        if (index <= blockIndex) return block
        
        // Shift this block
        return {
          ...block,
          startTime: addMinutes(block.startTime, timeDelta),
          endTime: addMinutes(block.endTime, timeDelta),
        }
      })
    })
  }, [])

  // Update a block with time-shifting
  const updateBlock = useCallback((
    blockId: string,
    updates: Partial<Pick<ScheduleBlock, 'startTime' | 'endTime' | 'durationMinutes' | 'label' | 'status' | 'projectId' | 'projectName' | 'notes'>>
  ) => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(b => b.id === blockId)
      if (blockIndex === -1) return prev
      
      const currentBlock = prev[blockIndex]
      let newBlocks = [...prev]
      
      // If end time changed, calculate time shift for subsequent blocks
      if (updates.endTime) {
        const oldEndTime = currentBlock.endTime
        const newEndTime = updates.endTime
        const timeDelta = differenceInMinutes(newEndTime, oldEndTime)
        
        // Update duration if end time changed
        updates.durationMinutes = differenceInMinutes(newEndTime, currentBlock.startTime)
        
        // Shift all subsequent blocks
        if (timeDelta !== 0) {
          newBlocks = newBlocks.map((block, index) => {
            if (index <= blockIndex) return block
            
            return {
              ...block,
              startTime: addMinutes(block.startTime, timeDelta),
              endTime: addMinutes(block.endTime, timeDelta),
            }
          })
        }
      }
      
      // If start time changed
      if (updates.startTime && !updates.endTime) {
        const newDuration = differenceInMinutes(currentBlock.endTime, updates.startTime)
        if (newDuration > 0) {
          updates.durationMinutes = newDuration
        }
      }
      
      // If duration changed directly
      if (updates.durationMinutes && !updates.endTime && !updates.startTime) {
        const oldDuration = currentBlock.durationMinutes
        const timeDelta = updates.durationMinutes - oldDuration
        updates.endTime = addMinutes(currentBlock.startTime, updates.durationMinutes)
        
        // Shift subsequent blocks
        if (timeDelta !== 0) {
          newBlocks = newBlocks.map((block, index) => {
            if (index <= blockIndex) return block
            
            return {
              ...block,
              startTime: addMinutes(block.startTime, timeDelta),
              endTime: addMinutes(block.endTime, timeDelta),
            }
          })
        }
      }
      
      // Apply updates to the target block
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], ...updates }
      
      // Enforce total work time constraint (optional - warn if exceeds 8h)
      const totalWork = newBlocks
        .filter(b => b.type === 'WORK' || b.type === 'FLEX')
        .reduce((sum, b) => sum + b.durationMinutes, 0)
      
      if (totalWork > targetWorkMinutes + 60) { // Allow 1 hour buffer
        console.warn(`Total work time (${totalWork}m) exceeds target (${targetWorkMinutes}m)`)
      }
      
      return newBlocks
    })
  }, [targetWorkMinutes])

  // Complete a block and award XP
  const completeBlock = useCallback((blockId: string): { xpEarned: number; milestone?: string } => {
    let xpEarned = 0
    let milestone: string | undefined
    
    setBlocks(prev => {
      const blockIndex = prev.findIndex(b => b.id === blockId)
      if (blockIndex === -1) return prev
      
      const block = prev[blockIndex]
      
      // Calculate XP based on block type and duration
      if (block.type === 'WORK' || block.type === 'FLEX') {
        xpEarned = Math.floor(block.durationMinutes / 30) * 25 // 25 XP per 30 mins
        
        // Bonus for focus score
        const focusBonus = Math.floor(block.focusScore / 20) * 10
        xpEarned += focusBonus
      } else {
        // Break completion XP
        xpEarned = 10
      }
      
      // Check for milestones
      const completedCount = prev.filter(b => b.status === 'completed').length + 1
      const workBlocks = prev.filter(b => b.type === 'WORK' || b.type === 'FLEX')
      
      if (completedCount === 1) {
        milestone = 'First Block'
        xpEarned += 50
      } else if (completedCount === Math.ceil(workBlocks.length / 2)) {
        milestone = 'Half Day'
        xpEarned += 100
      } else if (completedCount === workBlocks.length - 1) {
        milestone = 'Almost There'
        xpEarned += 150
      } else if (completedCount === workBlocks.length) {
        milestone = 'Perfect Day'
        xpEarned += 300
      }
      
      return prev.map(b => 
        b.id === blockId 
          ? { ...b, status: 'completed' as BlockStatus, xpEarned, focusScore: 100 }
          : b
      )
    })
    
    return { xpEarned, milestone }
  }, [])

  // Skip a block
  const skipBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, status: 'skipped' as BlockStatus } : b
    ))
  }, [])

  // Start a block
  const startBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, status: 'in_progress' as BlockStatus } : b
    ))
  }, [])

  // Reset schedule
  const resetSchedule = useCallback(() => {
    setBlocks(buildSchedule(startTime, template, carriedMinutes))
  }, [buildSchedule, startTime, template, carriedMinutes])

  // Adjust for carry-over from previous day
  const adjustForCarryOver = useCallback((minutes: number) => {
    if (minutes <= 0) return
    
    setBlocks(prev => {
      const lastBlock = prev[prev.length - 1]
      const newBlock: ScheduleBlock = {
        id: generateId(),
        type: 'WORK',
        orderIndex: prev.length,
        startTime: lastBlock.endTime,
        endTime: addMinutes(lastBlock.endTime, minutes),
        durationMinutes: minutes,
        label: `Carry-over (+${minutes}m from yesterday)`,
        status: 'pending',
        xpEarned: 0,
        focusScore: 0,
      }
      return [...prev, newBlock]
    })
  }, [])

  // Get next pending block
  const getNextBlock = useCallback((): ScheduleBlock | null => {
    return blocks.find(b => b.status === 'pending') || null
  }, [blocks])

  // Get current in-progress block
  const getCurrentBlock = useCallback((): ScheduleBlock | null => {
    return blocks.find(b => b.status === 'in_progress') || null
  }, [blocks])

  // Build schedule object
  const schedule: DaySchedule = useMemo(() => ({
    date: startOfDay(new Date()),
    blocks,
    totalWorkMinutes: totals.totalWorkMinutes,
    totalBreakMinutes: totals.totalBreakMinutes,
    completedBlocks: totals.completedBlocks,
    targetWorkMinutes,
    carriedMinutes,
    isComplete: totals.completedBlocks === blocks.filter(b => b.type === 'WORK').length,
  }), [blocks, totals, targetWorkMinutes, carriedMinutes])

  return {
    blocks,
    schedule,
    updateBlock,
    completeBlock,
    skipBlock,
    startBlock,
    resetSchedule,
    adjustForCarryOver,
    getNextBlock,
    getCurrentBlock,
    stats,
  }
}

// Helper function to format time for display
export function formatBlockTime(date: Date): string {
  return format(date, 'h:mm a')
}

// Helper function to parse time string to Date
export function parseBlockTime(timeStr: string): Date {
  return parse(timeStr, 'HH:mm', startOfDay(new Date()))
}
