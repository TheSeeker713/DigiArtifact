'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'

/**
 * Inner component that uses useSearchParams
 */
function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for error in URL params
    const error = searchParams.get('error')
    if (error) {
      router.push(`/?error=${encodeURIComponent(error)}`)
      return
    }

    // Check for token in URL fragment (hash)
    const hash = window.location.hash.substring(1)
    if (hash) {
      const params = new URLSearchParams(hash)
      const token = params.get('token')
      const userStr = params.get('user')

      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr))
          
          // Store in cookies
          Cookies.set('workers_token', token, { expires: 7 })
          Cookies.set('workers_user', JSON.stringify(user), { expires: 7 })
          
          // Clear hash and redirect to dashboard
          window.history.replaceState(null, '', '/auth/callback')
          router.push('/dashboard')
          return
        } catch (e) {
          console.error('Failed to parse user data:', e)
        }
      }
    }

    // No token found, redirect to login
    router.push('/?error=no_token')
  }, [router, searchParams])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-relic-gold border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sand/60">Completing sign in...</p>
      </div>
    </main>
  )
}

/**
 * OAuth callback page - handles the token from Google OAuth redirect
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-relic-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sand/60">Loading...</p>
        </div>
      </main>
    }>
      <AuthCallbackInner />
    </Suspense>
  )
}
