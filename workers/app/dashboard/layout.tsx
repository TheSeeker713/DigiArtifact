'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { GamificationProvider } from '@/contexts/GamificationContext'
import { PWAProvider } from '@/contexts/PWAContext'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import MobileQuickActions from '@/components/MobileQuickActions'
import InstallPrompt from '@/components/InstallPrompt'

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
            </div>
          </PWAProvider>
        </GamificationProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
