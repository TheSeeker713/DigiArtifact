'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings, TIMEZONE_OPTIONS, TimeFormat } from '@/contexts/SettingsContext'
import Cookies from 'js-cookie'

type TabType = 'about' | 'help' | 'account' | 'notifications' | 'time-display'

// Fortune Cookie Easter Egg Component
const FORTUNES = [
  "Your code will compile on the first try... eventually.",
  "A bug in production builds character.",
  "The semicolon you forgot is in line 42.",
  "Your next commit will be legendary.",
  "Stack Overflow has the answer you seek.",
  "Refactoring today saves debugging tomorrow.",
  "The variable you need is closer than you think.",
  "A senior developer once started as a junior too.",
  "Your pull request will be approved with minor comments.",
  "The documentation you need exists somewhere.",
  "Console.log is your friend in times of need.",
  "Git push --force is never the answer... usually.",
  "Your keyboard will bring you fortune and functions.",
  "The error message contains the truth you seek.",
  "A well-named variable is worth a thousand comments.",
]

function FortuneCookie() {
  const [isCracked, setIsCracked] = useState(false)
  const [fortune, setFortune] = useState('')

  const crackCookie = () => {
    if (!isCracked) {
      const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
      setFortune(randomFortune)
      setIsCracked(true)
    }
  }

  const resetCookie = () => {
    setIsCracked(false)
    setFortune('')
  }

  return (
    <details className="mt-6 group">
      <summary className="text-text-slate/30 text-xs cursor-pointer hover:text-text-slate/50 transition-colors">
        🤫
      </summary>
      <div className="mt-4 p-6 bg-obsidian/50 rounded-lg border border-relic-gold/20 text-center">
        {!isCracked ? (
          <>
            <button
              onClick={crackCookie}
              className="focus:outline-none transform hover:scale-105 transition-transform cursor-pointer"
              aria-label="Click to crack the fortune cookie"
            >
              <svg className="w-32 h-32 mx-auto mb-4" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Fortune Cookie - Whole */}
                <ellipse cx="64" cy="70" rx="50" ry="28" fill="#E8B84A" />
                <path d="M14 70 Q64 30 114 70" fill="#F5C563" stroke="#D4A43A" strokeWidth="2"/>
                <path d="M14 70 Q64 95 114 70" fill="#E8B84A" stroke="#D4A43A" strokeWidth="2"/>
                {/* Cookie texture lines */}
                <path d="M30 65 Q50 55 70 65" stroke="#D4A43A" strokeWidth="1.5" fill="none" opacity="0.5"/>
                <path d="M50 60 Q70 50 90 60" stroke="#D4A43A" strokeWidth="1.5" fill="none" opacity="0.5"/>
                {/* Shine */}
                <ellipse cx="45" cy="55" rx="12" ry="6" fill="#FFF5CC" opacity="0.4"/>
              </svg>
            </button>
            <p className="text-relic-gold font-heading text-lg mb-2">🥠 Fortune Cookie 🥠</p>
            <p className="text-text-slate text-sm">Click the cookie to reveal your fortune!</p>
          </>
        ) : (
          <>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left cookie half */}
                <g transform="translate(-15, 0) rotate(-15, 50, 70)">
                  <path d="M30 70 Q50 45 70 70 Q50 85 30 70" fill="#E8B84A" stroke="#D4A43A" strokeWidth="2"/>
                  <ellipse cx="48" cy="60" rx="8" ry="4" fill="#FFF5CC" opacity="0.3"/>
                </g>
                {/* Right cookie half */}
                <g transform="translate(15, 0) rotate(15, 78, 70)">
                  <path d="M58 70 Q78 45 98 70 Q78 85 58 70" fill="#E8B84A" stroke="#D4A43A" strokeWidth="2"/>
                  <ellipse cx="80" cy="60" rx="8" ry="4" fill="#FFF5CC" opacity="0.3"/>
                </g>
                {/* Fortune paper */}
                <rect x="44" y="55" width="40" height="20" rx="2" fill="#FFFFFF" stroke="#E0E0E0"/>
                <line x1="48" y1="62" x2="80" y2="62" stroke="#666" strokeWidth="0.5"/>
                <line x1="48" y1="67" x2="75" y2="67" stroke="#666" strokeWidth="0.5"/>
              </svg>
            </div>
            <p className="text-relic-gold font-heading text-lg mb-3">✨ Your Fortune ✨</p>
            <p className="text-sand text-base italic mb-4 max-w-xs mx-auto">"{fortune}"</p>
            <button
              onClick={resetCookie}
              className="text-text-slate/50 text-xs hover:text-text-slate transition-colors underline"
            >
              Get another cookie
            </button>
          </>
        )}
        <p className="text-text-slate/50 text-xs mt-4 italic">- Your friendly coding assistant</p>
      </div>
    </details>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { timezone, timeFormat, setTimezone, setTimeFormat, formatTime, formatDate } = useSettings()
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second for live preview
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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
    { id: 'time-display' as TabType, label: 'Time & Display', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'notifications' as TabType, label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'help' as TabType, label: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'about' as TabType, label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
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
                    Built with ❤️ by <span className="text-relic-gold">DigiArtifact</span> and <span className="text-relic-gold">J.W.</span>
                  </p>
                  <p className="text-text-slate text-xs mt-2">
                    © 2025 DigiArtifact. All rights reserved.
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

              {/* Hidden Easter Egg - Fortune Cookie */}
              <FortuneCookie />
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
          {activeTab === 'time-display' && (
            <div className="space-y-6">
              {/* Time Zone Settings */}
              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Time Zone</h2>
                <p className="text-text-slate text-sm mb-6">
                  Set your local time zone for accurate time tracking and display.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-sand mb-2">
                      Select Time Zone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="input-field w-full max-w-md"
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-obsidian/50 rounded-lg max-w-md">
                    <p className="text-text-slate text-xs font-mono mb-2">Current time in selected zone:</p>
                    <p className="text-relic-gold text-2xl font-mono">
                      {formatTime(currentTime, { includeSeconds: true })}
                    </p>
                    <p className="text-sand text-sm mt-1">
                      {formatDate(currentTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Format Settings */}
              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Time Format</h2>
                <p className="text-text-slate text-sm mb-6">
                  Choose how times are displayed throughout the application.
                </p>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setTimeFormat('12')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        timeFormat === '12'
                          ? 'border-relic-gold bg-relic-gold/10'
                          : 'border-baked-clay/30 hover:border-baked-clay/50'
                      }`}
                    >
                      <div className="text-center">
                        <p className={`text-2xl font-mono mb-2 ${
                          timeFormat === '12' ? 'text-relic-gold' : 'text-sand'
                        }`}>
                          4:48 PM
                        </p>
                        <p className="text-text-slate text-sm">12-hour format</p>
                        <p className="text-text-slate/70 text-xs mt-1">AM/PM notation</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setTimeFormat('24')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        timeFormat === '24'
                          ? 'border-relic-gold bg-relic-gold/10'
                          : 'border-baked-clay/30 hover:border-baked-clay/50'
                      }`}
                    >
                      <div className="text-center">
                        <p className={`text-2xl font-mono mb-2 ${
                          timeFormat === '24' ? 'text-relic-gold' : 'text-sand'
                        }`}>
                          16:48
                        </p>
                        <p className="text-text-slate text-sm">24-hour format</p>
                        <p className="text-text-slate/70 text-xs mt-1">Military time</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Placeholder Sections */}
              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Date Format</h2>
                <p className="text-text-slate text-sm mb-4">Coming Soon</p>
                <p className="text-text-slate/70 text-xs">
                  Choose between MM/DD/YYYY, DD/MM/YYYY, and other date formats.
                </p>
              </div>

              <div className="card">
                <h2 className="font-heading text-xl text-relic-gold mb-4">Week Start</h2>
                <p className="text-text-slate text-sm mb-4">Coming Soon</p>
                <p className="text-text-slate/70 text-xs">
                  Set whether your week starts on Sunday or Monday for weekly reports.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
