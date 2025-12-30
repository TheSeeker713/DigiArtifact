'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'

// API base URL - use redirect-based OAuth flow (works in all browsers including embedded)
const API_BASE = 'https://digiartifact-workers-api.digitalartifact11.workers.dev/api'

function LoginPageInner() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Debug marker for deployment verification
  console.log('LOGIN PAGE LOADED - V2')

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

  // Handle Google Sign-In via redirect flow
  const handleGoogleSignIn = () => {
    setIsLoading(true)
    // Redirect to our backend OAuth start endpoint
    // This uses server-side redirect flow which works everywhere (no popup needed)
    window.location.href = `${API_BASE}/auth/google/start`
  }

  return (
    <>
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
              {/* Google Sign-In Button - Custom styled, uses redirect flow */}
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-3 w-full max-w-[300px] px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-md shadow-md transition-all hover:shadow-lg border border-gray-200"
              >
                {/* Google Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Scratch Butt
              </button>
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
