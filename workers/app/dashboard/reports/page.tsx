'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Chart, registerables } from 'chart.js'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subMonths, addMonths } from 'date-fns'
import Cookies from 'js-cookie'

Chart.register(...registerables)

interface MonthlyStats {
  totalHours: number
  totalEntries: number
  averagePerDay: number
  projectBreakdown: { name: string; hours: number; color: string }[]
  dailyHours: { date: string; hours: number }[]
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [monthOffset, setMonthOffset] = useState(0)
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const lineChartInstance = useRef<Chart | null>(null)
  const pieChartInstance = useRef<Chart | null>(null)

  const currentMonth = subMonths(new Date(), -monthOffset)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  useEffect(() => {
    fetchMonthlyStats()
  }, [monthOffset])

  useEffect(() => {
    if (stats && lineChartRef.current && pieChartRef.current) {
      renderCharts()
    }
    
    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy()
      if (pieChartInstance.current) pieChartInstance.current.destroy()
    }
  }, [stats])

  const fetchMonthlyStats = async () => {
    setIsLoading(true)
    try {
      const token = Cookies.get('workers_token')
      const response = await fetch(
        `/api/stats/monthly?month=${format(currentMonth, 'yyyy-MM')}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderCharts = () => {
    if (!stats) return

    // Destroy existing charts
    if (lineChartInstance.current) lineChartInstance.current.destroy()
    if (pieChartInstance.current) pieChartInstance.current.destroy()

    // Daily hours line chart
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d')
      if (ctx) {
        lineChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: stats.dailyHours.map(d => format(parseISO(d.date), 'd')),
            datasets: [{
              label: 'Hours',
              data: stats.dailyHours.map(d => d.hours),
              borderColor: '#cca43b',
              backgroundColor: 'rgba(204, 164, 59, 0.1)',
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#cca43b',
              pointBorderColor: '#0a0a0a',
              pointBorderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1e1e24',
                titleColor: '#e3d5ca',
                bodyColor: '#cca43b',
                borderColor: '#9f5f3f',
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { family: 'Space Mono' } },
              },
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(159, 95, 63, 0.2)' },
                ticks: { color: '#94a3b8', font: { family: 'Space Mono' }, callback: (v) => `${v}h` },
              },
            },
          },
        })
      }
    }

    // Project breakdown pie chart
    if (pieChartRef.current && stats.projectBreakdown.length > 0) {
      const ctx = pieChartRef.current.getContext('2d')
      if (ctx) {
        pieChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: stats.projectBreakdown.map(p => p.name),
            datasets: [{
              data: stats.projectBreakdown.map(p => p.hours),
              backgroundColor: stats.projectBreakdown.map(p => p.color),
              borderColor: '#0a0a0a',
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: '#e3d5ca',
                  font: { family: 'Space Mono', size: 11 },
                  padding: 12,
                },
              },
              tooltip: {
                backgroundColor: '#1e1e24',
                titleColor: '#e3d5ca',
                bodyColor: '#cca43b',
                borderColor: '#9f5f3f',
                borderWidth: 1,
                callbacks: {
                  label: (context) => `${context.parsed.toFixed(1)} hours`,
                },
              },
            },
          },
        })
      }
    }
  }

  const exportToCSV = () => {
    if (!stats) return
    
    const headers = ['Date', 'Hours']
    const rows = stats.dailyHours.map(d => [d.date, d.hours.toFixed(2)])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${format(currentMonth, 'yyyy-MM')}.csv`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-sand mb-2">Reports</h1>
          <p className="text-text-slate font-mono text-sm">
            Monthly analytics and time breakdowns
          </p>
        </div>
        <button onClick={exportToCSV} className="btn-hologram flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Month Navigation */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonthOffset(monthOffset - 1)}
            className="btn-hologram px-4 py-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <p className="font-heading text-2xl text-sand">
              {format(currentMonth, 'MMMM yyyy')}
            </p>
            {monthOffset === 0 && (
              <p className="text-hologram-cyan text-xs font-mono">Current Month</p>
            )}
          </div>
          
          <button
            onClick={() => setMonthOffset(monthOffset + 1)}
            disabled={monthOffset >= 0}
            className="btn-hologram px-4 py-2 disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-relic-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <p className="text-text-slate font-mono text-sm mb-2">Total Hours</p>
              <p className="text-relic-gold font-mono text-4xl">{stats.totalHours.toFixed(1)}</p>
            </div>
            <div className="card text-center">
              <p className="text-text-slate font-mono text-sm mb-2">Time Entries</p>
              <p className="text-hologram-cyan font-mono text-4xl">{stats.totalEntries}</p>
            </div>
            <div className="card text-center">
              <p className="text-text-slate font-mono text-sm mb-2">Daily Average</p>
              <p className="text-status-active font-mono text-4xl">{stats.averagePerDay.toFixed(1)}h</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="font-heading text-lg text-sand mb-4">Daily Hours</h3>
              <div className="h-64">
                <canvas ref={lineChartRef} />
              </div>
            </div>
            
            <div className="card">
              <h3 className="font-heading text-lg text-sand mb-4">By Project</h3>
              {stats.projectBreakdown.length > 0 ? (
                <div className="h-64">
                  <canvas ref={pieChartRef} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-text-slate font-mono">No project data</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-text-slate font-mono">No data available</p>
        </div>
      )}
    </div>
  )
}
