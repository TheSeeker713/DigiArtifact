import type { Metadata } from 'next'
import { Cinzel, Space_Mono, Merriweather } from 'next/font/google'
import './globals.css'
import { AudioProvider } from '@/contexts/AudioContext'
import NavigationDeck from '@/components/NavigationDeck'
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer'
import Footer from '@/components/Footer'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DigiArtifact — The Digital Curiosity Shop',
  description: 'Premium digital assets for creators and dreamers. Explore art, audio, and interactive experiences where ancient wisdom meets future technology.',
  keywords: ['digital art', 'music', 'visual novels', 'coloring books', 'sound effects', 'interactive experiences'],
  authors: [{ name: 'DigiArtifact' }],
  openGraph: {
    title: 'DigiArtifact — The Digital Curiosity Shop',
    description: 'Premium digital assets for creators and dreamers.',
    url: 'https://digiartifact.com',
    siteName: 'DigiArtifact',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DigiArtifact',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigiArtifact — The Digital Curiosity Shop',
    description: 'Premium digital assets for creators and dreamers.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${spaceMono.variable} ${merriweather.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AudioProvider>
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <NavigationDeck />
            
            {/* Main Content */}
            <main className="flex-1 md:ml-64">
              {children}
            </main>
          </div>
          
          {/* Global Audio Player - Persistent across pages */}
          <GlobalAudioPlayer />
          
          {/* Footer */}
          <Footer />
        </AudioProvider>
      </body>
    </html>
  )
}
