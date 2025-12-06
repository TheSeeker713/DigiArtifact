'use client'

export default function DebugTab() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Debug Console</h2>
        <p className="text-text-slate text-sm mb-6">
          Monitor application errors, warnings, and debug information. The debug panel 
          also appears in the bottom-right corner when errors occur.
        </p>
        
        <div className="space-y-4">
          {/* Debug Features Info */}
          <div className="p-4 bg-obsidian/50 rounded-lg">
            <h3 className="text-sand font-mono text-sm mb-3">Features</h3>
            <ul className="text-text-slate text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-relic-gold">•</span>
                <span>Automatic error and warning capture from JavaScript runtime</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-relic-gold">•</span>
                <span>Unhandled promise rejection tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-relic-gold">•</span>
                <span>Floating alert button when new errors occur</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-relic-gold">•</span>
                <span>Copy logs to clipboard or export as JSON</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-relic-gold">•</span>
                <span>Filter by log level (info, warning, error, debug)</span>
              </li>
            </ul>
          </div>
          
          {/* Open Debug Panel Button */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                // Dispatch event to open debug panel
                window.dispatchEvent(new CustomEvent('open-debug-panel'))
              }}
              className="btn-rune flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Open Debug Panel
            </button>
            
            <button
              onClick={() => {
                // Test error logging
                console.error('Test error from Debug Settings')
              }}
              className="px-4 py-2 text-sm bg-status-offline/20 hover:bg-status-offline/30 text-status-offline rounded-lg transition-colors"
            >
              Test Error Log
            </button>
          </div>
          
          {/* Keyboard shortcut info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                The debug panel button appears in the bottom-right corner of the screen. 
                It pulses and turns red/amber when there are unread errors or warnings.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
