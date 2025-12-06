'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'
import Script from 'next/script'

// API base URL
const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

// Google Client ID - this is public and safe to include in client code
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, options: any) => void
          prompt: () => void
        }
      }
    }
  }
}

function LoginPageInner() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for error from OAuth redirect
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const message = searchParams.get('message')
    if (errorParam) {
      if (errorParam === 'not_authorized') {
        setError(message || 'You are not authorized to access this portal. Contact your administrator.')
      } else {
        setError(`Authentication failed: ${errorParam}`)
      }
    }
  }, [searchParams])

  // Check if already logged in
  useEffect(() => {
    const token = Cookies.get('workers_token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  // Handle Google Sign-In response
  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setIsLoading(true)
    setError('')

    try {
      // Send the credential to our backend for verification
      const res = await fetch(`${API_BASE}/auth/google/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(data.message || 'You are not authorized to access this portal.')
        }
        throw new Error(data.error || 'Authentication failed')
      }

      // Store token in cookie
      Cookies.set('workers_token', data.token, { expires: 7 })
      Cookies.set('workers_user', JSON.stringify(data.user), { expires: 7 })
      
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Initialize Google Sign-In when script loads
  useEffect(() => {
    if (!googleLoaded || !GOOGLE_CLIENT_ID) return

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        const buttonContainer = document.getElementById('google-signin-button')
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: 'filled_black',
            size: 'large',
            width: 300,
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          })
        }
      }
    }

    // Small delay to ensure DOM is ready
    setTimeout(initializeGoogle, 100)
  }, [googleLoaded, handleGoogleResponse])

  return (
    <>
      {/* Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGoogleLoaded(true)}
        strategy="afterInteractive"
      />

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

        {/* Login Card */}
        <div className="card w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-sand mb-2">Welcome</h2>
            <p className="text-sand/60 text-sm">Sign in with your Google account to continue</p>
          </div>

          {error && (
            <div className="p-3 mb-6 bg-status-offline/20 border border-status-offline/50 rounded-md">
              <p className="text-status-offline text-sm font-mono">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-relic-gold mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sand/60">Signing you in...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {/* Google Sign-In Button */}
              <div 
                id="google-signin-button" 
                className="min-h-[44px] flex items-center justify-center"
              >
                {!googleLoaded && (
                  <div className="animate-pulse bg-slate/30 rounded-md w-[300px] h-[44px]"></div>
                )}
              </div>

              {!GOOGLE_CLIENT_ID && (
                <div className="text-amber-400 text-sm text-center p-4 bg-amber-400/10 rounded-md">
                  ⚠️ Google Sign-In not configured. 
                  <br />
                  <span className="text-xs text-sand/60">Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-baked-clay/30 text-center">
            <p className="text-text-slate text-sm">
              Only authorized DigiArtifact team members can access this portal.
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
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-relic-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sand/60">Loading...</p>
        </div>
      </main>
    }>
      <LoginPageInner />
    </Suspense>
  )
}
