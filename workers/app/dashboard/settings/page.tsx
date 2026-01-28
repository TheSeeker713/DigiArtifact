'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import WalkthroughTutorial, { useTutorial } from '@/components/WalkthroughTutorial'
import AdminDataManagement from '@/components/AdminDataManagement'
import ScheduleEditor from '@/components/ScheduleEditor'
import AdminUserManagement from '@/components/AdminUserManagement'

// Import refactored tab components
import { 
  AccountTab, 
  AboutTab, 
  HelpTab, 
  TimeDisplayTab, 
  DebugTab 
} from '@/components/settings'

type TabType = 'about' | 'help' | 'account' | 'notifications' | 'time-display' | 'schedule' | 'data-management' | 'user-management' | 'debug'

export default function SettingsPage() {
  const { user } = useAuth()
  const { showTutorial, startTutorial, closeTutorial, completeTutorial } = useTutorial()
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Check if current user is admin
  const isAdmin = user?.role === 'admin'

  // Update current time every second for live preview
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'account' as TabType, label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'schedule' as TabType, label: 'My Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'time-display' as TabType, label: 'Time & Display', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'notifications' as TabType, label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'help' as TabType, label: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'about' as TabType, label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    // Admin-only tabs
    ...(isAdmin ? [
      { id: 'user-management' as TabType, label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
      { id: 'data-management' as TabType, label: 'Data', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
      { id: 'debug' as TabType, label: 'Debug', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    ] : []),
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-sand mb-2">Settings</h1>
        <p className="text-text-slate font-mono text-sm">
          Manage your account and application preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs Navigation */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-relic-gold/20 text-relic-gold'
                    : 'text-text-slate hover:text-sand hover:bg-obsidian/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="font-mono text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <AccountTab user={user} />
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <AboutTab />
          )}

          {/* Help Tab */}
          {activeTab === 'help' && (
            <HelpTab onStartTutorial={startTutorial} />
          )}

          {/* Notifications Tab (Coming Soon) */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-text-slate/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h2 className="font-heading text-xl text-sand mb-2">Notifications</h2>
                <p className="text-text-slate text-sm mb-4">Coming Soon</p>
                <p className="text-text-slate/70 text-xs max-w-md mx-auto">
                  Configure email and push notifications for clock reminders, weekly summaries, 
                  and important updates.
                </p>
              </div>
            </div>
          )}

          {/* Time/Display Tab */}
          {activeTab === 'time-display' && (
            <TimeDisplayTab currentTime={currentTime} />
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="card">
              <ScheduleEditor />
            </div>
          )}

          {/* User Management Tab (Admin Only) */}
          {activeTab === 'user-management' && isAdmin && (
            <div className="card">
              <AdminUserManagement />
            </div>
          )}

          {/* Data Management Tab (Admin Only) */}
          {activeTab === 'data-management' && (
            <div className="card">
              <AdminDataManagement />
            </div>
          )}

          {/* Debug Tab (Admin Only) */}
          {activeTab === 'debug' && isAdmin && (
            <DebugTab />
          )}
        </div>
      </div>

      {/* Walkthrough Tutorial (disabled temporarily) */}
      {/* <WalkthroughTutorial
        isOpen={showTutorial}
        onClose={closeTutorial}
        onComplete={completeTutorial}
      /> */}
    </div>
  )
}
