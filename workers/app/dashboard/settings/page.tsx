'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'

export default function SettingsPage() {
  const { user } = useAuth()
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-sand mb-2">Settings</h1>
        <p className="text-text-slate font-mono text-sm">
          Manage your account settings
        </p>
      </div>

      {/* Profile Info */}
      <div className="card mb-8">
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
              className="input-field font-mono tracking-[0.3em] text-center"
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
              className="input-field font-mono tracking-[0.3em] text-center"
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
              className="input-field font-mono tracking-[0.3em] text-center"
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
            className="btn-rune w-full"
          >
            {isLoading ? 'Changing PIN...' : 'Change PIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
