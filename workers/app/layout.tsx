import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workers Portal | DigiArtifact',
  description: 'DigiArtifact team time tracking and project management portal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Workers Portal',
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/icon-152.png', sizes: '152x152' },
      { url: '/icon-192.png', sizes: '192x192' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#cca43b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Merriweather:wght@300;400;700&family=Space+Mono:wght@400;700&display=swap" 
          rel="stylesheet" 
        />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Workers" />
        <meta name="application-name" content="Workers Portal" />
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-startup-image" href="/icon-512.png" />
      </head>
      <body className="min-h-screen bg-grid-overlay">
        {children}
      </body>
    </html>
  )
}
