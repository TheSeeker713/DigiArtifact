'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    const token = Cookies.get('workers_token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token in cookie
      Cookies.set('workers_token', data.token, { expires: 7 })
      Cookies.set('workers_user', JSON.stringify(data.user), { expires: 7 })
      
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-relic-gold to-baked-clay rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-obsidian" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none"/>
          </svg>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl text-relic-gold mb-2">Workers Portal</h1>
        <p className="text-text-slate font-mono text-sm">DigiArtifact Team Access</p>
      </div>

      {/* Login Form */}
      <div className="card w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-mono text-sand mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="worker@digiartifact.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-mono text-sand mb-2">
              PIN Code
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input-field font-mono tracking-[0.5em] text-center"
              placeholder="••••"
              maxLength={6}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="p-3 bg-status-offline/20 border border-status-offline/50 rounded-md">
              <p className="text-status-offline text-sm font-mono">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-rune w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Authenticating...
              </>
            ) : (
              'Enter the Vault'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-baked-clay/30 text-center">
          <p className="text-text-slate text-sm">
            Need access? Contact your administrator.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <a 
          href="https://www.digiartifact.com" 
          className="text-text-slate hover:text-relic-gold transition-colors text-sm"
        >
          ← Return to DigiArtifact
        </a>
      </footer>
    </main>
  )
}
