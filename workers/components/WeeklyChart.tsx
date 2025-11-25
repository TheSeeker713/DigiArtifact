'use client'

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { useAuth } from '@/contexts/AuthContext'

Chart.register(...registerables)

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeeklyChart() {
  const { weeklyHours } = useAuth()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Get current day of week (0 = Sunday)
    const today = new Date().getDay()

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: 'Hours',
            data: weeklyHours,
            backgroundColor: dayLabels.map((_, i) =>
              i === today ? 'rgba(204, 164, 59, 0.8)' : 'rgba(204, 164, 59, 0.3)'
            ),
            borderColor: dayLabels.map((_, i) =>
              i === today ? '#cca43b' : 'rgba(204, 164, 59, 0.5)'
            ),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#1e1e24',
            titleColor: '#e3d5ca',
            bodyColor: '#cca43b',
            borderColor: '#9f5f3f',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => `${(context.parsed.y ?? 0).toFixed(1)} hours`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: 'Space Mono',
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            max: 12,
            grid: {
              color: 'rgba(159, 95, 63, 0.2)',
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: 'Space Mono',
                size: 11,
              },
              callback: (value) => `${value}h`,
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [weeklyHours])

  const totalHours = weeklyHours.reduce((a, b) => a + b, 0)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-sand">This Week</h3>
        <div className="text-right">
          <p className="text-relic-gold font-mono text-xl">{totalHours.toFixed(1)}h</p>
          <p className="text-text-slate text-xs font-mono">Total Hours</p>
        </div>
      </div>
      <div className="h-48">
        <canvas ref={chartRef} />
      </div>
    </div>
  )
}
