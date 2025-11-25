'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/history', label: 'Time History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/projects', label: 'Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/dashboard/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const adminItems = [
  { href: '/dashboard/admin/users', label: 'Manage Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/dashboard/admin/entries', label: 'All Entries', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate/50 backdrop-blur-sm border-r border-baked-clay/30 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-baked-clay/30">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-relic-gold to-baked-clay rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-obsidian" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none"/>
            </svg>
          </div>
          <div>
            <h1 className="font-heading text-lg text-relic-gold">Workers</h1>
            <p className="text-xs text-text-slate font-mono">DigiArtifact</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-xs font-mono text-text-slate uppercase tracking-wider px-4 mb-2">
          Main Menu
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'nav-item-active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="font-mono text-sm">{item.label}</span>
          </Link>
        ))}

        {user?.role === 'admin' && (
          <>
            <p className="text-xs font-mono text-text-slate uppercase tracking-wider px-4 mt-6 mb-2">
              Admin
            </p>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'nav-item-active' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-mono text-sm">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-baked-clay/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-hologram-cyan/20 rounded-full flex items-center justify-center">
            <span className="text-hologram-cyan font-mono font-bold">
              {user?.name?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sand text-sm font-medium truncate">{user?.name || 'Unknown'}</p>
            <p className="text-text-slate text-xs font-mono truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-left text-text-slate hover:text-status-offline hover:bg-status-offline/10 rounded-md transition-colors font-mono text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
