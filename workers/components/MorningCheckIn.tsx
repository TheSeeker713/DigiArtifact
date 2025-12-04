'use client'

import { useState } from 'react'
import { IncompleteBlockInfo } from '@/hooks/useDynamicSchedule'

interface MorningCheckInProps {
  incompleteInfo: IncompleteBlockInfo
  onCarryOver: (blockIds: number[]) => Promise<boolean>
  onDismiss: () => void
}

export default function MorningCheckIn({
  incompleteInfo,
  onCarryOver,
  onDismiss,
}: MorningCheckInProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(
    new Set(incompleteInfo.incompleteBlocks.map(b => b.id))
  )

  const handleToggleBlock = (blockId: number) => {
    setSelectedBlocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(blockId)) {
        newSet.delete(blockId)
      } else {
        newSet.add(blockId)
      }
      return newSet
    })
  }

  const handleCarryOver = async () => {
    if (selectedBlocks.size === 0) {
      onDismiss()
      return
    }
    
    setIsProcessing(true)
    try {
      const success = await onCarryOver(Array.from(selectedBlocks))
      if (success) {
        // Modal will be closed by parent
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const totalSelectedMinutes = incompleteInfo.incompleteBlocks
    .filter(b => selectedBlocks.has(b.id))
    .reduce((sum, b) => sum + b.duration_minutes, 0)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="fixed inset-0 bg-obsidian/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate to-obsidian border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">☀️</span>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-sand">
              Good Morning!
            </h2>
            <p className="text-sand/60 text-sm">
              You have unfinished tasks from yesterday
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
          <p className="text-amber-400 text-sm">
            <strong>{incompleteInfo.incompleteBlocks.length}</strong> block{incompleteInfo.incompleteBlocks.length > 1 ? 's' : ''} ({formatDuration(incompleteInfo.totalIncompleteMinutes)}) from {incompleteInfo.date} weren't completed. 
            Would you like to add them to today's schedule?
          </p>
        </div>

        {/* Block List */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {incompleteInfo.incompleteBlocks.map((block) => (
            <label
              key={block.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedBlocks.has(block.id)
                  ? 'bg-relic-gold/10 border-relic-gold/50'
                  : 'bg-slate/30 border-slate/30 hover:border-slate/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedBlocks.has(block.id)}
                onChange={() => handleToggleBlock(block.id)}
                className="w-5 h-5 rounded border-2 border-slate/50 bg-obsidian text-relic-gold focus:ring-relic-gold focus:ring-offset-0"
              />
              <div className="flex-1">
                <p className="font-medium text-sand">{block.label}</p>
                <p className="text-xs text-sand/50">
                  {block.block_type} • {formatDuration(block.duration_minutes)}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                block.block_type === 'WORK' 
                  ? 'bg-relic-gold/20 text-relic-gold'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {block.block_type}
              </span>
            </label>
          ))}
        </div>

        {/* Selected Summary */}
        {selectedBlocks.size > 0 && (
          <div className="bg-slate/30 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sand/70 text-sm">
              Adding {selectedBlocks.size} block{selectedBlocks.size > 1 ? 's' : ''} to today
            </span>
            <span className="text-relic-gold font-mono">
              +{formatDuration(totalSelectedMinutes)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="flex-1 py-3 bg-slate/50 text-sand rounded-lg hover:bg-slate/70 transition-colors font-medium disabled:opacity-50"
          >
            Skip for Today
          </button>
          <button
            onClick={handleCarryOver}
            disabled={isProcessing}
            className="flex-1 py-3 bg-gradient-to-r from-relic-gold to-amber-500 text-obsidian rounded-lg hover:opacity-90 transition-opacity font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : selectedBlocks.size > 0 ? (
              <>
                <span>Add to Today</span>
                <span>→</span>
              </>
            ) : (
              'Start Fresh'
            )}
          </button>
        </div>

        {/* Tip */}
        <p className="text-center text-sand/40 text-xs mt-4">
          💡 Tip: Carrying over tasks helps maintain your streak!
        </p>
      </div>
    </div>
  )
}
