'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useRef, useMemo } from 'react'
import { generatePDFReport } from '@/utils/pdfExport'
import Cookies from 'js-cookie'

// Day labels for the week
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// API base URL
const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

interface WeeklyStats {
  hours: number[]
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
  const { user, weeklyHours, todayEntries, projects } = useAuth()
  const chartRef = useRef<HTMLDivElement>(null)
  
  // API data states
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [lastWeekStats, setLastWeekStats] = useState<WeeklyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const token = Cookies.get('workers_token')
      
      if (!token) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Fetch current week stats
        const weeklyRes = await fetch(`${API_BASE}/stats/weekly`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (weeklyRes.ok) {
          const weeklyData = await weeklyRes.json()
          setWeeklyStats(weeklyData)
        }

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

        // Fetch last week's data for comparison
        const lastWeekDate = new Date()
        lastWeekDate.setDate(lastWeekDate.getDate() - 7)
        // For now, we'll estimate last week based on monthly data or default to 0
        setLastWeekStats({ hours: [0, 0, 0, 0, 0, 0, 0] })

      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [user])

  // Process week data from API or context
  const weekData = useMemo(() => {
    // Use API data if available, otherwise fall back to context
    const hours = weeklyStats?.hours || weeklyHours || [0, 0, 0, 0, 0, 0, 0]
    const maxHours = Math.max(...hours, 1) // Avoid division by zero
    
    return dayLabels.map((day, index) => ({
      day,
      hours: hours[index] || 0,
      percentage: ((hours[index] || 0) / maxHours) * 100,
      isToday: index === (new Date().getDay() + 6) % 7 // Adjust for Monday start
    }))
  }, [weeklyStats, weeklyHours])

  // Calculate hourly distribution from today's entries
  const hourlyData = useMemo(() => {
    const hourBuckets = Array(24).fill(0)
    
    // Calculate from today's entries if available
    if (todayEntries && todayEntries.length > 0) {
      todayEntries.forEach(entry => {
        if (entry.clock_in) {
          const hour = new Date(entry.clock_in).getHours()
          // Calculate duration from clock_in to clock_out (or now if still active)
          const startTime = new Date(entry.clock_in).getTime()
          const endTime = entry.clock_out ? new Date(entry.clock_out).getTime() : Date.now()
          const durationMinutes = (endTime - startTime) / 1000 / 60 - (entry.break_minutes || 0)
          hourBuckets[hour] += durationMinutes / 60 // Convert minutes to hours
        }
      })
    }
    
    // Find peak hours (hours with activity)
    const maxActivity = Math.max(...hourBuckets, 0.1)
    
    return hourBuckets.map((activity, index) => ({
      hour: index,
      label: `${index.toString().padStart(2, '0')}:00`,
      activity,
      percentage: (activity / maxActivity) * 100,
      isPeak: activity === maxActivity && activity > 0
    }))
  }, [todayEntries])

  // Process project data from API or context
  const projectData = useMemo(() => {
    // Use API project breakdown if available
    if (monthlyStats?.projectBreakdown && monthlyStats.projectBreakdown.length > 0) {
      const total = monthlyStats.projectBreakdown.reduce((sum, p) => sum + p.hours, 0) || 1
      const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899']
      
      return monthlyStats.projectBreakdown.map((project, index) => ({
        name: project.project_name || 'Unassigned',
        hours: project.hours,
        percentage: (project.hours / total) * 100,
        color: colors[index % colors.length]
      }))
    }
    
    // Fall back to projects from context
    if (projects && projects.length > 0) {
      const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899']
      return projects.slice(0, 6).map((project, index) => ({
        name: project.name,
        hours: 0, // No hours tracked yet
        percentage: 0,
        color: colors[index % colors.length]
      }))
    }
    
    // No data available
    return [{
      name: 'No projects yet',
      hours: 0,
      percentage: 100,
      color: '#6B7280'
    }]
  }, [monthlyStats, projects])

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    const currentWeekTotal = weekData.reduce((sum, d) => sum + d.hours, 0)
    const lastWeekTotal = lastWeekStats?.hours?.reduce((sum, h) => sum + h, 0) || 0
    const percentChange = lastWeekTotal > 0 
      ? ((currentWeekTotal - lastWeekTotal) / lastWeekTotal * 100)
      : currentWeekTotal > 0 ? 100 : 0
    
