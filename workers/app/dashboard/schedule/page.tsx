'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'

interface ScheduledShift {
  id: string
  date: string // YYYY-MM-DD
  startTime: number // minutes from midnight
  endTime: number // minutes from midnight
  breakMinutes: number
  notes?: string
  status: 'draft' | 'published' | 'acknowledged'
}

interface PayrollEstimate {
  regularHours: number
  overtimeHours: number
  regularPay: number
  overtimePay: number
  totalPay: number
}

// Demo scheduled shifts (in production, these would come from API)
const DEMO_SHIFTS: ScheduledShift[] = [
  { id: '1', date: getDateString(0), startTime: 540, endTime: 1020, breakMinutes: 30, status: 'published' },
  { id: '2', date: getDateString(1), startTime: 540, endTime: 1020, breakMinutes: 30, status: 'published' },
  { id: '3', date: getDateString(2), startTime: 600, endTime: 1080, breakMinutes: 60, status: 'draft' },
  { id: '4', date: getDateString(4), startTime: 480, endTime: 960, breakMinutes: 30, status: 'published' },
]

function getDateString(daysFromToday: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().split('T')[0]
}

export default function SchedulePage() {
  const { user } = useAuth()
  const { formatDate } = useSettings()
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()))
  const [shifts, setShifts] = useState<ScheduledShift[]>(DEMO_SHIFTS)
  const [selectedShift, setSelectedShift] = useState<ScheduledShift | null>(null)
  const [showPayrollEstimate, setShowPayrollEstimate] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(17.25) // Default hourly rate

  // Load shifts from localStorage (simulating API)
  useEffect(() => {
    const saved = localStorage.getItem('workers_schedule_shifts')
    if (saved) {
      try {
        setShifts([...DEMO_SHIFTS, ...JSON.parse(saved)])
      } catch {
        setShifts(DEMO_SHIFTS)
      }
    }
  }, [])

  // Generate week days starting from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart)
    next.setDate(next.getDate() + 7)
    setCurrentWeekStart(next)
  }

  const goToPrevWeek = () => {
    const prev = new Date(currentWeekStart)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeekStart(prev)
  }

  const goToThisWeek = () => {
    setCurrentWeekStart(getMonday(new Date()))
  }

  const getShiftForDate = (date: Date): ScheduledShift | undefined => {
    const dateStr = date.toISOString().split('T')[0]
    return shifts.find(s => s.date === dateStr)
  }

  const formatTimeFromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
  }

  const calculatePayroll = (): PayrollEstimate => {
    const weekStart = currentWeekStart.toISOString().split('T')[0]
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    let totalMinutes = 0
    shifts
      .filter(s => s.date >= weekStart && s.date <= weekEndStr)
      .forEach(shift => {
        const workMinutes = shift.endTime - shift.startTime - shift.breakMinutes
        totalMinutes += workMinutes
      })

    const totalHours = totalMinutes / 60
    const regularHours = Math.min(totalHours, 40)
    const overtimeHours = Math.max(totalHours - 40, 0)
    const regularPay = regularHours * hourlyRate
    const overtimePay = overtimeHours * hourlyRate * 1.5
    const totalPay = regularPay + overtimePay

    return {
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      totalPay,
    }
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl text-sand mb-2">Schedule</h1>
          <p className="text-text-slate font-mono text-sm">
            View your upcoming shifts and payroll estimates
          </p>
        </div>
        <button
          onClick={() => setShowPayrollEstimate(true)}
          className="btn-rune flex items-center gap-2 self-start"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Payroll Estimate
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevWeek}
          className="p-2 rounded-lg bg-obsidian/50 border border-baked-clay/30 hover:border-relic-gold/50 transition-colors"
          aria-label="Previous week"
        >
          <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="font-heading text-xl text-sand">
            {formatDate(currentWeekStart)} - {formatDate(weekDays[6])}
          </h2>
          <button
            onClick={goToThisWeek}
            className="text-xs font-mono text-relic-gold hover:underline"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg bg-obsidian/50 border border-baked-clay/30 hover:border-relic-gold/50 transition-colors"
          aria-label="Next week"
        >
          <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {/* Day Headers */}
        {dayNames.map((day, index) => (
          <div 
            key={day} 
            className={`text-center py-2 font-mono text-sm ${
              index >= 5 ? 'text-text-slate/50' : 'text-sand'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Day Cells */}
        {weekDays.map((date, index) => {
          const shift = getShiftForDate(date)
          const today = isToday(date)
          const past = isPast(date)
          
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[120px] p-3 rounded-lg border transition-all ${
                today
                  ? 'bg-relic-gold/10 border-relic-gold'
                  : past
                  ? 'bg-obsidian/20 border-baked-clay/20'
                  : 'bg-obsidian/40 border-baked-clay/30 hover:border-relic-gold/30'
              } ${shift ? 'cursor-pointer' : ''}`}
              onClick={() => shift && setSelectedShift(shift)}
            >
              {/* Date Number */}
              <div className={`text-sm font-mono mb-2 ${today ? 'text-relic-gold font-bold' : 'text-text-slate'}`}>
                {date.getDate()}
              </div>

              {/* Shift Display */}
              {shift && (
                <div
                  className={`p-2 rounded text-xs ${
                    shift.status === 'draft'
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : shift.status === 'acknowledged'
                      ? 'bg-green-500/20 border border-green-500/30'
                      : 'bg-relic-gold/20 border border-relic-gold/30'
                  }`}
                >
                  <p className="font-mono text-sand">
                    {formatTimeFromMinutes(shift.startTime)}
                  </p>
                  <p className="font-mono text-text-slate/70">
                    to {formatTimeFromMinutes(shift.endTime)}
                  </p>
                  <p className="text-text-slate/50 mt-1">
                    {((shift.endTime - shift.startTime - shift.breakMinutes) / 60).toFixed(1)}h
                  </p>
                </div>
              )}

              {/* No Shift - Day Off */}
              {!shift && !past && (
                <div className="text-center text-text-slate/30 text-xs font-mono py-4">
                  Off
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Week Summary */}
      <div className="card">
        <h3 className="font-heading text-lg text-sand mb-4">Week Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-obsidian/30">
            <p className="text-2xl font-heading text-relic-gold">
              {shifts.filter(s => {
                const weekStart = currentWeekStart.toISOString().split('T')[0]
                const weekEnd = new Date(currentWeekStart)
                weekEnd.setDate(weekEnd.getDate() + 6)
                return s.date >= weekStart && s.date <= weekEnd.toISOString().split('T')[0]
              }).length}
            </p>
            <p className="text-text-slate text-sm font-mono">Shifts</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-obsidian/30">
            <p className="text-2xl font-heading text-green-400">
              {calculatePayroll().regularHours.toFixed(1)}h
            </p>
            <p className="text-text-slate text-sm font-mono">Regular</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-obsidian/30">
            <p className="text-2xl font-heading text-yellow-400">
              {calculatePayroll().overtimeHours.toFixed(1)}h
            </p>
            <p className="text-text-slate text-sm font-mono">Overtime</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-obsidian/30">
            <p className="text-2xl font-heading text-cyan-400">
              ${calculatePayroll().totalPay.toFixed(2)}
            </p>
            <p className="text-text-slate text-sm font-mono">Est. Pay</p>
          </div>
        </div>
      </div>

      {/* Shift Detail Modal */}
      {selectedShift && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl text-relic-gold">Shift Details</h3>
              <button
                onClick={() => setSelectedShift(null)}
                className="p-2 rounded-lg hover:bg-obsidian/50"
              >
                <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Date</span>
                <span className="text-sand font-mono">{formatDate(new Date(selectedShift.date))}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Start Time</span>
                <span className="text-sand font-mono">{formatTimeFromMinutes(selectedShift.startTime)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">End Time</span>
                <span className="text-sand font-mono">{formatTimeFromMinutes(selectedShift.endTime)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Break</span>
                <span className="text-sand font-mono">{selectedShift.breakMinutes} min</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Total Hours</span>
                <span className="text-relic-gold font-mono font-bold">
                  {((selectedShift.endTime - selectedShift.startTime - selectedShift.breakMinutes) / 60).toFixed(1)}h
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Status</span>
                <span className={`font-mono text-sm px-2 py-1 rounded ${
                  selectedShift.status === 'draft' 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : selectedShift.status === 'acknowledged'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-relic-gold/20 text-relic-gold'
                }`}>
                  {selectedShift.status.charAt(0).toUpperCase() + selectedShift.status.slice(1)}
                </span>
              </div>
            </div>

            {selectedShift.status === 'published' && (
              <button
                onClick={() => {
                  setShifts(prev => prev.map(s => 
                    s.id === selectedShift.id ? { ...s, status: 'acknowledged' } : s
                  ))
                  setSelectedShift({ ...selectedShift, status: 'acknowledged' })
                }}
                className="btn-rune w-full mt-6"
              >
                Acknowledge Shift
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payroll Estimate Modal */}
      {showPayrollEstimate && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl text-relic-gold">Payroll Estimate</h3>
              <button
                onClick={() => setShowPayrollEstimate(false)}
                className="p-2 rounded-lg hover:bg-obsidian/50"
              >
                <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Hourly Rate Setting */}
            <div className="mb-6">
              <label className="block text-sand text-sm font-mono mb-2">Hourly Rate</label>
              <div className="flex items-center gap-2">
                <span className="text-relic-gold">$</span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  step="0.25"
                  min="0"
                  className="input-field flex-1"
                />
              </div>
            </div>

            {/* Payroll Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Regular Hours</span>
                <span className="text-sand font-mono">{calculatePayroll().regularHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Regular Pay</span>
                <span className="text-green-400 font-mono">${calculatePayroll().regularPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Overtime Hours (1.5x)</span>
                <span className="text-sand font-mono">{calculatePayroll().overtimeHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-obsidian/30">
                <span className="text-text-slate">Overtime Pay</span>
                <span className="text-yellow-400 font-mono">${calculatePayroll().overtimePay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-lg bg-relic-gold/10 border border-relic-gold/30">
                <span className="text-sand font-bold">Estimated Total</span>
                <span className="text-relic-gold font-mono text-xl font-bold">
                  ${calculatePayroll().totalPay.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-text-slate/60 text-xs text-center font-mono">
              * This is an estimate before taxes and deductions
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
