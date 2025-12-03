'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '../contexts/PWAContext'

export default function InstallPrompt() {
  const { canInstall, isInstalled, promptInstall, isOnline, offlineQueueCount, swUpdateAvailable, updateServiceWorker } = usePWA()
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Show install banner after delay
  useEffect(() => {
    if (canInstall && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true)
      }, 30000) // Show after 30 seconds
      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled, dismissed])

  // Show update banner when available
  useEffect(() => {
    if (swUpdateAvailable) {
      setShowUpdateBanner(true)
    }
  }, [swUpdateAvailable])

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      setShowInstallBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    setDismissed(true)
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleUpdate = () => {
    updateServiceWorker()
    setShowUpdateBanner(false)
  }

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-mono">
              You&apos;re offline. Changes will sync when connected.
              {offlineQueueCount > 0 && ` (${offlineQueueCount} pending)`}
            </span>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
          <div className="bg-gradient-to-br from-emerald-900/95 to-emerald-800/95 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 shadow-xl shadow-emerald-900/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-semibold text-emerald-300">Update Available</h3>
                <p className="text-xs text-emerald-200/70 mt-1">
                  A new version of Workers Portal is ready!
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="px-4 py-2 text-sm text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Banner */}
      {showInstallBanner && !showUpdateBanner && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
          <div className="bg-gradient-to-br from-obsidian/95 to-neutral-900/95 backdrop-blur-sm border border-relic-gold/30 rounded-xl p-4 shadow-xl shadow-black/30">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 text-sand/50 hover:text-sand transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-relic-gold to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-relic-gold/20">
                <svg className="w-6 h-6 text-obsidian" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 pr-4">
                <h3 className="font-display text-base font-semibold text-relic-gold">Install Workers Portal</h3>
                <p className="text-sm text-sand/70 mt-1">
                  Add to your home screen for quick access, offline support, and push notifications!
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-relic-gold to-amber-600 hover:from-amber-500 hover:to-amber-600 text-obsidian text-sm font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 text-sm text-sand/70 hover:text-sand transition-colors"
              >
                Not Now
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/10">
              <span className="flex items-center gap-1.5 text-xs text-sand/50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Offline Mode
              </span>
              <span className="flex items-center gap-1.5 text-xs text-sand/50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </span>
              <span className="flex items-center gap-1.5 text-xs text-sand/50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Access
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
