'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAContextType {
  // Install
  canInstall: boolean
  isInstalled: boolean
  promptInstall: () => Promise<boolean>
  
  // Offline
  isOnline: boolean
  offlineQueueCount: number
  
  // Notifications
  notificationsEnabled: boolean
  notificationPermission: NotificationPermission | 'default'
  requestNotificationPermission: () => Promise<boolean>
  scheduleNotification: (notification: ScheduledNotification, delay: number) => void
  
  // Service Worker
  swRegistration: ServiceWorkerRegistration | null
  swUpdateAvailable: boolean
  updateServiceWorker: () => void
}

interface ScheduledNotification {
  title: string
  body: string
  tag?: string
  requireInteraction?: boolean
  data?: Record<string, unknown>
  actions?: Array<{ action: string; title: string; icon?: string }>
}

const PWAContext = createContext<PWAContextType | null>(null)

export function PWAProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>('default')
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false)

  // Initialize PWA features
  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsInstalled(isStandalone)

    // Online/offline status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration.scope)
          setSwRegistration(registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setSwUpdateAvailable(true)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error)
        })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        switch (event.data.type) {
          case 'OFFLINE_QUEUE_COUNT':
            setOfflineQueueCount(event.data.count)
            break
          case 'SYNC_SUCCESS':
            // Refresh data when sync completes
            window.dispatchEvent(new CustomEvent('pwa-sync-complete', { detail: event.data.action }))
            break
          case 'CHECK_BREAK_NEEDED':
            // Trigger break check in UI
            window.dispatchEvent(new CustomEvent('pwa-break-check'))
            break
        }
      })

      // Request offline queue count
      const checkOfflineQueue = () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'GET_OFFLINE_QUEUE' })
        }
      }
      checkOfflineQueue()
      const interval = setInterval(checkOfflineQueue, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      setInstallPrompt(null)
      return outcome === 'accepted'
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error)
      return false
    }
  }, [installPrompt])

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error)
      return false
    }
  }, [])

  // Schedule a notification via service worker
  const scheduleNotification = useCallback((notification: ScheduledNotification, delay: number) => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        notification,
        delay
      })
    }
  }, [swRegistration])

  // Update service worker
  const updateServiceWorker = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [swRegistration])

  const value: PWAContextType = {
    canInstall: !!installPrompt,
    isInstalled,
    promptInstall,
    isOnline,
    offlineQueueCount,
    notificationsEnabled: notificationPermission === 'granted',
    notificationPermission,
    requestNotificationPermission,
    scheduleNotification,
    swRegistration,
    swUpdateAvailable,
    updateServiceWorker
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

// Standalone hook for components that don't need full context
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}
