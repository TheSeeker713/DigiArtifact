'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { AuthProvider } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

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
      <div className="min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Mobile Navigation */}
        <MobileNav />
        
        {/* Main Content */}
        <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
