'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Download, FileArchive, Image, Music, Gamepad2, ExternalLink, CheckCircle, ArrowLeft, Shield } from 'lucide-react'

// Mock artifact data for demo
const mockVaultData = {
  orderId: 'DEMO-12345-ABCD',
  purchaseDate: '2025-01-15',
  customerEmail: 'demo@example.com',
  artifacts: [
    {
      id: '001',
      title: 'Dark Fantasy Coloring Collection',
      type: 'visual',
      files: [
        { name: 'dark-fantasy-pages.zip', size: '45 MB', url: '#' },
        { name: 'bonus-wallpapers.zip', size: '12 MB', url: '#' },
        { name: 'color-guide.pdf', size: '2 MB', url: '#' },
      ]
    }
  ]
}

export default function VaultDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [downloads, setDownloads] = useState<string[]>([])

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Simulate download
    setDownloads(prev => [...prev, fileName])
    // In production: window.location.href = fileUrl
    console.log('Downloading:', fileName)
  }

  const getFileIcon = (type: string) => {
    if (type === 'visual') return <Image className="w-5 h-5" />
    if (type === 'audio') return <Music className="w-5 h-5" />
    if (type === 'interactive') return <Gamepad2 className="w-5 h-5" />
    return <FileArchive className="w-5 h-5" />
  }

  return (
    <main className="min-h-screen pt-20 md:pt-8 px-4 sm:px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/vault')}
            className="flex items-center gap-2 text-slate-400 hover:text-gold transition-colors mb-6 font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vault Access
          </button>

          <div className="excavation-border bg-slate/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-gold" />
                  <h1 className="font-display text-3xl font-bold text-gold">
                    Your Vault
                  </h1>
                </div>
                <p className="text-slate-300 text-sm">
                  Access granted for order <span className="font-mono text-hologram-cyan">{orderId}</span>
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500">Purchase Date</p>
                <p className="text-sand font-mono">{mockVaultData.purchaseDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 px-3 py-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span className="font-mono">VERIFIED ACCESS</span>
            </div>
          </div>
        </div>

        {/* Artifacts Section */}
        <div className="space-y-6">
          {mockVaultData.artifacts.map(artifact => (
            <div key={artifact.id} className="excavation-border bg-slate/20 overflow-hidden">
              {/* Artifact Header */}
              <div className="p-6 bg-slate/40 border-b border-slate/50">
                <div className="flex items-center gap-3 mb-2">
                  {getFileIcon(artifact.type)}
                  <h2 className="font-display text-2xl text-gold">
                    {artifact.title}
                  </h2>
                </div>
                <p className="text-sm text-slate-400 font-mono">
                  {artifact.files.length} file(s) available for download
                </p>
              </div>

              {/* Files List */}
              <div className="p-6">
                <div className="space-y-3">
                  {artifact.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-obsidian rounded-lg border border-slate/50 hover:border-gold/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileArchive className="w-5 h-5 text-hologram-cyan flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-mono text-sand truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{file.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {downloads.includes(file.name) && (
                          <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Downloaded
                          </span>
                        )}
                        <button
                          onClick={() => handleDownload(file.url, file.name)}
                          className="px-4 py-2 bg-gold hover:bg-gold/80 text-obsidian rounded-lg 
                                   font-mono text-sm flex items-center gap-2 transition-colors flex-shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support & Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="excavation-border bg-slate/20 p-6">
            <h3 className="font-display text-lg text-gold mb-3">Need Help?</h3>
            <p className="text-slate-300 text-sm mb-4">
              Having trouble downloading your artifacts? Our support team is here to help.
            </p>
            <a
              href="mailto:support@digiartifact.com"
              className="inline-flex items-center gap-2 text-hologram-cyan hover:text-hologram-cyan/80 text-sm font-mono"
            >
              Contact Support
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="excavation-border bg-slate/20 p-6">
            <h3 className="font-display text-lg text-gold mb-3">Access Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Download Limit:</span>
                <span className="text-sand font-mono">Unlimited</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Access Expires:</span>
                <span className="text-sand font-mono">Never</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License:</span>
                <span className="text-sand font-mono">Personal Use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 excavation-border bg-gold/5 p-4">
          <p className="text-xs text-slate-400 font-mono text-center">
            <span className="text-hologram-cyan">[DEMO MODE]</span> In production, downloads would be served from Cloudflare R2 storage with signed URLs
          </p>
        </div>
      </div>
    </main>
  )
}
