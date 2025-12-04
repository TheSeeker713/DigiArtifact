'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'

interface WeekDay {
  id: number
  name: string
  shortName: string
}

const WEEKDAYS: WeekDay[] = [
  { id: 0, name: 'Sunday', shortName: 'Sun' },
  { id: 1, name: 'Monday', shortName: 'Mon' },
  { id: 2, name: 'Tuesday', shortName: 'Tue' },
  { id: 3, name: 'Wednesday', shortName: 'Wed' },
  { id: 4, name: 'Thursday', shortName: 'Thu' },
  { id: 5, name: 'Friday', shortName: 'Fri' },
  { id: 6, name: 'Saturday', shortName: 'Sat' },
]

interface ScheduleSlot {
  day: number
  startTime: string // HH:MM format
  endTime: string
  enabled: boolean
}

interface UserSchedule {
  targetWeeklyHours: number
  preferredDays: number[]
  slots: ScheduleSlot[]
}

const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

export default function ScheduleEditor() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Schedule state
  const [targetWeeklyHours, setTargetWeeklyHours] = useState(40)
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri default
  const [slots, setSlots] = useState<ScheduleSlot[]>(() => 
    WEEKDAYS.map(day => ({
      day: day.id,
      startTime: '09:00',
      endTime: '17:00',
      enabled: day.id >= 1 && day.id <= 5, // Mon-Fri enabled by default
    }))
  )
  
  // Load user's schedule on mount
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const token = Cookies.get('workers_token')
        if (!token) return
        
        const response = await fetch(`${API_BASE}/user/schedule`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.schedule) {
            setTargetWeeklyHours(data.schedule.target_weekly_hours || 40)
            setPreferredDays(data.schedule.preferred_days || [1, 2, 3, 4, 5])
            if (data.schedule.slots) {
              setSlots(data.schedule.slots)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load schedule:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSchedule()
  }, [])
  
  // Toggle a day's enabled status
  const toggleDay = (dayId: number) => {
    setSlots(prev => prev.map(slot => 
      slot.day === dayId ? { ...slot, enabled: !slot.enabled } : slot
    ))
    
    setPreferredDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId)
      } else {
        return [...prev, dayId].sort()
      }
    })
  }
  
  // Update a slot's time
  const updateSlotTime = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
    setSlots(prev => prev.map(slot =>
      slot.day === dayId ? { ...slot, [field]: value } : slot
    ))
  }
  
  // Calculate estimated hours per day
  const calculateDailyHours = () => {
    const enabledDays = slots.filter(s => s.enabled).length
    if (enabledDays === 0) return 0
    return (targetWeeklyHours / enabledDays).toFixed(1)
  }
  
  // Calculate total scheduled hours
  const calculateScheduledHours = () => {
    return slots
      .filter(s => s.enabled)
      .reduce((total, slot) => {
        const [startH, startM] = slot.startTime.split(':').map(Number)
        const [endH, endM] = slot.endTime.split(':').map(Number)
        const hours = (endH + endM / 60) - (startH + startM / 60)
        return total + Math.max(0, hours)
      }, 0)
  }
  
  // Save schedule
  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const token = Cookies.get('workers_token')
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      const response = await fetch(`${API_BASE}/user/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_weekly_hours: targetWeeklyHours,
          preferred_days: preferredDays,
          slots: slots,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save schedule')
      }
      
      setSuccess('Schedule saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Use preset schedule
  const applyPreset = (preset: 'full-time' | 'part-time' | 'weekends') => {
    switch (preset) {
      case 'full-time':
        setTargetWeeklyHours(40)
        setPreferredDays([1, 2, 3, 4, 5])
        setSlots(prev => prev.map(slot => ({
          ...slot,
          enabled: slot.day >= 1 && slot.day <= 5,
          startTime: '09:00',
          endTime: '17:00',
        })))
        break
      case 'part-time':
        setTargetWeeklyHours(20)
        setPreferredDays([1, 2, 3, 4, 5])
        setSlots(prev => prev.map(slot => ({
          ...slot,
          enabled: slot.day >= 1 && slot.day <= 5,
          startTime: '09:00',
          endTime: '13:00',
        })))
        break
      case 'weekends':
        setTargetWeeklyHours(16)
        setPreferredDays([0, 6])
        setSlots(prev => prev.map(slot => ({
          ...slot,
          enabled: slot.day === 0 || slot.day === 6,
          startTime: '10:00',
          endTime: '18:00',
        })))
        break
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-relic-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  const scheduledHours = calculateScheduledHours()
  const hoursMatch = Math.abs(scheduledHours - targetWeeklyHours) < 1
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl text-relic-gold mb-2">My Work Schedule</h2>
        <p className="text-text-slate text-sm">
          Set your preferred working hours and days. This helps with scheduling and time tracking goals.
        </p>
      </div>
      
      {/* Presets */}
      <div className="card">
        <h3 className="font-heading text-lg text-sand mb-3">Quick Presets</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset('full-time')}
            className="px-3 py-2 text-sm bg-obsidian/50 hover:bg-relic-gold/20 text-sand hover:text-relic-gold rounded-lg transition-colors"
          >
            Full-Time (40h/week)
          </button>
          <button
            onClick={() => applyPreset('part-time')}
            className="px-3 py-2 text-sm bg-obsidian/50 hover:bg-relic-gold/20 text-sand hover:text-relic-gold rounded-lg transition-colors"
          >
            Part-Time (20h/week)
          </button>
          <button
            onClick={() => applyPreset('weekends')}
            className="px-3 py-2 text-sm bg-obsidian/50 hover:bg-relic-gold/20 text-sand hover:text-relic-gold rounded-lg transition-colors"
          >
            Weekends Only (16h/week)
          </button>
        </div>
      </div>
      
      {/* Weekly Hours Target */}
      <div className="card">
        <h3 className="font-heading text-lg text-sand mb-4">Weekly Hours Target</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="60"
            value={targetWeeklyHours}
            onChange={(e) => setTargetWeeklyHours(Number(e.target.value))}
            className="flex-1 h-2 bg-baked-clay/30 rounded-lg appearance-none cursor-pointer accent-relic-gold"
          />
          <div className="w-24 text-center">
            <input
              type="number"
              min="1"
              max="60"
              value={targetWeeklyHours}
              onChange={(e) => setTargetWeeklyHours(Math.min(60, Math.max(1, Number(e.target.value))))}
              className="w-16 px-2 py-1 bg-obsidian border border-baked-clay/30 rounded text-center text-relic-gold font-mono"
            />
            <span className="text-text-slate text-xs block mt-1">hours/week</span>
          </div>
        </div>
        
        {/* Hours summary */}
        <div className="mt-4 p-3 bg-obsidian/50 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-text-slate text-sm">Scheduled: </span>
            <span className={`font-mono ${hoursMatch ? 'text-status-active' : 'text-amber-400'}`}>
              {scheduledHours.toFixed(1)}h
            </span>
          </div>
          <div>
            <span className="text-text-slate text-sm">Target: </span>
            <span className="font-mono text-relic-gold">{targetWeeklyHours}h</span>
          </div>
          <div>
            <span className="text-text-slate text-sm">~</span>
            <span className="font-mono text-sand"> {calculateDailyHours()}h/day</span>
          </div>
        </div>
        
        {!hoursMatch && (
          <p className="text-amber-400 text-xs mt-2">
            Tip: Your scheduled hours don't match your target. Adjust your working days or times.
          </p>
        )}
      </div>
      
      {/* Day Schedule */}
      <div className="card">
        <h3 className="font-heading text-lg text-sand mb-4">Working Days & Hours</h3>
        
        <div className="space-y-3">
          {WEEKDAYS.map(day => {
            const slot = slots.find(s => s.day === day.id) || { 
              day: day.id, 
              startTime: '09:00', 
              endTime: '17:00', 
              enabled: false 
            }
            
            return (
              <div 
                key={day.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  slot.enabled ? 'bg-relic-gold/10' : 'bg-obsidian/50'
                }`}
              >
                {/* Day toggle */}
                <label className="flex items-center gap-3 cursor-pointer min-w-[120px]">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={() => toggleDay(day.id)}
                    className="w-5 h-5 rounded border-baked-clay/30 text-relic-gold focus:ring-relic-gold/50"
                  />
                  <span className={`font-mono text-sm ${slot.enabled ? 'text-relic-gold' : 'text-text-slate'}`}>
                    {day.name}
                  </span>
                </label>
                
                {/* Time range */}
                <div className={`flex items-center gap-2 flex-1 ${!slot.enabled && 'opacity-50'}`}>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlotTime(day.id, 'startTime', e.target.value)}
                    disabled={!slot.enabled}
                    className="px-2 py-1 bg-obsidian border border-baked-clay/30 rounded text-sand font-mono text-sm disabled:opacity-50"
                  />
                  <span className="text-text-slate">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlotTime(day.id, 'endTime', e.target.value)}
                    disabled={!slot.enabled}
                    className="px-2 py-1 bg-obsidian border border-baked-clay/30 rounded text-sand font-mono text-sm disabled:opacity-50"
                  />
                </div>
                
                {/* Hours for this day */}
                {slot.enabled && (
                  <span className="text-text-slate text-xs font-mono w-12 text-right">
                    {(() => {
                      const [startH, startM] = slot.startTime.split(':').map(Number)
                      const [endH, endM] = slot.endTime.split(':').map(Number)
                      const hours = (endH + endM / 60) - (startH + startM / 60)
                      return hours > 0 ? `${hours.toFixed(1)}h` : '0h'
                    })()}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-status-offline/20 border border-status-offline/50 rounded-lg">
          <p className="text-status-offline text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-status-active/20 border border-status-active/50 rounded-lg">
          <p className="text-status-active text-sm">{success}</p>
        </div>
      )}
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-rune flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Schedule
            </>
          )}
        </button>
      </div>
      
      {/* Note about hourly rate */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-sm flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Your hourly rate is set by your administrator and cannot be changed here.
            Contact your admin if you need to update your pay rate.
          </span>
        </p>
      </div>
    </div>
  )
}