    return {
      currentWeekTotal,
      lastWeekTotal,
      percentChange,
      isPositive: percentChange >= 0
    }
  }, [weekData, lastWeekStats])

  // Calculate insights
  const insights = useMemo(() => {
    const totalHours = monthlyStats?.totalHours || weekData.reduce((sum, d) => sum + d.hours, 0)
    const avgHoursPerDay = monthlyStats?.averagePerDay || (totalHours / 7)
    const peakHour = hourlyData.find(h => h.isPeak)
    const topProject = [...projectData].sort((a, b) => b.hours - a.hours)[0]
    
    // Find most productive day
    const mostProductiveDay = [...weekData].sort((a, b) => b.hours - a.hours)[0]
    
    return {
      totalHours: totalHours.toFixed(1),
      avgPerDay: avgHoursPerDay.toFixed(1),
      peakTime: peakHour?.label || 'No data',
      topProject: topProject?.name || 'None',
      mostProductiveDay: mostProductiveDay?.hours > 0 ? mostProductiveDay.day : 'No data',
      totalEntries: monthlyStats?.totalEntries || todayEntries?.length || 0
    }
  }, [monthlyStats, weekData, hourlyData, projectData, todayEntries])

  // Export functions
  const handleExportPDF = async () => {
    if (!chartRef.current) return
    
    // Build the ReportData object matching the expected interface
    const now = new Date()
    const monthStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    const reportData = {
      month: monthStr,
      userName: user?.name || 'User',
      totalHours: parseFloat(insights.totalHours),
      totalEntries: insights.totalEntries,
      averagePerDay: parseFloat(insights.avgPerDay),
      projectBreakdown: projectData.map(p => ({
        name: p.name,
        hours: p.hours,
        color: p.color
      })),
      dailyHours: monthlyStats?.dailyHours || weekData.map(d => ({
        date: d.day,
        hours: d.hours
      }))
    }
    
    // Get chart canvas elements for visual export
    const dailyChart = chartRef.current.querySelector('.daily-chart canvas') as HTMLCanvasElement | undefined
    const projectChart = chartRef.current.querySelector('.project-chart canvas') as HTMLCanvasElement | undefined
    
    await generatePDFReport(reportData, { dailyChart, projectChart })
  }

  const handleExportCSV = () => {
    // Weekly data CSV
    const weeklyCSV = [
      'Day,Hours,Percentage',
      ...weekData.map(d => `${d.day},${d.hours.toFixed(2)},${d.percentage.toFixed(1)}%`)
    ].join('\n')
    
    // Project data CSV
    const projectCSV = [
      '\nProject,Hours,Percentage',
      ...projectData.map(p => `${p.name},${p.hours.toFixed(2)},${p.percentage.toFixed(1)}%`)
    ].join('\n')
    
    // Summary CSV
    const summaryCSV = [
      '\nSummary',
      `Total Hours,${insights.totalHours}`,
      `Average Per Day,${insights.avgPerDay}`,
      `Peak Time,${insights.peakTime}`,
      `Top Project,${insights.topProject}`,
      `Total Entries,${insights.totalEntries}`
    ].join('\n')
    
    const fullCSV = weeklyCSV + projectCSV + summaryCSV
    
    const blob = new Blob([fullCSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto" ref={chartRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-slate-400">Track your productivity patterns and insights</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-1">Total Hours</div>
            <div className="text-2xl font-bold text-white">{insights.totalHours}</div>
            <div className={`text-sm ${comparisonData.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {comparisonData.isPositive ? '↑' : '↓'} {Math.abs(comparisonData.percentChange).toFixed(1)}% vs last week
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-1">Avg Per Day</div>
            <div className="text-2xl font-bold text-white">{insights.avgPerDay}h</div>
            <div className="text-sm text-slate-500">This month</div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-1">Peak Productivity</div>
            <div className="text-2xl font-bold text-white">{insights.peakTime}</div>
            <div className="text-sm text-slate-500">Most active hour</div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-1">Total Entries</div>
            <div className="text-2xl font-bold text-white">{insights.totalEntries}</div>
            <div className="text-sm text-slate-500">Time logs</div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Hours Chart */}
          <div className="chart-container bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Hours</h3>
            <div className="flex items-end justify-between h-48 gap-2">
              {weekData.map((day, index) => (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      day.isToday ? 'bg-amber-500' : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    style={{ 
                      height: `${Math.max(day.percentage, 2)}%`,
                      minHeight: '8px'
                    }}
                    title={`${day.hours.toFixed(1)} hours`}
                  />
                  <div className="text-xs text-slate-400 mt-2">{day.day}</div>
                  <div className="text-xs font-medium text-slate-300">{day.hours.toFixed(1)}h</div>
                </div>
              ))}
            </div>
            {weekData.every(d => d.hours === 0) && (
              <p className="text-center text-slate-500 mt-4 text-sm">No time tracked this week yet</p>
            )}
          </div>

          {/* Project Distribution */}
          <div className="chart-container bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Project Distribution</h3>
            <div className="space-y-3">
              {projectData.map((project, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{project.name}</span>
                    <span className="text-slate-400">{project.hours.toFixed(1)}h ({project.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(project.percentage, 1)}%`,
                        backgroundColor: project.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {projectData.length === 1 && projectData[0].hours === 0 && (
              <p className="text-center text-slate-500 mt-4 text-sm">No project hours tracked yet</p>
            )}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="chart-container bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Activity by Hour</h3>
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
            {hourlyData.map((hour) => (
              <div key={hour.hour} className="flex flex-col items-center min-w-[30px]">
                <div 
                  className={`w-6 rounded-t transition-all duration-300 ${
                    hour.isPeak ? 'bg-amber-500' : hour.activity > 0 ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  style={{ 
                    height: `${Math.max(hour.percentage, 3)}%`,
                    minHeight: '4px'
                  }}
                  title={`${hour.label}: ${hour.activity.toFixed(1)} hours`}
                />
                <div className="text-xs text-slate-500 mt-1">{hour.hour}</div>
              </div>
            ))}
          </div>
          {hourlyData.every(h => h.activity === 0) && (
            <p className="text-center text-slate-500 mt-2 text-sm">No activity logged today</p>
          )}
        </div>

        {/* Insights Summary */}
        <div className="bg-gradient-to-r from-amber-900/30 to-slate-800/50 backdrop-blur rounded-xl p-6 border border-amber-700/30">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Insights Summary</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-amber-400 font-medium mb-1">Most Productive Day</div>
              <div className="text-white text-lg">{insights.mostProductiveDay}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-emerald-400 font-medium mb-1">Top Project</div>
              <div className="text-white text-lg">{insights.topProject}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-blue-400 font-medium mb-1">Weekly Progress</div>
              <div className="text-white text-lg">
                {comparisonData.currentWeekTotal.toFixed(1)}h / {comparisonData.lastWeekTotal.toFixed(1)}h
              </div>
            </div>
          </div>
          
          {comparisonData.currentWeekTotal === 0 && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-center">
              <p className="text-slate-400">
                Start tracking your time to see insights and patterns! 
                <br />
                <span className="text-sm">Use the timer or manual entry to log your work sessions.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          Last updated: {new Date().toLocaleString()} • Data synced from your time entries
        </div>
      </div>
    </div>
  )
}
