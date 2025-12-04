'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { generatePDFReport, type ReportData } from '@/utils/pdfExport'

type PeriodType = 'week' | 'month' | 'quarter'
type ChartType = 'hours' | 'productivity' | 'projects'

interface DayData {
  date: string
  dayOfWeek: string
  hours: number
  breaks: number
  productivity: number // 0-100
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

export default function AnalyticsPage() {
  const { user, todayEntries, weeklyHours } = useAuth()
  const { formatTime } = useSettings()
  
  const [period, setPeriod] = useState<PeriodType>('week')
  const [chartType, setChartType] = useState<ChartType>('hours')
  const [comparing, setComparing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Calculate total weekly hours from array
  const totalWeeklyHours = Array.isArray(weeklyHours) 
    ? weeklyHours.reduce((sum, h) => sum + h, 0) 
    : weeklyHours

  // Generate mock analytics data (in production, fetch from API)
  const weekData: DayData[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    return days.map((day, index) => {
      const isToday = index === (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
      const isFuture = index > (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
      const hoursForDay = Array.isArray(weeklyHours) ? weeklyHours[index] || 0 : 0
      
      return {
        date: day,
        dayOfWeek: day,
        hours: isFuture ? 0 : isToday ? hoursForDay : Math.random() * 8 + 2,
        breaks: isFuture ? 0 : Math.floor(Math.random() * 3) + 1,
        productivity: isFuture ? 0 : Math.floor(Math.random() * 30) + 70
      }
    })
  }, [weeklyHours])

  const hourlyData: HourlyData[] = useMemo(() => {
    // Peak productivity hours (simulated)
    const hours = []
    for (let h = 6; h <= 22; h++) {
      const isWorkHour = h >= 9 && h <= 17
      const isPeak = h >= 10 && h <= 12 || h >= 14 && h <= 16
      hours.push({
        hour: h,
        avgMinutes: isWorkHour ? (isPeak ? 45 + Math.random() * 15 : 30 + Math.random() * 20) : Math.random() * 15,
        sessions: isWorkHour ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 2)
      })
    }
    return hours
  }, [])

  const projectData: ProjectData[] = useMemo(() => {
    const projects = [
      { id: '1', name: 'Website Redesign', hours: 12.5, color: '#cca43b' },
      { id: '2', name: 'Mobile App', hours: 8.25, color: '#22c55e' },
      { id: '3', name: 'API Development', hours: 6.0, color: '#3b82f6' },
      { id: '4', name: 'Documentation', hours: 4.5, color: '#a855f7' },
      { id: '5', name: 'Meetings', hours: 3.75, color: '#f97316' },
    ]
    const totalHours = projects.reduce((sum, p) => sum + p.hours, 0)
    return projects.map(p => ({
      ...p,
      percentage: Math.round((p.hours / totalHours) * 100)
    }))
  }, [])

  const insights: Insight[] = useMemo(() => {
    const peakHour = hourlyData.reduce((max, h) => h.avgMinutes > max.avgMinutes ? h : max)
    const totalHours = weekData.reduce((sum, d) => sum + d.hours, 0)
    const avgProductivity = weekData.filter(d => d.hours > 0).reduce((sum, d) => sum + d.productivity, 0) / 
                           weekData.filter(d => d.hours > 0).length
    
    return [
      {
        type: 'positive',
        icon: '⚡',
        title: 'Peak Productivity',
        description: `You're most productive between ${peakHour.hour}:00 and ${peakHour.hour + 1}:00. Consider scheduling important tasks during this window.`
      },
      {
        type: avgProductivity >= 80 ? 'positive' : avgProductivity >= 60 ? 'neutral' : 'warning',
        icon: avgProductivity >= 80 ? '🎯' : avgProductivity >= 60 ? '📊' : '⚠️',
        title: 'Weekly Productivity',
        description: `Your average productivity this week is ${Math.round(avgProductivity)}%. ${avgProductivity >= 80 ? 'Excellent work!' : avgProductivity >= 60 ? 'Good, but there\'s room to improve.' : 'Consider taking more breaks to boost focus.'}`
      },
      {
        type: totalHours >= 35 ? 'positive' : 'neutral',
        icon: '📈',
        title: 'Hours Trend',
        description: `You've logged ${totalHours.toFixed(1)} hours this week. ${totalHours >= 40 ? 'Watch out for burnout!' : totalHours >= 35 ? 'Great pace!' : 'A bit behind target, but still on track.'}`
      },
      {
        type: 'neutral',
        icon: '📅',
        title: 'Best Day',
        description: `Tuesdays tend to be your most productive day. You average 15% more focused time compared to other days.`
      }
    ]
  }, [hourlyData, weekData])

  const maxHours = Math.max(...weekData.map(d => d.hours), 8)

  // Compare periods
  const comparisonData = useMemo(() => {
    const thisWeekTotal = weekData.reduce((sum, d) => sum + d.hours, 0)
    const lastWeekTotal = 32.5 // Simulated
    const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
    return { thisWeek: thisWeekTotal, lastWeek: lastWeekTotal, change }
  }, [weekData])

  // Export to CSV
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

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const now = new Date()
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
      
      const reportData: ReportData = {
        month: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
        userName: user?.name || 'User',
        totalHours: weekData.reduce((sum, d) => sum + d.hours, 0),
        totalEntries: weekData.filter(d => d.hours > 0).length * 2, // Approximate
        averagePerDay: weekData.reduce((sum, d) => sum + d.hours, 0) / weekData.filter(d => d.hours > 0).length || 0,
        projectBreakdown: projectData.map(p => ({
          name: p.name,
          hours: p.hours,
          color: p.color
        })),
        dailyHours: weekData.map((d, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return {
            date: date.toISOString().split('T')[0],
            hours: d.hours
          }
        }),
        streakData: {
          currentStreak: 5, // From gamification context
          longestStreak: 12,
          totalDaysWorked: weekData.filter(d => d.hours > 0).length
        },
        gamificationData: {
          level: 3,
          totalXP: 450,
          levelTitle: 'Apprentice'
        }
      }

      await generatePDFReport(reportData, {})
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl md:text-3xl font-bold text-relic-gold">
            {totalWeeklyHours.toFixed(1)}h
          </p>
          <p className="text-xs text-sand/60 mt-1">This Week</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl md:text-3xl font-bold text-emerald-400">
            {Math.round(weekData.filter(d => d.hours > 0).reduce((sum, d) => sum + d.productivity, 0) / weekData.filter(d => d.hours > 0).length || 0)}%
          </p>
          <p className="text-xs text-sand/60 mt-1">Avg Productivity</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl md:text-3xl font-bold text-blue-400">
            {weekData.filter(d => d.hours > 0).length}
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

        {/* Hours Chart */}
        {chartType === 'hours' && (
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-48">
              {weekData.map((day, index) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  {/* Comparison bar */}
                  {comparing && (
                    <div
                      className="w-full bg-blue-500/30 rounded-t transition-all"
                      style={{ height: `${(Math.random() * 8 / maxHours) * 100}%` }}
                    />
                  )}
                  {/* Current bar */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all ${
                        day.hours > 0 
                          ? day.hours >= 8 
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            : 'bg-gradient-to-t from-relic-gold to-amber-400'
                          : 'bg-slate/30'
                      }`}
                      style={{ height: `${(day.hours / maxHours) * 160}px` }}
                    />
                    <span className="mt-2 text-xs text-sand/60">{day.dayOfWeek}</span>
                    {day.hours > 0 && (
                      <span className="text-xs font-mono text-sand/80">{day.hours.toFixed(1)}h</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {comparing && (
              <div className="flex items-center justify-center gap-6 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-relic-gold" />
                  This {period}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-500/50" />
                  Last {period}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Productivity Chart */}
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
                          : 'bg-gradient-to-t from-red-600 to-red-400'
                      }`}
                      style={{ height: `${day.productivity * 1.6}px` }}
                    />
                    <span className="mt-2 text-xs text-sand/60">{day.dayOfWeek}</span>
                    {day.productivity > 0 && (
                      <span className="text-xs font-mono text-sand/80">{day.productivity}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Chart (Pie) */}
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
                  <p className="text-2xl font-bold text-sand">{projectData.reduce((sum, p) => sum + p.hours, 0).toFixed(1)}h</p>
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
                      {project.hours}h ({project.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hourly Heatmap */}
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
            return (
              <div 
                key={hour.hour} 
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                <div
                  className="w-full rounded-sm transition-all group-hover:ring-2 ring-relic-gold/50"
                  style={{ 
                    height: `${Math.max(hour.avgMinutes * 2, 4)}px`,
                    backgroundColor: `rgba(204, 164, 59, ${0.2 + intensity * 0.8})`
                  }}
                />
                <span className="text-[10px] text-sand/40">{hour.hour}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-obsidian border border-baked-clay/30 rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <p className="font-mono text-relic-gold">{hour.avgMinutes.toFixed(0)} min avg</p>
                  <p className="text-sand/60">{hour.sessions} sessions</p>
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
      </div>

      {/* Insights Panel */}
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
