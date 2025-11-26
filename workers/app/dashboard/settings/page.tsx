'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'

type TabType = 'about' | 'help' | 'account' | 'notifications' | 'appearance'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPin !== confirmPin) {
      setError('New PINs do not match')
      return
    }

    if (newPin.length < 4 || newPin.length > 6) {
      setError('PIN must be 4-6 digits')
      return
    }

    if (!/^\d+$/.test(newPin)) {
      setError('PIN must contain only numbers')
      return
    }

    setIsLoading(true)

    try {
      const token = Cookies.get('workers_token')
      const response = await fetch('https://digiartifact-workers-api.digitalartifact11.workers.dev/api/user/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPin, newPin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change PIN')
      }

      setSuccess('PIN changed successfully!')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change PIN')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'account' as TabType, label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'about' as TabType, label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'help' as TabType, label: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'notifications' as TabType, label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'appearance' as TabType, label: 'Appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
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
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Profile</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-baked-clay/20">
                    <span className="text-text-slate font-mono text-sm">Name</span>
                    <span className="text-sand">{user?.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-baked-clay/20">
                    <span className="text-text-slate font-mono text-sm">Email</span>
                    <span className="text-sand">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-text-slate font-mono text-sm">Role</span>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      user?.role === 'admin' 
                        ? 'bg-relic-gold/20 text-relic-gold' 
                        : 'bg-text-slate/20 text-text-slate'
                    }`}>
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change PIN */}
              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Change PIN</h2>
                <p className="text-text-slate text-sm mb-6">
                  Your PIN is used to log into the Workers Portal. Choose a 4-6 digit PIN that you'll remember.
                </p>

                <form onSubmit={handleChangePin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-sand mb-2">
                      Current PIN
                    </label>
                    <input
                      type="password"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="input-field font-mono tracking-[0.3em] text-center max-w-xs"
                      placeholder="••••"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-sand mb-2">
                      New PIN
                    </label>
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="input-field font-mono tracking-[0.3em] text-center max-w-xs"
                      placeholder="••••"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-sand mb-2">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="input-field font-mono tracking-[0.3em] text-center max-w-xs"
                      placeholder="••••"
                      maxLength={6}
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-status-offline/20 border border-status-offline/50 rounded-md">
                      <p className="text-status-offline text-sm font-mono">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-status-active/20 border border-status-active/50 rounded-md">
                      <p className="text-status-active text-sm font-mono">{success}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-rune"
                  >
                    {isLoading ? 'Changing PIN...' : 'Change PIN'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="card">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-relic-gold to-baked-clay flex items-center justify-center">
                  <span className="font-heading text-obsidian font-bold text-3xl">D</span>
                </div>
                <h2 className="font-heading text-2xl text-relic-gold mb-2">DigiArtifact Workers Portal</h2>
                <p className="text-text-slate font-mono text-sm">Version 1.0.0</p>
              </div>

              <div className="space-y-6">
                <div className="border-t border-baked-clay/30 pt-6">
                  <h3 className="font-heading text-lg text-sand mb-3">About This App</h3>
                  <p className="text-text-slate text-sm leading-relaxed">
                    The DigiArtifact Workers Portal is a time tracking and project management tool 
                    designed to help you stay organized and productive. Track your work hours, 
                    manage projects, and generate reports all in one place.
                  </p>
                </div>

                <div className="border-t border-baked-clay/30 pt-6">
                  <h3 className="font-heading text-lg text-sand mb-3">Technology Stack</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-obsidian/50 rounded-lg">
                      <p className="text-relic-gold font-mono text-sm mb-1">Frontend</p>
                      <p className="text-text-slate text-xs">Next.js 14 + React</p>
                    </div>
                    <div className="p-3 bg-obsidian/50 rounded-lg">
                      <p className="text-relic-gold font-mono text-sm mb-1">Styling</p>
                      <p className="text-text-slate text-xs">Tailwind CSS</p>
                    </div>
                    <div className="p-3 bg-obsidian/50 rounded-lg">
                      <p className="text-relic-gold font-mono text-sm mb-1">Backend</p>
                      <p className="text-text-slate text-xs">Cloudflare Workers</p>
                    </div>
                    <div className="p-3 bg-obsidian/50 rounded-lg">
                      <p className="text-relic-gold font-mono text-sm mb-1">Database</p>
                      <p className="text-text-slate text-xs">Cloudflare D1</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-baked-clay/30 pt-6">
                  <h3 className="font-heading text-lg text-sand mb-3">Credits</h3>
                  <p className="text-text-slate text-sm">
                    Built with ❤️ by <span className="text-relic-gold">DigiArtifact LLC</span>
                  </p>
                  <p className="text-text-slate text-xs mt-2">
                    © 2025 DigiArtifact LLC. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Frequently Asked Questions</h2>
                
                <div className="space-y-4">
                  <details className="group">
                    <summary className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg cursor-pointer hover:bg-obsidian/70 transition-colors">
                      <span className="text-sand font-medium">How do I clock in?</span>
                      <svg className="w-5 h-5 text-relic-gold group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 text-text-slate text-sm">
                      From the Dashboard, click the "Clock In" button. You can optionally select a project 
                      before clocking in. Your time will start tracking immediately.
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg cursor-pointer hover:bg-obsidian/70 transition-colors">
                      <span className="text-sand font-medium">How do I take a break?</span>
                      <svg className="w-5 h-5 text-relic-gold group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 text-text-slate text-sm">
                      While clocked in, click the "Start Break" button. Your break time will be tracked 
                      separately and subtracted from your total work hours. Click "End Break" when you're ready to continue.
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg cursor-pointer hover:bg-obsidian/70 transition-colors">
                      <span className="text-sand font-medium">Can I edit past time entries?</span>
                      <svg className="w-5 h-5 text-relic-gold group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 text-text-slate text-sm">
                      Admins can edit any time entry from the Admin &gt; All Entries page. Regular users 
                      can view their history but cannot edit past entries. Contact your admin if you need corrections.
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg cursor-pointer hover:bg-obsidian/70 transition-colors">
                      <span className="text-sand font-medium">How do I change my PIN?</span>
                      <svg className="w-5 h-5 text-relic-gold group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 text-text-slate text-sm">
                      Go to Settings &gt; Account and use the "Change PIN" form. You'll need to enter your 
                      current PIN first, then your new PIN (4-6 digits) twice to confirm.
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg cursor-pointer hover:bg-obsidian/70 transition-colors">
                      <span className="text-sand font-medium">What if I forget my PIN?</span>
                      <svg className="w-5 h-5 text-relic-gold group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 text-text-slate text-sm">
                      Contact your admin to have your PIN reset. They can set a new temporary PIN for you 
                      from the Admin &gt; Users page, then you can change it to something personal.
                    </div>
                  </details>
                </div>
              </div>

              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Need More Help?</h2>
                <p className="text-text-slate text-sm mb-4">
                  If you can't find the answer to your question, reach out to us:
                </p>
                <div className="space-y-3">
                  <a 
                    href="mailto:support@digiartifact.com" 
                    className="flex items-center gap-3 p-4 bg-obsidian/50 rounded-lg hover:bg-obsidian/70 transition-colors"
                  >
                    <svg className="w-5 h-5 text-relic-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sand font-mono text-sm">Email Support</p>
                      <p className="text-text-slate text-xs">support@digiartifact.com</p>
                    </div>
                  </a>
                  <a 
                    href="https://digiartifact.com" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-obsidian/50 rounded-lg hover:bg-obsidian/70 transition-colors"
                  >
                    <svg className="w-5 h-5 text-relic-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <div>
                      <p className="text-sand font-mono text-sm">Visit Website</p>
                      <p className="text-text-slate text-xs">digiartifact.com</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
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

          {/* Appearance Tab (Coming Soon) */}
          {activeTab === 'appearance' && (
            <div className="card">
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-text-slate/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <h2 className="font-heading text-xl text-sand mb-2">Appearance</h2>
                <p className="text-text-slate text-sm mb-4">Coming Soon</p>
                <p className="text-text-slate/70 text-xs max-w-md mx-auto">
                  Customize the look and feel of your portal with themes, colors, and display preferences.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
