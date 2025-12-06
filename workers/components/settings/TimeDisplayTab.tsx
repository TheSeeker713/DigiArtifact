'use client'

import { useSettings, TIMEZONE_OPTIONS } from '@/contexts/SettingsContext'

interface TimeDisplayTabProps {
  currentTime: Date
}

export default function TimeDisplayTab({ currentTime }: TimeDisplayTabProps) {
  const { timezone, timeFormat, setTimezone, setTimeFormat, formatTime, formatDate } = useSettings()

  return (
    <div className="space-y-6">
      {/* Time Zone Settings */}
      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Time Zone</h2>
        <p className="text-text-slate text-sm mb-6">
          Set your local time zone for accurate time tracking and display.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-sand mb-2">
              Select Time Zone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input-field w-full max-w-md"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="p-4 bg-obsidian/50 rounded-lg max-w-md">
            <p className="text-text-slate text-xs font-mono mb-2">Current time in selected zone:</p>
            <p className="text-relic-gold text-2xl font-mono">
              {formatTime(currentTime, { includeSeconds: true })}
            </p>
            <p className="text-sand text-sm mt-1">
              {formatDate(currentTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Time Format Settings */}
      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Time Format</h2>
        <p className="text-text-slate text-sm mb-6">
          Choose how times are displayed throughout the application.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setTimeFormat('12')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                timeFormat === '12'
                  ? 'border-relic-gold bg-relic-gold/10'
                  : 'border-baked-clay/30 hover:border-baked-clay/50'
              }`}
            >
              <div className="text-center">
                <p className={`text-2xl font-mono mb-2 ${
                  timeFormat === '12' ? 'text-relic-gold' : 'text-sand'
                }`}>
                  4:48 PM
                </p>
                <p className="text-text-slate text-sm">12-hour format</p>
                <p className="text-text-slate/70 text-xs mt-1">AM/PM notation</p>
              </div>
            </button>

            <button
              onClick={() => setTimeFormat('24')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                timeFormat === '24'
                  ? 'border-relic-gold bg-relic-gold/10'
                  : 'border-baked-clay/30 hover:border-baked-clay/50'
              }`}
            >
              <div className="text-center">
                <p className={`text-2xl font-mono mb-2 ${
                  timeFormat === '24' ? 'text-relic-gold' : 'text-sand'
                }`}>
                  16:48
                </p>
                <p className="text-text-slate text-sm">24-hour format</p>
                <p className="text-text-slate/70 text-xs mt-1">Military time</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder Sections */}
      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Date Format</h2>
        <p className="text-text-slate text-sm mb-4">Coming Soon</p>
        <p className="text-text-slate/70 text-xs">
          Choose between MM/DD/YYYY, DD/MM/YYYY, and other date formats.
        </p>
      </div>

      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Week Start</h2>
        <p className="text-text-slate text-sm mb-4">Coming Soon</p>
        <p className="text-text-slate/70 text-xs">
          Set whether your week starts on Sunday or Monday for weekly reports.
        </p>
      </div>

      {/* Smart Suggestions Settings */}
      <div className="card">
        <h2 className="font-heading text-xl text-relic-gold mb-4">Smart Suggestions</h2>
        <p className="text-text-slate text-sm mb-6">
          Get helpful suggestions while writing notes and reports. Suggestions appear based on 
          keywords in your text or when you pause for a moment.
        </p>

        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-obsidian/50 rounded-lg">
            <div>
              <p className="text-sand font-medium">Enable Smart Suggestions</p>
              <p className="text-text-slate text-xs mt-1">
                Show contextual suggestions in notes and reports
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                defaultChecked={true}
                onChange={(e) => {
                  localStorage.setItem('smart_suggestions_enabled', e.target.checked.toString())
                }}
              />
              <div className="w-11 h-6 bg-baked-clay/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-relic-gold/70"></div>
            </label>
          </div>

          {/* Idle Timeout */}
          <div className="p-4 bg-obsidian/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sand font-medium">Idle Suggestion Delay</p>
                <p className="text-text-slate text-xs mt-1">
                  How long to wait before showing a suggestion when you pause typing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                defaultValue="15"
                className="flex-1 h-2 bg-baked-clay/30 rounded-lg appearance-none cursor-pointer accent-relic-gold"
                onChange={(e) => {
                  localStorage.setItem('smart_suggestions_idle_timeout', e.target.value)
                  const label = document.getElementById('idle-timeout-label')
                  if (label) label.textContent = `${e.target.value} seconds`
                }}
              />
              <span id="idle-timeout-label" className="text-relic-gold font-mono text-sm w-24 text-right">
                15 seconds
              </span>
            </div>
          </div>

          {/* Suggestion Categories */}
          <div className="p-4 bg-obsidian/50 rounded-lg">
            <p className="text-sand font-medium mb-3">Suggestion Categories</p>
            <p className="text-text-slate text-xs mb-4">
              Choose which types of suggestions you'd like to see
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'productivity', label: '⚡ Productivity', default: true },
                { id: 'wellbeing', label: '💚 Wellbeing', default: true },
                { id: 'technical', label: '💻 Technical', default: true },
                { id: 'creative', label: '🎨 Creative', default: true },
                { id: 'blockers', label: '🚧 Blockers', default: true },
                { id: 'time_management', label: '⏰ Time', default: true },
              ].map(cat => (
                <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-obsidian/50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={cat.default}
                    className="w-4 h-4 rounded border-baked-clay/30 text-relic-gold focus:ring-relic-gold/50"
                    onChange={(e) => {
                      const saved = localStorage.getItem('smart_suggestions_categories')
                      const categories = saved ? JSON.parse(saved) : {}
                      categories[cat.id] = e.target.checked
                      localStorage.setItem('smart_suggestions_categories', JSON.stringify(categories))
                    }}
                  />
                  <span className="text-text-slate text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
