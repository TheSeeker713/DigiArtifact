'use client'

import { useTodayEntries } from '@/hooks/useTimeEntries'
import { useSettings } from '@/contexts/SettingsContext'

export default function RecentEntries() {
  const { data: todayEntries = [] } = useTodayEntries()
  const { formatTime, parseUTCTimestamp } = useSettings()

  const formatDuration = (clockIn: string, clockOut: string | null, breakMinutes: number) => {
    if (!clockOut) return 'In Progress'
    
    const start = parseUTCTimestamp(clockIn).getTime()
    const end = parseUTCTimestamp(clockOut).getTime()
    const minutes = Math.floor((end - start) / 60000) - breakMinutes
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    return `${hours}h ${mins}m`
  }

  return (
    <div className="card">
      <h3 className="font-heading text-lg text-sand mb-4">Today's Activity</h3>
      
      {todayEntries.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-text-slate/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-text-slate text-sm font-mono">No time entries today</p>
          <p className="text-text-slate/70 text-xs mt-1">Clock in to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-obsidian/50 rounded-lg border border-baked-clay/20"
            >
              <div className="flex items-center gap-3">
                {entry.project_color && (
                  <div
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: entry.project_color }}
                  />
                )}
                <div>
                  <p className="text-sand text-sm">
                    {entry.project_name || 'No Project'}
                  </p>
                  <p className="text-text-slate text-xs font-mono">
                    {formatTime(entry.clock_in)}
                    {entry.clock_out && ` - ${formatTime(entry.clock_out)}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm ${entry.clock_out ? 'text-relic-gold' : 'text-status-active'}`}>
                  {formatDuration(entry.clock_in, entry.clock_out, entry.break_minutes)}
                </p>
                {entry.break_minutes > 0 && (
                  <p className="text-text-slate text-xs font-mono">
                    {entry.break_minutes}m break
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
