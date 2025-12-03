'use client'

import { useState } from 'react'
import { usePWA } from '../contexts/PWAContext'

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
  timing?: number // minutes
}

export default function NotificationSettings() {
  const { notificationsEnabled, notificationPermission, requestNotificationPermission, scheduleNotification } = usePWA()
  
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'break-reminder',
      label: 'Break Reminders',
      description: 'Get reminded to take breaks during long work sessions',
      enabled: true,
      timing: 90
    },
    {
      id: 'shift-end',
      label: 'Shift End Warning',
      description: 'Notification 10 minutes before scheduled shift ends',
      enabled: true,
      timing: 10
    },
    {
      id: 'overtime',
      label: 'Overtime Alert',
      description: 'Alert when approaching overtime hours',
      enabled: false,
      timing: 40 * 60 // 40 hours in minutes
    },
    {
      id: 'weekly-summary',
      label: 'Weekly Summary',
      description: 'Weekly recap of hours worked and achievements',
      enabled: true
    },
    {
      id: 'streak',
      label: 'Streak Reminders',
      description: 'Don\'t break your streak! Daily reminder to log time',
      enabled: true
    },
    {
      id: 'achievement',
      label: 'Achievement Unlocked',
      description: 'Celebrate when you unlock new achievements',
      enabled: true
    }
  ])
  
  const [testSent, setTestSent] = useState(false)

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    if (!granted) {
      alert('Notifications were blocked. Please enable them in your browser settings.')
    }
  }

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
    // In a real app, save to backend/localStorage
  }

  const updateTiming = (id: string, timing: number) => {
    setSettings(prev => prev.map(s =>
      s.id === id ? { ...s, timing } : s
    ))
  }

  const sendTestNotification = () => {
    if (!notificationsEnabled) return
    
    scheduleNotification({
      title: '🔔 Test Notification',
      body: 'Your notifications are working! You\'ll receive updates based on your settings.',
      tag: 'test-notification',
      data: { type: 'test' }
    }, 1000)
    
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-relic-gold">
            Notification Settings
          </h3>
          <p className="text-sm text-sand/60 mt-1">
            Manage how and when you receive notifications
          </p>
        </div>
        
        {/* Permission status badge */}
        <div className={`px-3 py-1.5 rounded-full text-xs font-mono ${
          notificationsEnabled 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : notificationPermission === 'denied'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}>
          {notificationsEnabled ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Disabled'}
        </div>
      </div>

      {/* Enable notifications prompt */}
      {!notificationsEnabled && notificationPermission !== 'denied' && (
        <div className="bg-gradient-to-r from-relic-gold/10 to-amber-500/10 border border-relic-gold/30 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-relic-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-relic-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-relic-gold">Enable Push Notifications</h4>
              <p className="text-sm text-sand/70 mt-1">
                Stay on track with break reminders, shift alerts, and achievement notifications.
              </p>
              <button
                onClick={handleEnableNotifications}
                className="mt-3 px-4 py-2 bg-relic-gold text-obsidian text-sm font-semibold rounded-lg hover:bg-amber-500 transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked notifications warning */}
      {notificationPermission === 'denied' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-red-400">Notifications Blocked</h4>
              <p className="text-sm text-sand/70 mt-1">
                You&apos;ve blocked notifications. To enable them, click the lock icon in your browser&apos;s address bar and allow notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification settings list */}
      <div className="space-y-4">
        {settings.map((setting) => (
          <div 
            key={setting.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
              notificationsEnabled && setting.enabled
                ? 'bg-slate/30 border-baked-clay/30'
                : 'bg-slate/10 border-baked-clay/10 opacity-60'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sand">{setting.label}</h4>
                {setting.timing && setting.enabled && notificationsEnabled && (
                  <span className="text-xs text-sand/50 font-mono">
                    {setting.timing >= 60 ? `${Math.floor(setting.timing / 60)}h` : `${setting.timing}min`}
                  </span>
                )}
              </div>
              <p className="text-sm text-sand/60 mt-0.5">{setting.description}</p>
              
              {/* Timing control for applicable settings */}
              {setting.timing && setting.enabled && notificationsEnabled && setting.id === 'break-reminder' && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-sand/50">Remind every:</span>
                  <select
                    value={setting.timing}
                    onChange={(e) => updateTiming(setting.id, Number(e.target.value))}
                    className="bg-obsidian border border-baked-clay/30 rounded px-2 py-1 text-xs text-sand"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Toggle switch */}
            <button
              onClick={() => toggleSetting(setting.id)}
              disabled={!notificationsEnabled}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                setting.enabled && notificationsEnabled
                  ? 'bg-emerald-500'
                  : 'bg-slate'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  setting.enabled && notificationsEnabled
                    ? 'translate-x-7'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Test notification button */}
      {notificationsEnabled && (
        <div className="pt-4 border-t border-baked-clay/20">
          <button
            onClick={sendTestNotification}
            disabled={testSent}
            className="flex items-center gap-2 text-sm text-sand/70 hover:text-relic-gold transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {testSent ? 'Notification Sent!' : 'Send Test Notification'}
          </button>
        </div>
      )}
    </div>
  )
}
