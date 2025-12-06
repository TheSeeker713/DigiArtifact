'use client'

interface AboutTabProps {
  // No props needed
}

export default function AboutTab({}: AboutTabProps) {
  return (
    <div className="card">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-relic-gold to-baked-clay flex items-center justify-center">
          <span className="font-heading text-obsidian font-bold text-3xl">D</span>
        </div>
        <h2 className="font-heading text-2xl text-relic-gold mb-2">DigiArtifact Workers Portal</h2>
        <p className="text-text-slate font-mono text-sm">Version 1.1.0</p>
      </div>

      <div className="space-y-6">
        <div className="border-t border-baked-clay/30 pt-6">
          <h3 className="font-heading text-lg text-sand mb-3">About This App</h3>
          <p className="text-text-slate text-sm leading-relaxed">
            The DigiArtifact Workers Portal is a time tracking and project management tool 
            designed to help you stay organized and productive. Track your work hours, 
            manage projects, and generate reports all in one place.
          </p>
        </div>

        <div className="border-t border-baked-clay/30 pt-6">
          <h3 className="font-heading text-lg text-sand mb-3">Technology Stack</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-obsidian/50 rounded-lg">
              <p className="text-relic-gold font-mono text-sm mb-1">Frontend</p>
              <p className="text-text-slate text-xs">Next.js 14 + React</p>
            </div>
            <div className="p-3 bg-obsidian/50 rounded-lg">
              <p className="text-relic-gold font-mono text-sm mb-1">Styling</p>
              <p className="text-text-slate text-xs">Tailwind CSS</p>
            </div>
            <div className="p-3 bg-obsidian/50 rounded-lg">
              <p className="text-relic-gold font-mono text-sm mb-1">Backend</p>
              <p className="text-text-slate text-xs">Cloudflare Workers</p>
            </div>
            <div className="p-3 bg-obsidian/50 rounded-lg">
              <p className="text-relic-gold font-mono text-sm mb-1">Database</p>
              <p className="text-text-slate text-xs">Cloudflare D1</p>
            </div>
          </div>
        </div>

        <div className="border-t border-baked-clay/30 pt-6">
          <h3 className="font-heading text-lg text-sand mb-3">Credits</h3>
          <p className="text-text-slate text-sm">
            Built with ❤️ by <span className="text-relic-gold">DigiArtifact</span> and <span className="text-relic-gold">J.W.</span>
          </p>
          <p className="text-text-slate text-xs mt-2">
            © 2025 DigiArtifact. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
