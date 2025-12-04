'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { GamificationProvider } from '@/contexts/GamificationContext'
import { PWAProvider } from '@/contexts/PWAContext'
import { TutorialProvider } from '@/contexts/TutorialContext'
import { DebugProvider } from '@/contexts/DebugContext'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import MobileQuickActions from '@/components/MobileQuickActions'
import InstallPrompt from '@/components/InstallPrompt'
import DebugPanel from '@/components/DebugPanel'
import WalkthroughTutorial, { useTutorial } from '@/components/WalkthroughTutorial'

// Inner component to use hooks inside providers
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { showTutorial, closeTutorial, completeTutorial } = useTutorial()

  return (
    <>
      <div className="min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Mobile Navigation */}
        <MobileNav />
        
        {/* Main Content */}
        <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8">
          {children}
        </main>
        
        {/* Mobile Quick Actions (swipe gestures) */}
        <MobileQuickActions />
        
        {/* PWA Install Prompt & Offline Banner */}
        <InstallPrompt />
        
        {/* Debug Panel (Admin only - renders conditionally inside) */}
        <DebugPanel />
      </div>

      {/* Onboarding Tutorial (shows on first visit) */}
      <WalkthroughTutorial
        isOpen={showTutorial}
        onClose={closeTutorial}
        onComplete={completeTutorial}
      />
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('workers_token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  return (
    <AuthProvider>
      <SettingsProvider>
        <GamificationProvider>
          <PWAProvider>
            <TutorialProvider>
              <DebugProvider>
                <DashboardContent>{children}</DashboardContent>
              </DebugProvider>
            </TutorialProvider>
          </PWAProvider>
        </GamificationProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
