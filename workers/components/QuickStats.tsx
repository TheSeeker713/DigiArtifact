'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function QuickStats() {
  const { weeklyHours, todayEntries } = useAuth()

  // Calculate today's hours
  const todayHours = todayEntries.reduce((total, entry) => {
    if (!entry.clock_out) return total
    const clockIn = new Date(entry.clock_in).getTime()
    const clockOut = new Date(entry.clock_out).getTime()
    const breakMs = (entry.break_minutes || 0) * 60 * 1000
    return total + (clockOut - clockIn - breakMs) / 3600000
  }, 0)

  // Calculate week total
  const weekTotal = weeklyHours.reduce((a, b) => a + b, 0)

  // Calculate average (excluding days with 0 hours)
  const daysWorked = weeklyHours.filter((h) => h > 0).length
  const avgHours = daysWorked > 0 ? weekTotal / daysWorked : 0

  const stats = [
    {
      label: 'Today',
      value: `${todayHours.toFixed(1)}h`,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-hologram-cyan',
    },
    {
      label: 'This Week',
      value: `${weekTotal.toFixed(1)}h`,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'text-relic-gold',
    },
    {
      label: 'Daily Avg',
      value: `${avgHours.toFixed(1)}h`,
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'text-status-active',
    },
    {
      label: 'Entries',
      value: todayEntries.length.toString(),
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      color: 'text-baked-clay',
    },
  ]

  return (
    <div data-tutorial="quick-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card text-center">
          <svg className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
          </svg>
          <p className={`font-mono text-2xl ${stat.color}`}>{stat.value}</p>
          <p className="text-text-slate text-xs font-mono mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
