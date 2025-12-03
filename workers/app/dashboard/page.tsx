'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import ClockWidget from '@/components/ClockWidget'
import WeeklyChart from '@/components/WeeklyChart'
import RecentEntries from '@/components/RecentEntries'
import QuickStats from '@/components/QuickStats'
import FocusTimer from '@/components/FocusTimer'
import StreakCounter from '@/components/StreakCounter'
import QuickNotesWidget from '@/components/QuickNotesWidget'
import TodaysAgenda from '@/components/TodaysAgenda'
import GamificationWidget from '@/components/GamificationWidget'
import BodyDoublingTimer from '@/components/BodyDoublingTimer'

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

      {/* Main Grid - 3 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Clock & Focus Tools */}
        <div className="space-y-6">
          <ClockWidget />
          <FocusTimer />
          <BodyDoublingTimer />
        </div>

        {/* Middle Column - Activity & Progress */}
        <div className="space-y-6">
          <TodaysAgenda />
          <StreakCounter />
          <QuickNotesWidget />
        </div>

        {/* Right Column - Stats & Gamification */}
        <div className="space-y-6">
          <GamificationWidget />
          <WeeklyChart />
          <RecentEntries />
        </div>
      </div>
    </div>
  )
}
