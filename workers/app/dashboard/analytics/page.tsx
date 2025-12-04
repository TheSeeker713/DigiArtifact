'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { generatePDFReport, type ReportData } from '@/utils/pdfExport'
import Cookies from 'js-cookie'

type PeriodType = 'week' | 'month' | 'quarter'
type ChartType = 'hours' | 'productivity' | 'projects'

// API base URL
const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

interface DayData {
  date: string
  dayOfWeek: string
  hours: number
  breaks: number
  productivity: number
}

interface HourlyData {
  hour: number
  avgMinutes: number
  sessions: number
}

interface ProjectData {
  id: string
  name: string
  hours: number
  color: string
  percentage: number
}

interface Insight {
  type: 'positive' | 'neutral' | 'warning'
  icon: string
  title: string
  description: string
}

interface MonthlyStats {
  totalHours: number
  totalEntries: number
  averagePerDay: number
  projectBreakdown: Array<{
    project_id: string | null
    project_name: string | null
    hours: number
  }>
  dailyHours: Array<{
    date: string
    hours: number
  }>
}

export default function AnalyticsPage() {
  const { user, todayEntries, weeklyHours } = useAuth()
  const { formatTime } = useSettings()

  const [period, setPeriod] = useState<PeriodType>('week')
  const [chartType, setChartType] = useState<ChartType>('hours')
  const [comparing, setComparing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Real API data states
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [hourlyDistribution, setHourlyDistribution] = useState<number[]>(Array(24).fill(0))

  // Fetch real data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const token = Cookies.get('workers_token')
      
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch current month stats
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const monthlyRes = await fetch(`${API_BASE}/stats/monthly?month=${currentMonth}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (monthlyRes.ok) {
          const monthlyData = await monthlyRes.json()
          setMonthlyStats(monthlyData)
        }

        // Calculate hourly distribution from today's entries
        if (todayEntries && todayEntries.length > 0) {
          const hourBuckets = Array(24).fill(0)
          todayEntries.forEach(entry => {
            if (entry.clock_in) {
              const startHour = new Date(entry.clock_in).getHours()
              const startTime = new Date(entry.clock_in).getTime()
              const endTime = entry.clock_out ? new Date(entry.clock_out).getTime() : Date.now()
              const durationMinutes = Math.max(0, (endTime - startTime) / 1000 / 60 - (entry.break_minutes || 0))
              
              // Distribute across hours
              let remainingMinutes = durationMinutes
              let currentHour = startHour
              
              while (remainingMinutes > 0 && currentHour < 24) {
                const minutesInThisHour = Math.min(remainingMinutes, 60)
                hourBuckets[currentHour] += minutesInThisHour
                remainingMinutes -= minutesInThisHour
                currentHour++
              }
            }
          })
          setHourlyDistribution(hourBuckets)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [todayEntries])

  // Calculate total weekly hours from real data
  const totalWeeklyHours = Array.isArray(weeklyHours)
    ? weeklyHours.reduce((sum, h) => sum + h, 0)
    : weeklyHours || 0

  // Generate week data from REAL weeklyHours array
  const weekData: DayData[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const dayOfWeek = today.getDay()
    const hours = Array.isArray(weeklyHours) ? weeklyHours : [0, 0, 0, 0, 0, 0, 0]

    return days.map((day, index) => {
      const dayHours = hours[index] || 0
      // Calculate productivity based on hours worked (realistic metric)
      const productivity = dayHours > 0 ? Math.min(100, Math.round((dayHours / 8) * 100)) : 0

      return {
        date: day,
        dayOfWeek: day,
        hours: dayHours,
        breaks: dayHours > 4 ? Math.ceil(dayHours / 4) : 0, // Estimate breaks
        productivity: productivity
      }
    })
  }, [weeklyHours])

  // Calculate average productivity from real data
  const avgProductivity = useMemo(() => {
    const daysWithHours = weekData.filter(d => d.hours > 0)
    if (daysWithHours.length === 0) return 0
    return Math.round(daysWithHours.reduce((sum, d) => sum + d.productivity, 0) / daysWithHours.length)
  }, [weekData])

  // Days worked this week
  const daysWorked = weekData.filter(d => d.hours > 0).length

  // Generate REAL hourly data from calculated distribution
  const hourlyData: HourlyData[] = useMemo(() => {
    return hourlyDistribution.map((minutes, hour) => ({
      hour,
      avgMinutes: minutes,
      sessions: minutes > 0 ? Math.ceil(minutes / 60) : 0
    })).filter(h => h.hour >= 6 && h.hour <= 22) // Only show 6 AM to 10 PM
  }, [hourlyDistribution])

  // Generate REAL project data from API
  const projectData: ProjectData[] = useMemo(() => {
    const colors = ['#cca43b', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899']
    
    if (monthlyStats?.projectBreakdown && monthlyStats.projectBreakdown.length > 0) {
      const totalHours = monthlyStats.projectBreakdown.reduce((sum, p) => sum + p.hours, 0) || 1
      
      return monthlyStats.projectBreakdown.map((project, index) => ({
        id: project.project_id || `unassigned-${index}`,
        name: project.project_name || 'Unassigned',
        hours: project.hours,
        color: colors[index % colors.length],
        percentage: Math.round((project.hours / totalHours) * 100)
      }))
    }
    
    // No data - show empty state
    return [{
      id: 'none',
      name: 'No projects tracked',
      hours: 0,
      color: '#6b7280',
      percentage: 100
    }]
  }, [monthlyStats])

  // Generate REAL insights based on actual data
  const insights: Insight[] = useMemo(() => {
    // Find peak hour from real data
    const peakHourData = hourlyData.reduce((max, h) => h.avgMinutes > max.avgMinutes ? h : max, { hour: 0, avgMinutes: 0, sessions: 0 })
    const peakHour = peakHourData.avgMinutes > 0 ? peakHourData.hour : null
    
    // Find best day from real data
    const bestDay = [...weekData].sort((a, b) => b.hours - a.hours)[0]
    const bestDayName = bestDay?.hours > 0 ? bestDay.dayOfWeek : null
    
    // Calculate week comparison
    const currentWeekHours = totalWeeklyHours
    const targetHours = 40 // Standard work week

    const insightsList: Insight[] = []

    // Peak productivity insight
    if (peakHour !== null) {
      insightsList.push({
        type: 'positive',
        icon: '⚡',
        title: 'Peak Productivity',
        description: `You're most productive between ${peakHour}:00 and ${peakHour + 1}:00. Consider scheduling important tasks during this window.`
      })
    } else {
      insightsList.push({
        type: 'neutral',
        icon: '⏰',
        title: 'Peak Productivity',
        description: 'Start tracking more time to discover your peak productivity hours.'
      })
    }

    // Weekly productivity insight
    if (avgProductivity > 0) {
      insightsList.push({
        type: avgProductivity >= 80 ? 'positive' : avgProductivity >= 60 ? 'neutral' : 'warning',
        icon: avgProductivity >= 80 ? '🎯' : avgProductivity >= 60 ? '📈' : '⚠️',
        title: 'Weekly Productivity',
        description: `Your average productivity this week is ${avgProductivity}%. ${avgProductivity >= 80 ? 'Excellent work!' : avgProductivity >= 60 ? 'Good pace, keep it up!' : 'Consider breaking work into focused sessions.'}`
      })
    } else {
      insightsList.push({
        type: 'neutral',
        icon: '📊',
        title: 'Weekly Productivity',
        description: 'No productivity data yet. Start tracking to see your weekly stats.'
      })
    }

    // Hours trend insight
    insightsList.push({
      type: currentWeekHours >= targetHours ? 'positive' : currentWeekHours >= targetHours * 0.75 ? 'neutral' : 'warning',
      icon: '📅',
      title: 'Hours Trend',
      description: currentWeekHours > 0 
        ? `You've logged ${currentWeekHours.toFixed(1)} hours this week. ${currentWeekHours >= targetHours ? 'Great job hitting your target!' : currentWeekHours >= targetHours * 0.75 ? 'Almost there!' : 'A bit behind target, but still on track.'}`
        : 'No hours logged this week yet. Start tracking to see your progress.'
    })

    // Best day insight
    if (bestDayName) {
      const avgOtherDays = weekData.filter(d => d.dayOfWeek !== bestDayName && d.hours > 0)
      const avgOtherHours = avgOtherDays.length > 0 
        ? avgOtherDays.reduce((sum, d) => sum + d.hours, 0) / avgOtherDays.length 
        : 0
      const percentBetter = avgOtherHours > 0 ? Math.round(((bestDay.hours - avgOtherHours) / avgOtherHours) * 100) : 0

      insightsList.push({
        type: 'neutral',
        icon: '📆',
        title: 'Best Day',
        description: `${bestDayName}s tend to be your most productive day${percentBetter > 0 ? `. You average ${percentBetter}% more focused time compared to other days.` : '.'}`
      })
    } else {
      insightsList.push({
        type: 'neutral',
        icon: '📆',
        title: 'Best Day',
        description: 'Track more days to discover your most productive day of the week.'
      })
    }

    return insightsList
  }, [hourlyData, weekData, totalWeeklyHours, avgProductivity])

  const maxHours = Math.max(...weekData.map(d => d.hours), 8)

  // Calculate comparison data from real stats
  const comparisonData = useMemo(() => {
    const thisWeekTotal = totalWeeklyHours
    // For comparison, we'd need last week's data - for now show 0 if no history
    const lastWeekTotal = monthlyStats?.totalHours ? Math.max(0, monthlyStats.totalHours - thisWeekTotal) : 0
    const change = lastWeekTotal > 0 
      ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 
      : thisWeekTotal > 0 ? 100 : 0
    return { thisWeek: thisWeekTotal, lastWeek: lastWeekTotal, change }
  }, [totalWeeklyHours, monthlyStats])

  // Export to CSV with REAL data
  const handleExportCSV = () => {
    const headers = ['Date', 'Hours', 'Breaks', 'Productivity']
    const rows = weekData.map(d => [d.date, d.hours.toFixed(2), d.breaks.toString(), `${d.productivity}%`])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export to PDF with REAL data
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const now = new Date()
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

      const reportData: ReportData = {
        month: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
        userName: user?.name || 'User',
        totalHours: totalWeeklyHours,
        totalEntries: monthlyStats?.totalEntries || todayEntries?.length || 0,
        averagePerDay: monthlyStats?.averagePerDay || (totalWeeklyHours / Math.max(daysWorked, 1)),
        projectBreakdown: projectData.filter(p => p.id !== 'none').map(p => ({
          name: p.name,
          hours: p.hours,
          color: p.color
        })),
        dailyHours: monthlyStats?.dailyHours || weekData.map((d, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return {
            date: date.toISOString().split('T')[0],
            hours: d.hours
          }
        })
      }

      await generatePDFReport(reportData, {})
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-relic-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sand/60">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-relic-gold">
            Analytics & Insights
          </h1>
          <p className="text-sand/60 mt-1">
            Understand your work patterns and optimize productivity
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          {(['week', 'month', 'quarter'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                period === p
                  ? 'bg-relic-gold text-obsidian'
                  : 'bg-slate/30 text-sand/70 hover:bg-slate/50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview - REAL DATA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl md:text-3xl font-bold text-relic-gold">
            {totalWeeklyHours.toFixed(1)}h
          </p>
          <p className="text-xs text-sand/60 mt-1">This Week</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl md:text-3xl font-bold text-emerald-400">
            {avgProductivity}%
          </p>
          <p className="text-xs text-sand/60 mt-1">Avg Productivity</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl md:text-3xl font-bold text-blue-400">
            {daysWorked}
          </p>
          <p className="text-xs text-sand/60 mt-1">Days Worked</p>
        </div>
        <div className="card text-center relative overflow-hidden">
          <p className={`text-2xl md:text-3xl font-bold ${comparisonData.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {comparisonData.change >= 0 ? '+' : ''}{comparisonData.change.toFixed(0)}%
          </p>
          <p className="text-xs text-sand/60 mt-1">vs Last Week</p>
          {comparisonData.change >= 0 ? (
            <svg className="absolute top-2 right-2 w-4 h-4 text-emerald-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ) : (
            <svg className="absolute top-2 right-2 w-4 h-4 text-red-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          )}
        </div>
      </div>

      {/* Main Chart */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="font-display text-lg font-semibold text-relic-gold">
            Weekly Overview
          </h2>
          <div className="flex items-center gap-2">
            {(['hours', 'productivity', 'projects'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  chartType === type
                    ? 'bg-relic-gold/20 text-relic-gold border border-relic-gold/30'
                    : 'bg-slate/20 text-sand/60 hover:text-sand'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setComparing(!comparing)}
              className={`ml-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                comparing
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate/20 text-sand/60 hover:text-sand'
              }`}
            >
              Compare
            </button>
          </div>
        </div>

        {/* Hours Chart - REAL DATA */}
        {chartType === 'hours' && (
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-48">
              {weekData.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all ${
                        day.hours > 0
                          ? day.hours >= 8
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            : 'bg-gradient-to-t from-relic-gold to-amber-400'
                          : 'bg-slate/30'
                      }`}
                      style={{ height: `${Math.max((day.hours / maxHours) * 160, day.hours > 0 ? 8 : 4)}px` }}
                    />
                    <span className="mt-2 text-xs text-sand/60">{day.dayOfWeek}</span>
                    <span className="text-xs font-mono text-sand/80">
                      {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {totalWeeklyHours === 0 && (
              <p className="text-center text-sand/50 text-sm">No hours tracked this week yet</p>
            )}
          </div>
        )}

        {/* Productivity Chart - REAL DATA */}
        {chartType === 'productivity' && (
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-48">
              {weekData.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all ${
                        day.productivity >= 80
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : day.productivity >= 60
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : day.productivity > 0
                          ? 'bg-gradient-to-t from-red-600 to-red-400'
                          : 'bg-slate/30'
                      }`}
                      style={{ height: `${Math.max(day.productivity * 1.6, day.productivity > 0 ? 8 : 4)}px` }}
                    />
                    <span className="mt-2 text-xs text-sand/60">{day.dayOfWeek}</span>
                    <span className="text-xs font-mono text-sand/80">
                      {day.productivity > 0 ? `${day.productivity}%` : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {avgProductivity === 0 && (
              <p className="text-center text-sand/50 text-sm">No productivity data yet</p>
            )}
          </div>
        )}

        {/* Projects Chart - REAL DATA */}
        {chartType === 'projects' && (
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Donut Chart */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {projectData.reduce((acc, project, index) => {
                  const prevOffset = acc.offset
                  const strokeDasharray = `${project.percentage * 2.51} ${251 - project.percentage * 2.51}`
                  acc.elements.push(
                    <circle
                      key={project.id}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={project.color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={-prevOffset}
                      className="transition-all duration-500"
                    />
                  )
                  acc.offset += project.percentage * 2.51
                  return acc
                }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-sand">
                    {projectData.reduce((sum, p) => sum + p.hours, 0).toFixed(1)}h
                  </p>
                  <p className="text-xs text-sand/60">Total</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {projectData.map((project) => (
                <div key={project.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-sand">{project.name}</span>
                    <span className="text-sm font-mono text-sand/60">
                      {project.hours > 0 ? `${project.hours.toFixed(1)}h (${project.percentage}%)` : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hourly Heatmap - REAL DATA */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-relic-gold mb-4">
          Peak Hours Heatmap
        </h2>
        <p className="text-sm text-sand/60 mb-4">
          When you&apos;re most active throughout the day
        </p>

        <div className="flex items-end gap-1 h-32">
          {hourlyData.map((hour) => {
            const intensity = hour.avgMinutes / 60
            const hasData = hour.avgMinutes > 0
            return (
              <div
                key={hour.hour}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                <div
                  className="w-full rounded-sm transition-all group-hover:ring-2 ring-relic-gold/50"
                  style={{
                    height: `${Math.max(hour.avgMinutes * 2, 4)}px`,
                    backgroundColor: hasData 
                      ? `rgba(204, 164, 59, ${0.2 + intensity * 0.8})`
                      : 'rgba(100, 116, 139, 0.2)'
                  }}
                />
                <span className="text-[10px] text-sand/40">{hour.hour}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-obsidian border border-baked-clay/30 rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <p className="font-mono text-relic-gold">
                    {hasData ? `${hour.avgMinutes.toFixed(0)} min` : 'No data'}
                  </p>
                  {hasData && <p className="text-sand/60">{hour.sessions} session(s)</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-sand/60">
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>10 PM</span>
        </div>
        
        {hourlyDistribution.every(h => h === 0) && (
          <p className="text-center text-sand/50 text-sm mt-4">
            No hourly data yet. Start tracking to see your peak hours.
          </p>
        )}
      </div>

      {/* Insights Panel - REAL DATA */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-relic-gold mb-4">
          💡 Smart Insights
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                insight.type === 'positive'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : insight.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-slate/30 border-baked-clay/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h3 className={`font-semibold ${
                    insight.type === 'positive'
                      ? 'text-emerald-400'
                      : insight.type === 'warning'
                      ? 'text-amber-400'
                      : 'text-sand'
                  }`}>
                    {insight.title}
                  </h3>
                  <p className="text-sm text-sand/70 mt-1">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-relic-gold">
              Export Data
            </h2>
            <p className="text-sm text-sand/60 mt-1">
              Download your analytics data for external analysis
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate/30 text-sand hover:bg-slate/50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-slate/30 text-sand hover:bg-slate/50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
