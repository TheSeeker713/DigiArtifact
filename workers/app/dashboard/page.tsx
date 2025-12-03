'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import ClockWidget from '@/components/ClockWidget'
import WeeklyChart from '@/components/WeeklyChart'
import RecentEntries from '@/components/RecentEntries'
import QuickStats from '@/components/QuickStats'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { formatDate } = useSettings()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-relic-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-slate font-mono">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-sand mb-2">
          Welcome back, <span className="text-relic-gold">{user?.name?.split(' ')[0] || 'Worker'}</span>
        </h1>
        <p className="text-text-slate font-mono text-sm">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8">
        <QuickStats />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clock Widget - Takes 1 column */}
        <div className="lg:col-span-1">
          <ClockWidget />
        </div>

        {/* Charts and Activity - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          <WeeklyChart />
          <RecentEntries />
        </div>
      </div>
    </div>
  )
}
